package models

import "time"

type CreateOrderItem struct {
	ProductID string `json:"productId"`
	VariantID string `json:"variantId"`
	Quantity  int    `json:"quantity"`
}

type CreateOrderRequest struct {
	Email           string            `json:"email"`
	Address         string            `json:"address"`
	ShippingZone    string            `json:"shippingZone"`
	ShippingCarrier string            `json:"shippingCarrier"`
	PickupName      string            `json:"pickupName"`
	PickupDNI       string            `json:"pickupDNI"`
	Items           []CreateOrderItem `json:"items"`
}

type OrderItem struct {
	ProductID string  `json:"productId" firestore:"productId"`
	VariantID string  `json:"variantId" firestore:"variantId"`
	Name      string  `json:"name" firestore:"name"`
	SKU       string  `json:"sku" firestore:"sku"`
	Color     string  `json:"color" firestore:"color"`
	Size      string  `json:"size" firestore:"size"`
	ImageURL  string  `json:"imageUrl" firestore:"imageUrl"`
	Quantity  int     `json:"quantity" firestore:"quantity"`
	UnitPrice float64 `json:"unitPrice" firestore:"unitPrice"`
	Subtotal  float64 `json:"subtotal" firestore:"subtotal"`
}

type Order struct {
	ID                string      `json:"id" firestore:"-"`
	OrderNumber       string      `json:"orderNumber" firestore:"orderNumber"`
	CustomerEmail     string      `json:"email" firestore:"email"`
	Address           string      `json:"address" firestore:"address"`
	ShippingZone      string      `json:"shippingZone" firestore:"shippingZone"`
	ShippingCarrier   string      `json:"shippingCarrier" firestore:"shippingCarrier"`
	ShippingCost      float64     `json:"shippingCost" firestore:"shippingCost"`
	PickupName        string      `json:"pickupName" firestore:"pickupName"`
	PickupDNI         string      `json:"pickupDNI" firestore:"pickupDNI"`
	Items             []OrderItem `json:"items" firestore:"items"`
	ProductsSubtotal  float64     `json:"productsSubtotal" firestore:"productsSubtotal"`
	Total             float64     `json:"total" firestore:"total"`
	PaymentProofURL   string      `json:"paymentProofUrl" firestore:"paymentProofUrl"`
	Status            string      `json:"status" firestore:"status"`
	PaymentStatus     string      `json:"paymentStatus" firestore:"paymentStatus"`
	CustomerEmailSent bool        `json:"customerEmailSent" firestore:"customerEmailSent"`
	CompanyEmailSent  bool        `json:"companyEmailSent" firestore:"companyEmailSent"`
	CreatedAt         time.Time   `json:"createdAt" firestore:"createdAt"`
	UpdatedAt         time.Time   `json:"updatedAt" firestore:"updatedAt"`
}
