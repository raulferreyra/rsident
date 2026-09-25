package services

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"cloud.google.com/go/firestore"

	"github.com/raulferreyra/rsident/backend/internal/logging"
	"github.com/raulferreyra/rsident/backend/internal/models"
)

type OrderService struct {
	db     *firestore.Client
	mailer *Mailer
}

var dniPattern = regexp.MustCompile(`^\d{8}$`)

var shippingCosts = map[string]float64{
	"lima_metropolitana": 12,
	"lima_provincias":    15,
	"otras_provincias":   12,
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

func (s *OrderService) Create(
	ctx context.Context,
	orderID string,
	request models.CreateOrderRequest,
	paymentProofURL string,
) (*models.Order, error) {
	if err := validateOrderRequest(request); err != nil {
		return nil, err
	}

	shippingCost, ok := shippingCosts[request.ShippingZone]
	if !ok {
		return nil, fmt.Errorf("zona de envío inválida")
	}

	if orderID == "" {
		return nil, fmt.Errorf("ID de pedido inválido")
	}

	orderNumber := fmt.Sprintf(
		"RS-%s-%s",
		time.Now().Format("20060102"),
		strings.ToUpper(strings.Split(orderID, "-")[0]),
	)

	orderRef := s.db.Collection("orders").Doc(orderID)
	now := time.Now()

	var order models.Order

	normalizedItems := normalizeItems(request.Items)

	err := s.db.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		productIDs := make([]string, 0)
		seenProducts := make(map[string]bool)
		for _, item := range normalizedItems {
			if !seenProducts[item.ProductID] {
				seenProducts[item.ProductID] = true
				productIDs = append(productIDs, item.ProductID)
			}
		}

		type productState struct {
			ref     *firestore.DocumentRef
			product models.Product
		}

		states := make(map[string]productState, len(productIDs))

		for _, productID := range productIDs {
			ref := s.db.Collection("products").Doc(productID)
			doc, err := tx.Get(ref)
			if err != nil {
				return fmt.Errorf("producto %s no encontrado", productID)
			}

			var product models.Product
			if err := doc.DataTo(&product); err != nil {
				return fmt.Errorf("error leyendo producto %s: %w", productID, err)
			}

			if !product.Published {
				return fmt.Errorf("el producto %s ya no está disponible", product.Name)
			}

			states[productID] = productState{
				ref:     ref,
				product: product,
			}
		}

		items := make([]models.OrderItem, 0, len(request.Items))
		productsSubtotal := 0.0
		updatedVariants := make(map[string][]models.ProductVariant)

		for _, requestItem := range normalizedItems {
			state := states[requestItem.ProductID]
			quantity := requestItem.Quantity

			variantIndex := -1
			for index, variant := range state.product.Variants {
				if variant.ID == requestItem.VariantID {
					variantIndex = index
					break
				}
			}

			if variantIndex < 0 {
				return fmt.Errorf("la variante seleccionada de %s ya no existe", state.product.Name)
			}

			variant := state.product.Variants[variantIndex]
			if variant.Stock < quantity {
				return fmt.Errorf(
					"stock insuficiente para %s. Disponible: %d, solicitado: %d",
					state.product.Name,
					variant.Stock,
					quantity,
				)
			}

			if _, exists := updatedVariants[requestItem.ProductID]; !exists {
				updatedVariants[requestItem.ProductID] = append(
					[]models.ProductVariant(nil),
					state.product.Variants...,
				)
			}

			updated := updatedVariants[requestItem.ProductID]
			updated[variantIndex].Stock -= quantity
			updatedVariants[requestItem.ProductID] = updated

			colorName := ""
			for _, color := range state.product.Colors {
				if color.ID == variant.ColorID {
					colorName = color.Name
					break
				}
			}

			imageURL := ""
			if len(state.product.Images) > 0 {
				imageURL = state.product.Images[0].URL
			}

			subtotal := state.product.Price * float64(quantity)
			productsSubtotal += subtotal

			items = append(items, models.OrderItem{
				ProductID: requestItem.ProductID,
				VariantID: requestItem.VariantID,
				Name:      state.product.Name,
				SKU:       variant.SKU,
				Color:     colorName,
				Size:      variant.Size,
				ImageURL:  imageURL,
				Quantity:  quantity,
				UnitPrice: state.product.Price,
				Subtotal:  subtotal,
			})
		}

		for productID, variants := range updatedVariants {
			state := states[productID]
			if err := tx.Set(
				state.ref,
				map[string]interface{}{
					"variants":  variants,
					"updatedAt": now,
				},
				firestore.MergeAll,
			); err != nil {
				return fmt.Errorf("error actualizando stock de %s: %w", state.product.Name, err)
			}
		}

		order = models.Order{
			ID:               orderID,
			OrderNumber:      orderNumber,
			CustomerEmail:    request.Email,
			Address:          request.Address,
			ShippingZone:     request.ShippingZone,
			ShippingCarrier:  "Shalom",
			ShippingCost:     shippingCost,
			PickupName:       request.PickupName,
			PickupDNI:        request.PickupDNI,
			Items:            items,
			ProductsSubtotal: productsSubtotal,
			Total:            productsSubtotal + shippingCost,
			PaymentProofURL:  paymentProofURL,
			Status:           "pending_review",
			PaymentStatus:    "pending_review",
			CreatedAt:        now,
			UpdatedAt:        now,
		}

		return tx.Create(orderRef, order)
	})

	if err != nil {
		return nil, err
	}

	logging.App.Printf(
		"Order created number=%s total=%.2f items=%d",
		order.OrderNumber,
		order.Total,
		len(order.Items),
	)

	customerSent, companySent := false, false
	if s.mailer != nil {
		customerSent, companySent = s.mailer.SendOrderEmails(order)
	}

	updates := map[string]interface{}{
		"customerEmailSent": customerSent,
		"companyEmailSent":  companySent,
		"updatedAt":         time.Now(),
	}

	if _, err := orderRef.Set(ctx, updates, firestore.MergeAll); err != nil {
		logging.Error.Printf(
			"No se pudo actualizar estado de emails del pedido %s: %v",
			order.OrderNumber,
			err,
		)
	}

	order.CustomerEmailSent = customerSent
	order.CompanyEmailSent = companySent
	order.UpdatedAt = time.Now()

	return &order, nil
}

func normalizeItems(items []models.CreateOrderItem) []models.CreateOrderItem {
	result := make([]models.CreateOrderItem, 0, len(items))
	indexes := make(map[string]int)

	for _, item := range items {
		key := item.ProductID + ":" + item.VariantID
		if index, exists := indexes[key]; exists {
			result[index].Quantity += item.Quantity
			continue
		}

		indexes[key] = len(result)
		result = append(result, item)
	}

	return result
}

func validateOrderRequest(request models.CreateOrderRequest) error {
	if strings.TrimSpace(request.Email) == "" || !strings.Contains(request.Email, "@") {
		return fmt.Errorf("el correo electrónico es obligatorio y debe ser válido")
	}

	if strings.TrimSpace(request.Address) == "" {
		return fmt.Errorf("la dirección es obligatoria")
	}

	if strings.TrimSpace(request.PickupName) == "" {
		return fmt.Errorf("los nombres completos de la persona que recogerá el pedido son obligatorios")
	}

	if !dniPattern.MatchString(request.PickupDNI) {
		return fmt.Errorf("el DNI debe tener 8 dígitos")
	}

	if len(request.Items) == 0 {
		return fmt.Errorf("el carrito está vacío")
	}

	for _, item := range request.Items {
		if item.ProductID == "" || item.VariantID == "" {
			return fmt.Errorf("cada producto debe tener una variante válida")
		}

		if item.Quantity <= 0 {
			return fmt.Errorf("la cantidad de cada producto debe ser mayor que cero")
		}
	}

	return nil
}
