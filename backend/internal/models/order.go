package models

import "time"

type CreateOrderItem struct {
	ProductID string `json:"productId"`
	VariantID string `json:"variantId"`
	Quantity  int    `json:"quantity"`
}

type CreateOrderRequest struct {
	CustomerEmail string            `json:"customerEmail"`
	ShippingZone  string            `json:"shippingZone"`
	Address       string            `json:"address"`
	PickupName    string            `json:"pickupName"`
	PickupDNI     string            `json:"pickupDni"`
	Items         []CreateOrderItem `json:"items"`
}

type OrderItem struct {
	ProductID   string  `json:"productId" firestore:"productId"`
	VariantID   string  `json:"variantId" firestore:"variantId"`
	ProductName string  `json:"productName" firestore:"productName"`
	ColorName   string  `json:"colorName" firestore:"colorName"`
	Size        string  `json:"size" firestore:"size"`
	SKU         string  `json:"sku" firestore:"sku"`
	ImageURL    string  `json:"imageUrl" firestore:"imageUrl"`
	Quantity    int     `json:"quantity" firestore:"quantity"`
	UnitPrice   float64 `json:"unitPrice" firestore:"unitPrice"`
	Subtotal    float64 `json:"subtotal" firestore:"subtotal"`
}

type Order struct {
	ID                string      `json:"id" firestore:"-"`
	OrderNumber       string      `json:"orderNumber" firestore:"orderNumber"`
	CustomerEmail     string      `json:"customerEmail" firestore:"customerEmail"`
	ShippingZone      string      `json:"shippingZone" firestore:"shippingZone"`
	ShippingCost      float64     `json:"shippingCost" firestore:"shippingCost"`
	Address           string      `json:"address" firestore:"address"`
	PickupName        string      `json:"pickupName" firestore:"pickupName"`
	PickupDNI         string      `json:"pickupDni" firestore:"pickupDni"`
	Courier           string      `json:"courier" firestore:"courier"`
	Items             []OrderItem `json:"items" firestore:"items"`
	Subtotal          float64     `json:"subtotal" firestore:"subtotal"`
	Total             float64     `json:"total" firestore:"total"`
	PaymentProofURL   string      `json:"paymentProofUrl" firestore:"paymentProofUrl"`
	PaymentStatus     string      `json:"paymentStatus" firestore:"paymentStatus"`
	OrderStatus       string      `json:"orderStatus" firestore:"orderStatus"`
	ReceiptStatus     string      `json:"receiptStatus" firestore:"receiptStatus"`
	CustomerEmailSent bool        `json:"customerEmailSent" firestore:"customerEmailSent"`
	CompanyEmailSent  bool        `json:"companyEmailSent" firestore:"companyEmailSent"`
	CreatedAt         time.Time   `json:"createdAt" firestore:"createdAt"`
	UpdatedAt         time.Time   `json:"updatedAt" firestore:"updatedAt"`
}
