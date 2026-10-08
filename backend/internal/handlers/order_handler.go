package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

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

func (h *OrderHandler) Create(
	c *gin.Context,
) {
	var request models.CreateOrderRequest

	orderJSON := c.PostForm("order")

	if orderJSON == "" {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Información del pedido requerida",
			},
		)

		return
	}

	if err := c.ShouldBindJSON(
		gin.Body,
	); err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{
				"error": "Formato de pedido inválido",
			},
		)

		return
	}

	_ = orderJSON

	c.JSON(
		http.StatusNotImplemented,
		gin.H{
			"error": "Usar el handler multipart actual",
		},
	)
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
