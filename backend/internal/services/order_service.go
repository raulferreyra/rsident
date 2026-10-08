package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
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

	orderRef := s.db.Collection("orders").NewDoc()
	now := time.Now().UTC()

	items := normalizeItems(request.Items)

	var createdOrder models.Order

	err := s.db.RunTransaction(ctx, func(
		ctx context.Context,
		tx *firestore.Transaction,
	) error {
		var orderItems []models.OrderItem

		subtotal := 0.0

		for _, requestedItem := range items {
			productRef := s.db.
				Collection("products").
				Doc(requestedItem.ProductID)

			productSnap, err := tx.Get(productRef)

			if err != nil {
				return fmt.Errorf(
					"producto no encontrado: %s",
					requestedItem.ProductID,
				)
			}

			var product struct {
				Name      string                  `firestore:"name"`
				Price     float64                 `firestore:"price"`
				Published bool                    `firestore:"published"`
				Images    []models.ProductImage   `firestore:"images"`
				Variants  []models.ProductVariant `firestore:"variants"`
				Colors    []models.ProductColor   `firestore:"colors"`
			}

			if err := productSnap.DataTo(&product); err != nil {
				return fmt.Errorf(
					"error leyendo producto %s: %w",
					requestedItem.ProductID,
					err,
				)
			}

			if !product.Published {
				return fmt.Errorf(
					"el producto %s no está disponible",
					product.Name,
				)
			}

			variantIndex := -1

			for index, variant := range product.Variants {
				if variant.ID == requestedItem.VariantID {
					variantIndex = index
					break
				}
			}

			if variantIndex < 0 {
				return fmt.Errorf(
					"la variante seleccionada ya no existe",
				)
			}

			variant := product.Variants[variantIndex]

			if variant.Stock < requestedItem.Quantity {
				return fmt.Errorf(
					"stock insuficiente para %s",
					product.Name,
				)
			}

			colorName := ""

			for _, color := range product.Colors {
				if color.ID == variant.ColorID {
					colorName = color.Name
					break
				}
			}

			imageURL := ""

			if len(product.Images) > 0 {
				imageURL = product.Images[0].URL
			}

			unitPrice := product.Price
			itemSubtotal := unitPrice *
				float64(requestedItem.Quantity)

			orderItems = append(
				orderItems,
				models.OrderItem{
					ProductID:   requestedItem.ProductID,
					VariantID:   requestedItem.VariantID,
					ProductName: product.Name,
					ColorName:   colorName,
					Size:        variant.Size,
					SKU:         variant.SKU,
					ImageURL:    imageURL,
					Quantity:    requestedItem.Quantity,
					UnitPrice:   unitPrice,
					Subtotal:    itemSubtotal,
				},
			)

			subtotal += itemSubtotal

			product.Variants[variantIndex].Stock -=
				requestedItem.Quantity

			tx.Set(
				productRef,
				map[string]interface{}{
					"variants":  product.Variants,
					"updatedAt": now,
				},
				firestore.MergeAll,
			)
		}

		createdOrder = models.Order{
			ID:          orderRef.ID,
			OrderNumber: generateOrderNumber(now),
			CustomerEmail: strings.TrimSpace(
				request.CustomerEmail,
			),
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

		err := tx.Create(
			orderRef,
			createdOrder,
		)

		return err
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

		_, _ = s.db.
			Collection("orders").
			Doc(createdOrder.ID).
			Set(
				ctx,
				update,
				firestore.MergeAll,
			)

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
				if err := restoreStock(
					ctx,
					tx,
					s.db,
					result.Items,
				); err != nil {
					return err
				}

				result.PaymentStatus =
					PaymentStatusRejected

				result.OrderStatus =
					OrderStatusRejected

				result.UpdatedAt = now

				tx.Set(
					orderRef,
					map[string]interface{}{
						"paymentStatus": PaymentStatusRejected,
						"orderStatus":   OrderStatusRejected,
						"updatedAt":     now,
					},
					firestore.MergeAll,
				)

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

			if status == OrderStatusCancelled {
				if currentStatus == OrderStatusCancelled ||
					currentStatus == OrderStatusRejected {
					return nil
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
	for _, item := range items {
		productRef := db.
			Collection("products").
			Doc(item.ProductID)

		doc, err := tx.Get(productRef)

		if err != nil {
			return err
		}

		var product struct {
			Variants []models.ProductVariant `firestore:"variants"`
		}

		if err := doc.DataTo(&product); err != nil {
			return err
		}

		found := false

		for index := range product.Variants {
			if product.Variants[index].ID ==
				item.VariantID {

				product.Variants[index].Stock +=
					item.Quantity

				found = true
				break
			}
		}

		if !found {
			return fmt.Errorf(
				"no se encontró la variante %s para restaurar stock",
				item.VariantID,
			)
		}

		tx.Set(
			productRef,
			map[string]interface{}{
				"variants":  product.Variants,
				"updatedAt": time.Now().UTC(),
			},
			firestore.MergeAll,
		)
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
		request.CustomerEmail,
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
		if item.ProductID == "" ||
			item.VariantID == "" {
			return fmt.Errorf(
				"cada producto debe tener una variante válida",
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
		OrderStatusCancelled,
		OrderStatusRejected:
		return true
	default:
		return false
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
