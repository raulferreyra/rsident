package services

const (
	PaymentStatusPendingReview = "pending_review"
	PaymentStatusApproved      = "approved"
	PaymentStatusRejected      = "rejected"

	OrderStatusPendingReview = "pending_review"
	OrderStatusConfirmed     = "confirmed"
	OrderStatusPreparing     = "preparing"
	OrderStatusShipped       = "shipped"
	OrderStatusDelivered     = "delivered"
	OrderStatusCancelled     = "cancelled"
	OrderStatusRejected      = "rejected"

	ReceiptStatusPending = "pending"
	ReceiptStatusSent    = "sent"
)
