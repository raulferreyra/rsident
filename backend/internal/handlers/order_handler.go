package handlers

import (
	"encoding/json"
	"fmt"
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

func NewOrderHandler(service *services.OrderService) *OrderHandler {
	return &OrderHandler{service: service}
}

func (h *OrderHandler) Create(c *gin.Context) {
	orderJSON := c.PostForm("order")
	if orderJSON == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No se recibieron los datos de la compra",
		})
		return
	}

	var request models.CreateOrderRequest
	if err := json.Unmarshal([]byte(orderJSON), &request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Los datos de la compra no son válidos",
		})
		return
	}

	file, err := c.FormFile("paymentProof")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Debes adjuntar el comprobante de pago",
		})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El comprobante no puede superar los 5 MB",
		})
		return
	}

	contentType := file.Header.Get("Content-Type")
	if contentType != "image/jpeg" &&
		contentType != "image/png" &&
		contentType != "image/webp" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El comprobante debe ser JPG, PNG o WEBP",
		})
		return
	}

	orderID := uuid.NewString()
	extension := strings.ToLower(filepath.Ext(file.Filename))
	if extension == "" {
		switch contentType {
		case "image/png":
			extension = ".png"
		case "image/webp":
			extension = ".webp"
		default:
			extension = ".jpg"
		}
	}

	uploadDir := filepath.Join(
		"uploads",
		"payments",
		orderID,
	)

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo preparar el comprobante de pago",
		})
		return
	}

	filename := uuid.NewString() + extension
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo guardar el comprobante de pago",
		})
		return
	}

	paymentProofURL := fmt.Sprintf(
		"/uploads/payments/%s/%s",
		orderID,
		filename,
	)

	order, err := h.service.Create(
		c.Request.Context(),
		orderID,
		request,
		paymentProofURL,
	)

	if err != nil {
		_ = os.Remove(filePath)
		_ = os.Remove(uploadDir)

		status := http.StatusBadRequest
		if strings.Contains(err.Error(), "Firestore") ||
			strings.Contains(err.Error(), "actualizando stock") ||
			strings.Contains(err.Error(), "stock insuficiente") {
			status = http.StatusConflict
		}

		c.JSON(status, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"orderNumber": order.OrderNumber,
		"total":       order.Total,
		"status":      order.Status,
	})
}
