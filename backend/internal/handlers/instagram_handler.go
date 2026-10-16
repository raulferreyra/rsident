package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

type InstagramHandler struct {
	service *services.InstagramService
}

func NewInstagramHandler(service *services.InstagramService) *InstagramHandler {
	return &InstagramHandler{
		service: service,
	}
}

func (h *InstagramHandler) GetMedia(c *gin.Context) {
	limit := 6

	if value := c.Query("limit"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "El parámetro limit debe ser numérico",
			})
			return
		}

		limit = parsed
	}

	media, err := h.service.GetMedia(limit)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": media,
	})
}
