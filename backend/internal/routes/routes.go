package routes

import (
	"firebase.google.com/go/auth"
	"github.com/gin-gonic/gin"

	"github.com/raulferreyra/rsident/backend/internal/handlers"
	"github.com/raulferreyra/rsident/backend/internal/middleware"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

func Setup(
	router *gin.Engine,
	authClient *auth.Client,
	catalogService *services.CatalogService,
	productService *services.ProductService,
	orderService *services.OrderService,
) {
	api := router.Group("/api")

	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	catalogHandler := handlers.NewCatalogHandler(
		catalogService,
	)

	productHandler := handlers.NewProductHandler(
		productService,
	)

	orderHandler := handlers.NewOrderHandler(
		orderService,
	)

	api.GET("/catalog/categories", func(c *gin.Context) {
		c.Set("admin", false)
		catalogHandler.ListCollection(c, "categories")
	})

	api.GET("/catalog/collections", func(c *gin.Context) {
		c.Set("admin", false)
		catalogHandler.ListCollection(c, "collections")
	})

	api.GET(
		"/products",
		func(c *gin.Context) {
			c.Set("admin", false)
			productHandler.List(c)
		},
	)

	api.GET(
		"/products/:id",
		func(c *gin.Context) {
			c.Set("admin", false)
			productHandler.Get(c)
		},
	)

	api.POST("/orders", orderHandler.Create)
	api.GET(
		"/orders/lookup",
		orderHandler.CustomerGet,
	)

	admin := api.Group("/admin")
	admin.Use(middleware.FirebaseAuth(authClient))

	admin.GET(
		"/dashboard",
		handlers.Dashboard,
	)
	admin.GET(
		"/catalog/:collection",
		func(c *gin.Context) {
			c.Set("admin", true)
			catalogHandler.List(c)
		},
	)
	admin.POST(
		"/catalog/:collection",
		catalogHandler.Create,
	)
	admin.PUT(
		"/catalog/:collection/:id",
		catalogHandler.Update,
	)
	admin.DELETE(
		"/catalog/:collection/:id",
		catalogHandler.Delete,
	)

	admin.GET(
		"/products",
		func(c *gin.Context) {
			c.Set("admin", true)
			productHandler.List(c)
		},
	)
	admin.GET(
		"/products/:id",
		func(c *gin.Context) {
			c.Set("admin", true)
			productHandler.Get(c)
		},
	)
	admin.POST(
		"/products",
		productHandler.Create,
	)
	admin.PUT(
		"/products/:id",
		productHandler.Update,
	)
	admin.DELETE(
		"/products/:id",
		productHandler.Delete,
	)
	admin.POST(
		"/products/:id/images",
		handlers.UploadProductImage,
	)
	admin.GET(
		"/orders",
		orderHandler.List,
	)
	admin.GET(
		"/orders/:id",
		orderHandler.Get,
	)
	admin.GET(
		"/orders/:id/payment-proof",
		orderHandler.PaymentProof,
	)
	admin.POST(
		"/orders/:id/payment/approve",
		orderHandler.ApprovePayment,
	)
	admin.POST(
		"/orders/:id/payment/reject",
		orderHandler.RejectPayment,
	)
	admin.PATCH(
		"/orders/:id/status",
		orderHandler.UpdateStatus,
	)
	admin.PATCH(
		"/orders/:id/receipt-status",
		orderHandler.UpdateReceiptStatus,
	)
}
