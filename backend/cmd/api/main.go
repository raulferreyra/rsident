package main

import (
	"context"
	"log"
	"os"
	"runtime/debug"
	"strings"

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

	if mode := os.Getenv("GIN_MODE"); mode != "" {
		gin.SetMode(mode)
	}

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

		c.AbortWithStatusJSON(500, gin.H{
			"error": "Error interno del servidor",
		})
	}))

	router.Static("/uploads", "./uploads")

	router.Use(cors.New(cors.Config{
		AllowOrigins: allowedOrigins(),
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
			"Accept",
			"Authorization",
		},
		MaxAge: 12 * 60 * 60,
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
		"RSIDENT backend ejecutándose en :%s",
		port,
	)

	if err := router.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

func allowedOrigins() []string {
	raw := strings.TrimSpace(
		os.Getenv("CORS_ALLOWED_ORIGINS"),
	)

	if raw == "" {
		return []string{
			"http://localhost:5173",
		}
	}

	values := strings.Split(raw, ",")
	origins := make([]string, 0, len(values))

	for _, value := range values {
		origin := strings.TrimSpace(value)

		if origin == "" {
			continue
		}

		origins = append(origins, origin)
	}

	if len(origins) == 0 {
		return []string{
			"http://localhost:5173",
		}
	}

	return origins
}
