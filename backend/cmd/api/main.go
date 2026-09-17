package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/raulferreyra/rsident/backend/internal/handlers"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

func main() {
	_ = godotenv.Load()

	port := os.Getenv("PORT")

	if port == "" {
		port = "8080"
	}

	router := gin.Default()

	instagramService := services.NewInstagramService()
	instagramHandler := handlers.NewInstagramHandler(instagramService)

	api := router.Group("/api")
	{
		api.GET("/instagram/media", instagramHandler.GetMedia)
	}

	log.Printf("RSIDENT backend ejecutándose en http://localhost:%s", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
