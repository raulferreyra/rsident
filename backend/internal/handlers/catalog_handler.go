package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/raulferreyra/rsident/backend/internal/models"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

type CatalogHandler struct {
	service *services.CatalogService
}

func NewCatalogHandler(
	service *services.CatalogService,
) *CatalogHandler {
	return &CatalogHandler{
		service: service,
	}
}

func (h *CatalogHandler) List(c *gin.Context) {
	h.list(c, c.Param("collection"))
}

func (h *CatalogHandler) ListCollection(
	c *gin.Context,
	collection string,
) {
	h.list(c, collection)
}

func (h *CatalogHandler) list(
	c *gin.Context,
	collection string,
) {
	admin := c.GetBool("admin")

	items, err := h.service.List(
		c.Request.Context(),
		collection,
		admin,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, items)
}

func (h *CatalogHandler) Create(c *gin.Context) {
	collection := c.Param("collection")

	var item models.CatalogItem

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Datos inválidos",
		})
		return
	}

	if item.Name == "" || item.Slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nombre y slug son obligatorios",
		})
		return
	}

	result, err := h.service.Create(
		c.Request.Context(),
		collection,
		item,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, result)
}

func (h *CatalogHandler) Update(c *gin.Context) {
	collection := c.Param("collection")
	id := c.Param("id")

	var item models.CatalogItem

	if err := c.ShouldBindJSON(&item); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Datos inválidos",
		})
		return
	}

	if item.Name == "" || item.Slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Nombre y slug son obligatorios",
		})
		return
	}

	err := h.service.Update(
		c.Request.Context(),
		collection,
		id,
		item,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}

func (h *CatalogHandler) Delete(c *gin.Context) {
	collection := c.Param("collection")
	id := c.Param("id")

	err := h.service.Delete(
		c.Request.Context(),
		collection,
		id,
	)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.Status(http.StatusNoContent)
}
