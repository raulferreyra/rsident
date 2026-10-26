package handlers

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"github.com/raulferreyra/rsident/backend/internal/models"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

type OrderHandler struct {
	service *services.OrderService
}

func NewOrderHandler(
	service *services.OrderService,
) *OrderHandler {
	return &OrderHandler{
		service: service,
	}
}

func (h *OrderHandler) Create(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 6<<20)
	var request models.CreateOrderRequest
	var proofURL string

	if strings.HasPrefix(c.GetHeader("Content-Type"), "multipart/form-data") {
		if err := json.Unmarshal([]byte(c.PostForm("order")), &request); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de pedido inválido"})
			return
		}
		if request.PaymentMethod == "" || request.PaymentMethod == "yape" {
			file, header, err := c.Request.FormFile("paymentProof")
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Debes adjuntar el comprobante de pago de Yape"})
				return
			}
			file.Close()
			ext, err := validateImageHeader(header)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Comprobante inválido: " + err.Error()})
				return
			}
			filename := uuid.NewString() + ext
			uploadDir := filepath.Join("private", "payment-proofs")
			if err := os.MkdirAll(uploadDir, 0750); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar el comprobante"})
				return
			}
			filePath := filepath.Join(uploadDir, filename)
			if err := c.SaveUploadedFile(header, filePath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar el comprobante"})
				return
			}
			proofURL = "/private/payment-proofs/" + filename
		}
	} else if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de pedido inválido"})
		return
	}

	order, err := h.service.Create(c.Request.Context(), request, proofURL)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.PaymentMethod == "mercadopago" {
		preference, err := createMercadoPagoPreference(c.Request.Context(), *order)
		if err != nil {
			_, _ = h.service.UpdateOrderStatus(c.Request.Context(), order.ID, services.OrderStatusCancelled)
			c.JSON(http.StatusBadGateway, gin.H{"error": "No se pudo iniciar Mercado Pago. No se completó el pedido; inténtalo nuevamente."})
			return
		}
		if err := h.service.SetMercadoPagoPreference(c.Request.Context(), order.ID, preference.ID); err != nil {
			_, _ = h.service.UpdateOrderStatus(c.Request.Context(), order.ID, services.OrderStatusCancelled)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo preparar el pago. Inténtalo nuevamente."})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"orderNumber": order.OrderNumber, "total": order.Total, "paymentMethod": "mercadopago", "initPoint": preference.InitPoint})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"orderNumber": order.OrderNumber, "total": order.Total, "paymentMethod": "yape"})
}

type mercadoPagoPreference struct {
	ID        string `json:"id"`
	InitPoint string `json:"init_point"`
}

func createMercadoPagoPreference(ctx context.Context, order models.Order) (*mercadoPagoPreference, error) {
	token := strings.TrimSpace(os.Getenv("MERCADOPAGO_ACCESS_TOKEN"))
	if token == "" {
		return nil, fmt.Errorf("MERCADOPAGO_ACCESS_TOKEN no configurado")
	}
	baseURL := strings.TrimRight(strings.TrimSpace(os.Getenv("FRONTEND_URL")), "/")
	if baseURL == "" {
		return nil, fmt.Errorf("FRONTEND_URL no configurado")
	}
	backendURL := strings.TrimRight(strings.TrimSpace(os.Getenv("BACKEND_PUBLIC_URL")), "/")
	if backendURL == "" {
		return nil, fmt.Errorf("BACKEND_PUBLIC_URL no configurado")
	}
	items := make([]map[string]interface{}, 0, len(order.Items))
	for _, item := range order.Items {
		items = append(items, map[string]interface{}{
			"id": item.ProductID + "-" + item.VariantID,
			"title": item.ProductName + func() string {
				if item.ColorName != "" {
					return " - " + item.ColorName
				}
				return ""
			}() + func() string {
				if item.Size != "" {
					return " / " + item.Size
				}
				return ""
			}(),
			"quantity":    item.Quantity,
			"currency_id": "PEN",
			"unit_price":  item.UnitPrice,
		})
	}
	if order.ShippingCost > 0 {
		items = append(items, map[string]interface{}{"id": "shipping", "title": "Envío RSIDENT", "quantity": 1, "currency_id": "PEN", "unit_price": order.ShippingCost})
	}
	payload := map[string]interface{}{
		"items":              items,
		"external_reference": order.ID,
		"payer":              map[string]string{"email": order.CustomerEmail},
		"back_urls": map[string]string{
			"success": baseURL + "/compra-confirmada/" + order.OrderNumber + "?payment=success",
			"failure": baseURL + "/compra-confirmada/" + order.OrderNumber + "?payment=failure",
			"pending": baseURL + "/compra-confirmada/" + order.OrderNumber + "?payment=pending",
		},
		"auto_return":      "approved",
		"notification_url": backendURL + "/api/payments/mercadopago/webhook",
		"metadata":         map[string]string{"order_id": order.ID, "order_number": order.OrderNumber},
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.mercadopago.com/checkout/preferences", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	responseBody, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("Mercado Pago respondió HTTP %d: %s", resp.StatusCode, string(responseBody))
	}
	var preference mercadoPagoPreference
	if err := json.Unmarshal(responseBody, &preference); err != nil {
		return nil, err
	}
	if preference.ID == "" || preference.InitPoint == "" {
		return nil, fmt.Errorf("respuesta incompleta de Mercado Pago")
	}
	return &preference, nil
}

type mercadoPagoPayment struct {
	ID                int64   `json:"id"`
	Status            string  `json:"status"`
	ExternalReference string  `json:"external_reference"`
	TransactionAmount float64 `json:"transaction_amount"`
	CurrencyID        string  `json:"currency_id"`
}

func (h *OrderHandler) MercadoPagoWebhook(c *gin.Context) {
	token := strings.TrimSpace(os.Getenv("MERCADOPAGO_ACCESS_TOKEN"))
	secret := strings.TrimSpace(os.Getenv("MERCADOPAGO_WEBHOOK_SECRET"))
	if token == "" || secret == "" {
		c.Status(http.StatusServiceUnavailable)
		return
	}
	paymentID := strings.TrimSpace(c.Query("data.id"))
	if paymentID == "" {
		var body struct {
			Data struct {
				ID string `json:"id"`
			} `json:"data"`
		}
		_ = c.ShouldBindJSON(&body)
		paymentID = strings.TrimSpace(body.Data.ID)
	}
	if paymentID == "" || !validMercadoPagoSignature(c, paymentID, secret) {
		c.Status(http.StatusUnauthorized)
		return
	}
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, "https://api.mercadopago.com/v1/payments/"+paymentID, nil)
	if err != nil {
		c.Status(http.StatusBadRequest)
		return
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := (&http.Client{Timeout: 12 * time.Second}).Do(req)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		c.Status(http.StatusBadGateway)
		return
	}
	var payment mercadoPagoPayment
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&payment); err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	order, err := h.service.Get(c.Request.Context(), payment.ExternalReference)
	if err != nil || order.PaymentMethod != "mercadopago" || payment.CurrencyID != "PEN" || payment.TransactionAmount < order.Total-0.01 || payment.TransactionAmount > order.Total+0.01 {
		c.Status(http.StatusUnprocessableEntity)
		return
	}
	if err := h.service.SetMercadoPagoPayment(c.Request.Context(), order.ID, strconv.FormatInt(payment.ID, 10)); err != nil {
		c.Status(http.StatusInternalServerError)
		return
	}
	switch payment.Status {
	case "approved":
		_, err = h.service.ApprovePayment(c.Request.Context(), order.ID)
	case "rejected", "cancelled":
		_, err = h.service.RejectPayment(c.Request.Context(), order.ID)
	default:
		c.Status(http.StatusOK)
		return
	}
	if err != nil && !strings.Contains(err.Error(), "ya fue procesado") {
		c.Status(http.StatusConflict)
		return
	}
	c.Status(http.StatusOK)
}

func validMercadoPagoSignature(c *gin.Context, paymentID, secret string) bool {
	signature := c.GetHeader("x-signature")
	requestID := c.GetHeader("x-request-id")
	var ts, v1 string
	for _, part := range strings.Split(signature, ",") {
		kv := strings.SplitN(strings.TrimSpace(part), "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "ts":
			ts = kv[1]
		case "v1":
			v1 = kv[1]
		}
	}
	if ts == "" || v1 == "" || requestID == "" {
		return false
	}
	manifest := "id:" + strings.ToLower(paymentID) + ";request-id:" + requestID + ";ts:" + ts + ";"
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(manifest))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(v1))
}

func (h *OrderHandler) List(
	c *gin.Context,
) {
	orders, err := h.service.List(
		c.Request.Context(),
	)

	if err != nil {
		c.JSON(
			http.StatusInternalServerError,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		orders,
	)
}

func (h *OrderHandler) Get(
	c *gin.Context,
) {
	order, err := h.service.Get(
		c.Request.Context(),
		c.Param("id"),
	)

	if err != nil {
		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "Pedido no encontrado",
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		order,
	)
}

func (h *OrderHandler) CustomerGet(
	c *gin.Context,
) {
	orderNumber := strings.TrimSpace(
		c.Query("orderNumber"),
	)

	email := strings.TrimSpace(
		c.Query("email"),
	)

	order, err := h.service.FindCustomerOrder(
		c.Request.Context(),
		orderNumber,
		email,
	)

	if err != nil {
		c.JSON(
			http.StatusNotFound,
			gin.H{
				"error": "Pedido no encontrado",
			},
		)

		return
	}

	// La consulta pública solo devuelve los campos necesarios para seguimiento.
	items := make([]gin.H, 0, len(order.Items))
	for _, item := range order.Items {
		items = append(items, gin.H{
			"productId":   item.ProductID,
			"variantId":   item.VariantID,
			"productName": item.ProductName,
			"size":        item.Size,
			"quantity":    item.Quantity,
		})
	}
	c.JSON(http.StatusOK, gin.H{
		"orderNumber":   order.OrderNumber,
		"paymentStatus": order.PaymentStatus,
		"orderStatus":   order.OrderStatus,
		"receiptStatus": order.ReceiptStatus,
		"items":         items,
		"total":         order.Total,
	})
}

// PaymentProof sirve el comprobante solo a través del grupo /admin autenticado.
func (h *OrderHandler) PaymentProof(c *gin.Context) {
	order, err := h.service.Get(c.Request.Context(), c.Param("id"))
	if err != nil || order.PaymentProofURL == "" {
		c.Status(http.StatusNotFound)
		return
	}
	if !strings.HasPrefix(order.PaymentProofURL, "/private/payment-proofs/") &&
		!strings.HasPrefix(order.PaymentProofURL, "/uploads/payment-proofs/") {
		c.Status(http.StatusNotFound)
		return
	}
	filename := filepath.Base(order.PaymentProofURL)
	if filename == "." || filename == string(filepath.Separator) || filename == "" {
		c.Status(http.StatusNotFound)
		return
	}
	// Compatibilidad con pedidos previos que guardaron el archivo bajo uploads/.
	paths := []string{
		filepath.Join("private", "payment-proofs", filename),
		filepath.Join("uploads", "payment-proofs", filename),
	}
	for _, filePath := range paths {
		if info, statErr := os.Stat(filePath); statErr == nil && !info.IsDir() {
			c.Header("Cache-Control", "private, no-store")
			c.File(filePath)
			return
		}
	}
	c.Status(http.StatusNotFound)
}

func (h *OrderHandler) ApprovePayment(
	c *gin.Context,
) {
	order, err := h.service.ApprovePayment(
		c.Request.Context(),
		c.Param("id"),
	)

	if err != nil {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		order,
	)
}

func (h *OrderHandler) RejectPayment(
	c *gin.Context,
) {
	order, err := h.service.RejectPayment(
		c.Request.Context(),
		c.Param("id"),
	)

	if err != nil {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		order,
	)
}

type updateOrderStatusRequest struct {
	Status string `json:"status"`
}

func (h *OrderHandler) UpdateStatus(
	c *gin.Context,
) {
	var request updateOrderStatusRequest

	if err := c.ShouldBindJSON(
		&request,
	); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Estado inválido",
			},
		)

		return
	}

	order, err := h.service.UpdateOrderStatus(
		c.Request.Context(),
		c.Param("id"),
		request.Status,
	)

	if err != nil {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		order,
	)
}

type updateReceiptStatusRequest struct {
	Status string `json:"status"`
}

func (h *OrderHandler) UpdateReceiptStatus(
	c *gin.Context,
) {
	var request updateReceiptStatusRequest

	if err := c.ShouldBindJSON(
		&request,
	); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Estado de boleta inválido",
			},
		)

		return
	}

	order, err := h.service.UpdateReceiptStatus(
		c.Request.Context(),
		c.Param("id"),
		request.Status,
	)

	if err != nil {
		c.JSON(
			http.StatusConflict,
			gin.H{
				"error": err.Error(),
			},
		)

		return
	}

	c.JSON(
		http.StatusOK,
		order,
	)
}
