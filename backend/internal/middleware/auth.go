package middleware

import (
	"net/http"
	"strings"

	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"
)

func FirebaseAuth(authClient *auth.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")

		if header == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Token de autenticación requerido",
			})
			return
		}

		parts := strings.SplitN(header, " ", 2)

		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Formato de autorización inválido",
			})
			return
		}

		token, err := authClient.VerifyIDToken(
			c,
			parts[1],
		)

		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Token inválido o expirado",
			})
			return
		}

		if !isAdmin(token) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "El usuario no tiene permisos de administrador",
			})
			return
		}

		c.Set("firebase_uid", token.UID)
		c.Set("firebase_token", token)
		c.Set("firebase_admin", true)

		c.Next()
	}
}

func isAdmin(token *auth.Token) bool {
	value, exists := token.Claims["admin"]

	if !exists {
		return false
	}

	admin, ok := value.(bool)

	return ok && admin
}
