package routes

import (
	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"

	"github.com/raulferreyra/rsident/backend/internal/handlers"
	"github.com/raulferreyra/rsident/backend/internal/middleware"
)

func Setup(
	router *gin.Engine,
	authClient *auth.Client,
) {
	api := router.Group("/api")

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	admin := api.Group("/admin")

	admin.Use(
		middleware.FirebaseAuth(authClient),
	)

	admin.GET(
		"/dashboard",
		handlers.Dashboard,
	)
}
