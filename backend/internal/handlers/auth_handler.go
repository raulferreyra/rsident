package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Dashboard(c *gin.Context) {
	uid, exists := c.Get("firebase_uid")

	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Usuario no autenticado",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Acceso autorizado",
		"uid":     uid,
	})
}
