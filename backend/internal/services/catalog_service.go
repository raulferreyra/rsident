package services

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"

	"github.com/raulferreyra/rsident/backend/internal/models"
)

type CatalogService struct {
	db *firestore.Client
}

func NewCatalogService(
	db *firestore.Client,
) *CatalogService {
	return &CatalogService{
		db: db,
	}
}

func (s *CatalogService) List(
	ctx context.Context,
	collection string,
) ([]models.CatalogItem, error) {
	if err := ValidateCatalogCollection(collection); err != nil {
		return nil, err
	}

	docs, err := s.db.
		Collection(collection).
		OrderBy("name", firestore.Asc).
		Documents(ctx).
		GetAll()

	if err != nil {
		return nil, err
	}

	items := make([]models.CatalogItem, 0, len(docs))

	for _, doc := range docs {
		var item models.CatalogItem

		if err := doc.DataTo(&item); err != nil {
			return nil, err
		}

		item.ID = doc.Ref.ID

		items = append(items, item)
	}

	return items, nil
}

func (s *CatalogService) Create(
	ctx context.Context,
	collection string,
	item models.CatalogItem,
) (*models.CatalogItem, error) {
	if err := ValidateCatalogCollection(collection); err != nil {
		return nil, err
	}

	now := time.Now()

	item.CreatedAt = now
	item.UpdatedAt = now

	ref, _, err := s.db.
		Collection(collection).
		Add(ctx, item)

	if err != nil {
		return nil, err
	}

	item.ID = ref.ID

	return &item, nil
}

func (s *CatalogService) Update(
	ctx context.Context,
	collection string,
	id string,
	item models.CatalogItem,
) error {
	if err := ValidateCatalogCollection(collection); err != nil {
		return err
	}

	docRef := s.db.
		Collection(collection).
		Doc(id)

	existing, err := docRef.Get(ctx)

	if err != nil {
		return err
	}

	var current models.CatalogItem

	if err := existing.DataTo(&current); err != nil {
		return err
	}

	item.ID = id
	item.CreatedAt = current.CreatedAt
	item.UpdatedAt = time.Now()

	_, err = docRef.Set(ctx, item)

	return err
}

func (s *CatalogService) Delete(
	ctx context.Context,
	collection string,
	id string,
) error {
	if err := ValidateCatalogCollection(collection); err != nil {
		return err
	}

	_, err := s.db.
		Collection(collection).
		Doc(id).
		Delete(ctx)

	return err
}

func ValidateCatalogCollection(
	collection string,
) error {
	switch collection {
	case "categories", "collections", "tags":
		return nil
	default:
		return fmt.Errorf(
			"colección de catálogo inválida",
		)
	}
}
