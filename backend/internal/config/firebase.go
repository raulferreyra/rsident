package config

import (
	"context"
	"fmt"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go"
	"firebase.google.com/go/auth"
	"google.golang.org/api/option"
)

type Firebase struct {
	App       *firebase.App
	Auth      *auth.Client
	Firestore *firestore.Client
}

func NewFirebase(ctx context.Context) (*Firebase, error) {
	credentialsPath := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS")

	if credentialsPath == "" {
		return nil, fmt.Errorf(
			"GOOGLE_APPLICATION_CREDENTIALS no está configurado",
		)
	}

	projectID := os.Getenv("FIREBASE_PROJECT_ID")

	if projectID == "" {
		return nil, fmt.Errorf(
			"FIREBASE_PROJECT_ID no está configurado",
		)
	}

	app, err := firebase.NewApp(
		ctx,
		&firebase.Config{
			ProjectID: projectID,
		},
		option.WithCredentialsFile(credentialsPath),
	)

	if err != nil {
		return nil, fmt.Errorf(
			"error inicializando Firebase: %w",
			err,
		)
	}

	authClient, err := app.Auth(ctx)

	if err != nil {
		return nil, fmt.Errorf(
			"error inicializando Firebase Auth: %w",
			err,
		)
	}

	firestoreClient, err := app.Firestore(ctx)

	if err != nil {
		return nil, fmt.Errorf(
			"error inicializando Firestore: %w",
			err,
		)
	}

	return &Firebase{
		App:       app,
		Auth:      authClient,
		Firestore: firestoreClient,
	}, nil
}
