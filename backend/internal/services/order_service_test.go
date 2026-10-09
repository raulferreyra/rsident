package services

import (
	"testing"

	"github.com/raulferreyra/rsident/backend/internal/models"
)

func TestValidateCreateOrderAllowsSimpleProduct(t *testing.T) {
	request := models.CreateOrderRequest{
		CustomerEmail: "buyer@example.com",
		ShippingZone:  "lima_metropolitana",
		Address:       "Av. Ejemplo 123",
		PickupName:    "Comprador",
		PickupDNI:     "12345678",
		Items:         []models.CreateOrderItem{{ProductID: "simple-product", Quantity: 2}},
	}
	if err := validateCreateOrder(request); err != nil {
		t.Fatalf("simple product without variant should be valid: %v", err)
	}
}

func TestValidateCreateOrderRejectsNonPositiveQuantity(t *testing.T) {
	request := models.CreateOrderRequest{
		CustomerEmail: "buyer@example.com",
		Address:       "Av. Ejemplo 123",
		PickupName:    "Comprador",
		PickupDNI:     "12345678",
		Items:         []models.CreateOrderItem{{ProductID: "product", Quantity: 0}},
	}
	if err := validateCreateOrder(request); err == nil {
		t.Fatal("expected zero quantity to be rejected")
	}
}

func TestNormalizeItemsMergesSameProductAndVariant(t *testing.T) {
	input := []models.CreateOrderItem{
		{ProductID: "p1", VariantID: "v1", Quantity: 1},
		{ProductID: "p1", VariantID: "v1", Quantity: 2},
		{ProductID: "p1", Quantity: 1},
	}
	got := normalizeItems(input)
	if len(got) != 2 {
		t.Fatalf("expected 2 normalized items, got %d", len(got))
	}
	if got[0].Quantity != 3 || got[1].Quantity != 1 {
		t.Fatalf("unexpected quantities: %#v", got)
	}
}
