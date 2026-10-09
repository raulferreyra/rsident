package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	orderJSON := c.PostForm("order")
	if orderJSON == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Información del pedido requerida"})
		return
	}
	if err := json.Unmarshal([]byte(orderJSON), &request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato de pedido inválido"})
		return
	}
	file, header, err := c.Request.FormFile("paymentProof")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Debes adjuntar el comprobante de pago"})
		return
	}
	defer file.Close()
	ext, err := validateImage(file, header.Size)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Comprobante inválido: " + err.Error()})
		return
	}

	filename := uuid.NewString() + ext
	uploadDir := filepath.Join("uploads", "payment-proofs")
	if err := os.MkdirAll(uploadDir, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar el comprobante"})
		return
	}
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(header, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar el comprobante"})
		return
	}
	proofURL := "/uploads/payment-proofs/" + filename
	order, err := h.service.Create(c.Request.Context(), request, proofURL)
	if err != nil {
		_ = os.Remove(filePath)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, order)
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

	c.JSON(
		http.StatusOK,
		order,
	)
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
