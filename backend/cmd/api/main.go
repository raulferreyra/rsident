package main

import (
	"context"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/raulferreyra/rsident/backend/internal/config"
	"github.com/raulferreyra/rsident/backend/internal/routes"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

func main() {
	_ = godotenv.Load()

	ctx := context.Background()

	firebase, err := config.NewFirebase(ctx)

	if err != nil {
		log.Fatal(err)
	}

	defer firebase.Firestore.Close()

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	router := gin.Default()

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

	productService := services.NewProductService(
		firebase.Firestore,
	)

	routes.Setup(
		router,
		firebase.Auth,
		catalogService,
		productService,
	)

	log.Printf(
		"RSIDENT backend ejecutándose en http://localhost:%s",
		port,
	)

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
