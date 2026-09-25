package main

import (
	"context"
	"log"
	"os"
	"runtime/debug"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/raulferreyra/rsident/backend/internal/config"
	"github.com/raulferreyra/rsident/backend/internal/logging"
	"github.com/raulferreyra/rsident/backend/internal/routes"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

func main() {
	if err := logging.Init(); err != nil {
		log.Fatal(err)
	}

	defer logging.Close()

	_ = godotenv.Load()

	ctx := context.Background()

	firebase, err := config.NewFirebase(ctx)

	if err != nil {
		log.Fatal(err)
	}

	if firebase == nil {
		log.Fatal("ERROR: firebase es nil")
	}

	if firebase.Firestore == nil {
		log.Fatal("ERROR: firebase.Firestore es nil")
	}

	if firebase.Auth == nil {
		log.Fatal("ERROR: firebase.Auth es nil")
	}

	log.Println("Firebase inicializado correctamente")
	log.Printf("Firestore: %v", firebase.Firestore)
	log.Printf("Auth: %v", firebase.Auth)

	defer firebase.Firestore.Close()

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	router := gin.New()

	router.Use(gin.Logger())

	router.Use(gin.CustomRecovery(func(c *gin.Context, recovered any) {
		logging.Error.Printf(
			"PANIC RECUPERADO: %v\n%s",
			recovered,
			debug.Stack(),
		)

		c.AbortWithStatus(500)
	}))

	router.Static("/uploads", "./uploads")

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},
	}))

	catalogService := services.NewCatalogService(
		firebase.Firestore,
	)

	logging.App.Printf(
		"CatalogService creado. Firestore=%p",
		firebase.Firestore,
	)

	if catalogService == nil {
		log.Fatal("ERROR: catalogService es nil")
	}

	productService := services.NewProductService(
		firebase.Firestore,
	)

	mailer := services.NewMailerFromEnv()
	orderService := services.NewOrderService(
		firebase.Firestore,
		mailer,
	)

	routes.Setup(
		router,
		firebase.Auth,
		catalogService,
		productService,
		orderService,
	)

	log.Printf(
		"RSIDENT backend ejecutándose en http://localhost:%s",
		port,
	)

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
