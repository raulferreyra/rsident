package main

import (
	"context"
	"fmt"
	"log"
	"os"

	firebase "firebase.google.com/go"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"
)

func main() {
	if len(os.Args) < 2 || len(os.Args) > 3 {
		log.Fatal("Uso: go run ./cmd/set-admin <correo> [--revoke]")
	}

	email := os.Args[1]
	revoke := len(os.Args) == 3 && os.Args[2] == "--revoke"

	if len(os.Args) == 3 && !revoke {
		log.Fatal(
			"Argumento inválido. Usa --revoke para quitar el rol de administrador.",
		)
	}

	_ = godotenv.Load()

	credentialsPath := os.Getenv(
		"GOOGLE_APPLICATION_CREDENTIALS",
	)

	projectID := os.Getenv(
		"FIREBASE_PROJECT_ID",
	)

	if credentialsPath == "" {
		log.Fatal(
			"GOOGLE_APPLICATION_CREDENTIALS no está configurado",
		)
	}

	if projectID == "" {
		log.Fatal(
			"FIREBASE_PROJECT_ID no está configurado",
		)
	}

	ctx := context.Background()

	app, err := firebase.NewApp(
		ctx,
		&firebase.Config{
			ProjectID: projectID,
		},
		option.WithCredentialsFile(credentialsPath),
	)

	if err != nil {
		log.Fatalf(
			"Error inicializando Firebase: %v",
			err,
		)
	}

	authClient, err := app.Auth(ctx)

	if err != nil {
		log.Fatalf(
			"Error inicializando Firebase Auth: %v",
			err,
		)
	}

	user, err := authClient.GetUserByEmail(
		ctx,
		email,
	)

	if err != nil {
		log.Fatalf(
			"No se encontró el usuario %s: %v",
			email,
			err,
		)
	}

	claims := user.CustomClaims

	if claims == nil {
		claims = map[string]interface{}{}
	}

	if revoke {
		delete(claims, "admin")
	} else {
		claims["admin"] = true
	}

	if err := authClient.SetCustomUserClaims(
		ctx,
		user.UID,
		claims,
	); err != nil {
		log.Fatalf(
			"Error actualizando claims del usuario: %v",
			err,
		)
	}

	if revoke {
		fmt.Printf(
			"Administrador revocado: %s (%s)\n",
			email,
			user.UID,
		)

		return
	}

	fmt.Printf(
		"Administrador configurado: %s (%s)\n",
		email,
		user.UID,
	)

	fmt.Println(
		"El usuario debe volver a iniciar sesión para obtener el nuevo claim.",
	)
}
