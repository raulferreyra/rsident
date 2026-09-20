package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/raulferreyra/rsident/backend/internal/models"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

type ProductHandler struct {
	service *services.ProductService
}

func NewProductHandler(
	service *services.ProductService,
) *ProductHandler {
	return &ProductHandler{
		service: service,
	}
}

func (h *ProductHandler) List(c *gin.Context) {
	admin := c.GetBool("admin")

	products, err := h.service.List(
		c.Request.Context(),
		admin,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, products)
}

func (h *ProductHandler) Get(c *gin.Context) {
	id := c.Param("id")

	product, err := h.service.Get(
		c.Request.Context(),
		id,
	)

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Producto no encontrado",
		})
		return
	}

	if !c.GetBool("admin") && !product.Published {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Producto no encontrado",
		})
		return
	}

	c.JSON(http.StatusOK, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var product models.Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Datos inválidos",
		})
		return
	}

	if product.Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El nombre del producto es obligatorio",
		})
		return
	}

	if product.Slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El slug del producto es obligatorio",
		})
		return
	}

	if product.Price < 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El precio no puede ser negativo",
		})
		return
	}

	result, err := h.service.Create(
		c.Request.Context(),
		product,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, result)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id := c.Param("id")

	var product models.Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Datos inválidos",
		})
		return
	}

	if product.Name == "" || product.Slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nombre y slug son obligatorios",
		})
		return
	}

	err := h.service.Update(
		c.Request.Context(),
		id,
		product,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id := c.Param("id")

	err := h.service.Delete(
		c.Request.Context(),
		id,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}
