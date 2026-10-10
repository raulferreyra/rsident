package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/raulferreyra/rsident/backend/internal/logging"
	"github.com/raulferreyra/rsident/backend/internal/models"
	"google.golang.org/api/iterator"
)

type OrderService struct {
	db     *firestore.Client
	mailer *Mailer
}

func NewOrderService(
	db *firestore.Client,
	mailer *Mailer,
) *OrderService {
	return &OrderService{
		db:     db,
		mailer: mailer,
	}
}

var shippingCosts = map[string]float64{
	"lima_metropolitana": 12,
	"lima_provincias":    15,
	"otras_provincias":   12,
}

func (s *OrderService) Create(
	ctx context.Context,
	request models.CreateOrderRequest,
	paymentProofURL string,
) (*models.Order, error) {
	if err := validateCreateOrder(request); err != nil {
		return nil, err
	}

	shippingCost, ok := shippingCosts[request.ShippingZone]
	if !ok {
		return nil, fmt.Errorf("zona de envío inválida")
	}

	items := normalizeItems(request.Items)
	orderRef := s.db.Collection("orders").NewDoc()
	now := time.Now().UTC()
	var createdOrder models.Order

	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		type productState struct {
			ref     *firestore.DocumentRef
			product struct {
				Name      string                  `firestore:"name"`
				Price     float64                 `firestore:"price"`
				Stock     int                     `firestore:"stock"`
				Published bool                    `firestore:"published"`
				Images    []models.ProductImage   `firestore:"images"`
				Variants  []models.ProductVariant `firestore:"variants"`
				Colors    []models.ProductColor   `firestore:"colors"`
			}
		}

		states := make(map[string]*productState, len(items))
		// Todas las lecturas ocurren antes de cualquier escritura de la transacción.
		for _, requestedItem := range items {
			if _, exists := states[requestedItem.ProductID]; exists {
				continue
			}
			ref := s.db.Collection("products").Doc(requestedItem.ProductID)
			snap, err := tx.Get(ref)
			if err != nil {
				return fmt.Errorf("producto no encontrado: %s", requestedItem.ProductID)
			}
			state := &productState{ref: ref}
			if err := snap.DataTo(&state.product); err != nil {
				return fmt.Errorf("error leyendo producto %s: %w", requestedItem.ProductID, err)
			}
			if !state.product.Published {
				return fmt.Errorf("el producto %s no está disponible", state.product.Name)
			}
			states[requestedItem.ProductID] = state
		}

		orderItems := make([]models.OrderItem, 0, len(items))
		subtotal := 0.0
		for _, requestedItem := range items {
			state := states[requestedItem.ProductID]
			product := &state.product
			colorName, size, sku, variantID, imageURL := "", "", "", "", ""
			if len(product.Images) > 0 {
				imageURL = product.Images[0].URL
			}

			if len(product.Variants) == 0 {
				if requestedItem.VariantID != "" {
					return fmt.Errorf("el producto %s no utiliza variantes", product.Name)
				}
				if product.Stock < requestedItem.Quantity {
					return fmt.Errorf("stock insuficiente para %s", product.Name)
				}
				product.Stock -= requestedItem.Quantity
			} else {
				if requestedItem.VariantID == "" {
					return fmt.Errorf("selecciona una variante para %s", product.Name)
				}
				variantIndex := -1
				for index := range product.Variants {
					if product.Variants[index].ID == requestedItem.VariantID {
						variantIndex = index
						break
					}
				}
				if variantIndex < 0 {
					return fmt.Errorf("la variante seleccionada ya no existe")
				}
				variant := &product.Variants[variantIndex]
				if variant.Stock < requestedItem.Quantity {
					return fmt.Errorf("stock insuficiente para %s", product.Name)
				}
				variant.Stock -= requestedItem.Quantity
				variantID, size, sku = variant.ID, variant.Size, variant.SKU
				for _, color := range product.Colors {
					if color.ID == variant.ColorID {
						colorName = color.Name
						if color.ImageURL != "" {
							imageURL = color.ImageURL
						}
						break
					}
				}
			}

			lineSubtotal := product.Price * float64(requestedItem.Quantity)
			orderItems = append(orderItems, models.OrderItem{
				ProductID:   requestedItem.ProductID,
				VariantID:   variantID,
				ProductName: product.Name,
				ColorName:   colorName,
				Size:        size,
				SKU:         sku,
				ImageURL:    imageURL,
				Quantity:    requestedItem.Quantity,
				UnitPrice:   product.Price,
				Subtotal:    lineSubtotal,
			})
			subtotal += lineSubtotal
		}

		for _, state := range states {
			updates := map[string]interface{}{"updatedAt": now}
			if len(state.product.Variants) == 0 {
				updates["stock"] = state.product.Stock
			} else {
				updates["variants"] = state.product.Variants
			}
			tx.Set(state.ref, updates, firestore.MergeAll)
		}

		createdOrder = models.Order{
			ID:              orderRef.ID,
			OrderNumber:     generateOrderNumber(now),
			CustomerEmail:   strings.ToLower(strings.TrimSpace(request.CustomerEmail)),
			ShippingZone:    request.ShippingZone,
			ShippingCost:    shippingCost,
			Address:         strings.TrimSpace(request.Address),
			PickupName:      strings.TrimSpace(request.PickupName),
			PickupDNI:       strings.TrimSpace(request.PickupDNI),
			Courier:         "Shalom",
			Items:           orderItems,
			Subtotal:        subtotal,
			Total:           subtotal + shippingCost,
			PaymentProofURL: paymentProofURL,
			PaymentStatus:   PaymentStatusPendingReview,
			OrderStatus:     OrderStatusPendingReview,
			ReceiptStatus:   ReceiptStatusPending,
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		return tx.Create(orderRef, createdOrder)
	})
	if err != nil {
		return nil, err
	}

	if s.mailer != nil {
		customerSent, companySent := s.mailer.SendOrderEmails(createdOrder)
		update := map[string]interface{}{
			"customerEmailSent": customerSent,
			"companyEmailSent":  companySent,
			"updatedAt":         time.Now().UTC(),
		}
		if _, updateErr := s.db.Collection("orders").Doc(createdOrder.ID).Set(ctx, update, firestore.MergeAll); updateErr != nil {
			logging.Error.Printf("No se pudo actualizar el estado de los correos del pedido %s: %v", createdOrder.OrderNumber, updateErr)
		}
		createdOrder.CustomerEmailSent = customerSent
		createdOrder.CompanyEmailSent = companySent
	}
	return &createdOrder, nil
}

func (s *OrderService) List(
	ctx context.Context,
) ([]models.Order, error) {
	iter := s.db.
		Collection("orders").
		OrderBy(
			"createdAt",
			firestore.Desc,
		).
		Documents(ctx)

	defer iter.Stop()

	var orders []models.Order

	for {
		doc, err := iter.Next()

		if err == iterator.Done {
			break
		}

		if err != nil {
			return nil, err
		}

		var order models.Order

		if err := doc.DataTo(&order); err != nil {
			return nil, err
		}

		order.ID = doc.Ref.ID

		orders = append(
			orders,
			order,
		)
	}

	if orders == nil {
		orders = []models.Order{}
	}

	return orders, nil
}

func (s *OrderService) Get(
	ctx context.Context,
	id string,
) (*models.Order, error) {
	doc, err := s.db.
		Collection("orders").
		Doc(id).
		Get(ctx)

	if err != nil {
		return nil, err
	}

	var order models.Order

	if err := doc.DataTo(&order); err != nil {
		return nil, err
	}

	order.ID = doc.Ref.ID

	return &order, nil
}

func (s *OrderService) FindCustomerOrder(
	ctx context.Context,
	orderNumber string,
	email string,
) (*models.Order, error) {
	orderNumber = strings.TrimSpace(orderNumber)
	email = strings.ToLower(
		strings.TrimSpace(email),
	)

	if orderNumber == "" || email == "" {
		return nil, fmt.Errorf(
			"número de pedido y correo son obligatorios",
		)
	}

	iter := s.db.
		Collection("orders").
		Where(
			"orderNumber",
			"==",
			orderNumber,
		).
		Limit(1).
		Documents(ctx)

	defer iter.Stop()

	doc, err := iter.Next()

	if err != nil {
		if err == iterator.Done {
			return nil, fmt.Errorf(
				"pedido no encontrado",
			)
		}

		return nil, err
	}

	var order models.Order

	if err := doc.DataTo(&order); err != nil {
		return nil, err
	}

	if strings.ToLower(
		strings.TrimSpace(order.CustomerEmail),
	) != email {
		return nil, fmt.Errorf(
			"pedido no encontrado",
		)
	}

	order.ID = doc.Ref.ID

	order.PaymentProofURL = ""

	return &order, nil
}

func (s *OrderService) ApprovePayment(
	ctx context.Context,
	id string,
) (*models.Order, error) {
	return s.updatePayment(
		ctx,
		id,
		PaymentStatusApproved,
	)
}

func (s *OrderService) RejectPayment(
	ctx context.Context,
	id string,
) (*models.Order, error) {
	return s.updatePayment(
		ctx,
		id,
		PaymentStatusRejected,
	)
}

func (s *OrderService) updatePayment(
	ctx context.Context,
	id string,
	status string,
) (*models.Order, error) {
	orderRef := s.db.
		Collection("orders").
		Doc(id)

	var result models.Order

	err := s.db.RunTransaction(
		ctx,
		func(
			ctx context.Context,
			tx *firestore.Transaction,
		) error {
			doc, err := tx.Get(orderRef)

			if err != nil {
				return err
			}

			if err := doc.DataTo(&result); err != nil {
				return err
			}

			result.ID = id

			currentPayment :=
				normalizePaymentStatus(
					result.PaymentStatus,
				)

			if currentPayment == status {
				return nil
			}

			if currentPayment != PaymentStatusPendingReview {
				return fmt.Errorf(
					"el pago ya fue procesado",
				)
			}

			now := time.Now().UTC()

			if status == PaymentStatusApproved {
				currentOrderStatus := normalizeOrderStatus(result.OrderStatus)
				if currentOrderStatus == OrderStatusCancelled || currentOrderStatus == OrderStatusRejected {
					return fmt.Errorf("no se puede aprobar el pago de un pedido cancelado o rechazado")
				}
				result.PaymentStatus =
					PaymentStatusApproved

				result.OrderStatus =
					OrderStatusConfirmed

				result.UpdatedAt = now

				tx.Set(
					orderRef,
					map[string]interface{}{
						"paymentStatus": PaymentStatusApproved,
						"orderStatus":   OrderStatusConfirmed,
						"updatedAt":     now,
					},
					firestore.MergeAll,
				)

				return nil
			}

			if status == PaymentStatusRejected {
				// Cancelar ya devuelve el inventario. Si después se rechaza
				// el pago, no se debe restaurar por segunda vez.
				currentOrderStatus := normalizeOrderStatus(result.OrderStatus)
				if shouldRestoreStockOnPaymentRejection(currentOrderStatus) {
					if err := restoreStock(ctx, tx, s.db, result.Items); err != nil {
						return err
					}
				}

				result.PaymentStatus = PaymentStatusRejected
				if currentOrderStatus != OrderStatusCancelled {
					result.OrderStatus = OrderStatusRejected
				}
				result.UpdatedAt = now

				updates := map[string]interface{}{
					"paymentStatus": PaymentStatusRejected,
					"updatedAt":     now,
				}
				if currentOrderStatus != OrderStatusCancelled {
					updates["orderStatus"] = OrderStatusRejected
				}
				tx.Set(orderRef, updates, firestore.MergeAll)
				return nil
			}

			return fmt.Errorf(
				"estado de pago inválido",
			)
		},
	)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *OrderService) UpdateOrderStatus(
	ctx context.Context,
	id string,
	status string,
) (*models.Order, error) {
	if !isValidOrderStatus(status) {
		return nil, fmt.Errorf(
			"estado de pedido inválido",
		)
	}

	orderRef := s.db.
		Collection("orders").
		Doc(id)

	var result models.Order

	err := s.db.RunTransaction(
		ctx,
		func(
			ctx context.Context,
			tx *firestore.Transaction,
		) error {
			doc, err := tx.Get(orderRef)

			if err != nil {
				return err
			}

			if err := doc.DataTo(&result); err != nil {
				return err
			}

			result.ID = id

			currentStatus :=
				normalizeOrderStatus(
					result.OrderStatus,
				)

			if currentStatus == status {
				return nil
			}
			if currentStatus == OrderStatusCancelled || currentStatus == OrderStatusRejected {
				return fmt.Errorf("no se puede cambiar el estado de un pedido cancelado o rechazado")
			}

			if status == OrderStatusCancelled {
				if err := validateOrderCancellation(currentStatus); err != nil {
					return err
				}

				if err := restoreStock(
					ctx,
					tx,
					s.db,
					result.Items,
				); err != nil {
					return err
				}
			}

			now := time.Now().UTC()

			result.OrderStatus = status
			result.UpdatedAt = now

			tx.Set(
				orderRef,
				map[string]interface{}{
					"orderStatus": status,
					"updatedAt":   now,
				},
				firestore.MergeAll,
			)

			return nil
		},
	)

	if err != nil {
		return nil, err
	}

	return &result, nil
}

func (s *OrderService) UpdateReceiptStatus(
	ctx context.Context,
	id string,
	status string,
) (*models.Order, error) {
	if status != ReceiptStatusPending &&
		status != ReceiptStatusSent {
		return nil, fmt.Errorf(
			"estado de boleta inválido",
		)
	}

	ref := s.db.
		Collection("orders").
		Doc(id)

	now := time.Now().UTC()

	_, err := ref.Set(
		ctx,
		map[string]interface{}{
			"receiptStatus": status,
			"updatedAt":     now,
		},
		firestore.MergeAll,
	)

	if err != nil {
		return nil, err
	}

	return s.Get(ctx, id)
}

func restoreStock(
	ctx context.Context,
	tx *firestore.Transaction,
	db *firestore.Client,
	items []models.OrderItem,
) error {
	type stockState struct {
		ref      *firestore.DocumentRef
		stock    int
		variants []models.ProductVariant
	}
	states := make(map[string]*stockState)
	for _, item := range items {
		if _, exists := states[item.ProductID]; exists {
			continue
		}
		ref := db.Collection("products").Doc(item.ProductID)
		doc, err := tx.Get(ref)
		if err != nil {
			return err
		}
		var product struct {
			Stock    int                     `firestore:"stock"`
			Variants []models.ProductVariant `firestore:"variants"`
		}
		if err := doc.DataTo(&product); err != nil {
			return err
		}
		states[item.ProductID] = &stockState{ref: ref, stock: product.Stock, variants: product.Variants}
	}

	for _, item := range items {
		state := states[item.ProductID]
		if item.VariantID == "" {
			if len(state.variants) > 0 {
				return fmt.Errorf("el producto %s ahora tiene variantes; no se puede restaurar stock simple", item.ProductID)
			}
			state.stock += item.Quantity
			continue
		}
		found := false
		for i := range state.variants {
			if state.variants[i].ID == item.VariantID {
				state.variants[i].Stock += item.Quantity
				found = true
				break
			}
		}
		if !found {
			return fmt.Errorf("no se encontró la variante %s para restaurar stock", item.VariantID)
		}
	}

	now := time.Now().UTC()
	for _, state := range states {
		updates := map[string]interface{}{"updatedAt": now}
		if len(state.variants) == 0 {
			updates["stock"] = state.stock
		} else {
			updates["variants"] = state.variants
		}
		tx.Set(state.ref, updates, firestore.MergeAll)
	}
	return nil
}

func normalizeItems(
	items []models.CreateOrderItem,
) []models.CreateOrderItem {
	result := make([]models.CreateOrderItem, 0)

	indexes := make(
		map[string]int,
	)

	for _, item := range items {
		key := item.ProductID +
			":" +
			item.VariantID

		if index, ok := indexes[key]; ok {
			result[index].Quantity += item.Quantity
			continue
		}

		indexes[key] = len(result)

		result = append(
			result,
			item,
		)
	}

	return result
}

func validateCreateOrder(
	request models.CreateOrderRequest,
) error {
	if !strings.Contains(
		strings.TrimSpace(request.CustomerEmail),
		"@",
	) {
		return fmt.Errorf(
			"correo electrónico inválido",
		)
	}

	if strings.TrimSpace(
		request.Address,
	) == "" {
		return fmt.Errorf(
			"la dirección es obligatoria",
		)
	}

	if strings.TrimSpace(
		request.PickupName,
	) == "" {
		return fmt.Errorf(
			"el nombre de quien recibe es obligatorio",
		)
	}

	if strings.TrimSpace(
		request.PickupDNI,
	) == "" {
		return fmt.Errorf(
			"el DNI es obligatorio",
		)
	}

	if len(request.Items) == 0 {
		return fmt.Errorf(
			"el carrito está vacío",
		)
	}

	for _, item := range request.Items {
		if strings.TrimSpace(item.ProductID) == "" {
			return fmt.Errorf(
				"cada producto debe tener un ID válido",
			)
		}

		if item.Quantity <= 0 {
			return fmt.Errorf(
				"la cantidad debe ser mayor que cero",
			)
		}
	}

	return nil
}

func generateOrderNumber(
	t time.Time,
) string {
	return fmt.Sprintf(
		"RS-%s-%04d",
		t.Format("20060102"),
		t.UnixNano()%10000,
	)
}

func isValidOrderStatus(
	status string,
) bool {
	switch status {
	case OrderStatusPendingReview,
		OrderStatusConfirmed,
		OrderStatusPreparing,
		OrderStatusShipped,
		OrderStatusDelivered,
		OrderStatusCancelled:
		return true
	default:
		return false
	}
}

func shouldRestoreStockOnPaymentRejection(orderStatus string) bool {
	status := normalizeOrderStatus(orderStatus)
	return status != OrderStatusCancelled && status != OrderStatusRejected
}

func validateOrderCancellation(currentStatus string) error {
	switch normalizeOrderStatus(currentStatus) {
	case OrderStatusCancelled, OrderStatusRejected:
		return fmt.Errorf("el pedido ya está cancelado o rechazado")
	case OrderStatusShipped, OrderStatusDelivered:
		return fmt.Errorf("no se puede cancelar un pedido enviado o entregado")
	default:
		return nil
	}
}

func normalizePaymentStatus(
	status string,
) string {
	if status == "" {
		return PaymentStatusPendingReview
	}

	return status
}

func normalizeOrderStatus(
	status string,
) string {
	if status == "" {
		return OrderStatusPendingReview
	}

	return status
}
