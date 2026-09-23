package services

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"

	"github.com/raulferreyra/rsident/backend/internal/logging"
	"github.com/raulferreyra/rsident/backend/internal/models"
)

type CatalogService struct {
	db *firestore.Client
}

func (s *CatalogService) Exists(
	ctx context.Context,
	collection string,
	slug string,
	excludeID string,
) (bool, error) {
	docs, err := s.db.
		Collection(collection).
		Where("slug", "==", slug).
		Limit(1).
		Documents(ctx).
		GetAll()

	if err != nil {
		return false, err
	}

	for _, doc := range docs {
		if doc.Ref.ID != excludeID {
			return true, nil
		}
	}

	return false, nil
}

func NewCatalogService(
	db *firestore.Client,
) *CatalogService {
	logging.App.Printf(
		"NewCatalogService recibido db=%p",
		db,
	)

	return &CatalogService{
		db: db,
	}
}

func (s *CatalogService) List(
	ctx context.Context,
	collection string,
	admin bool,
) (
	[]models.CatalogItem,
	error,
) {
	query := s.db.Collection(collection).Query

	if !admin {
		query = query.Where("active", "==", true)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return nil, fmt.Errorf("error listando catálogo: %w", err)
	}

	items := make([]models.CatalogItem, 0, len(docs))

	for _, doc := range docs {
		var item models.CatalogItem

		if err := doc.DataTo(&item); err != nil {
			return nil, fmt.Errorf("error convirtiendo catálogo %s: %w", doc.Ref.ID, err)
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

	exists, err := s.Exists(
		ctx,
		collection,
		item.Slug,
		"",
	)

	if err != nil {
		return nil, err
	}

	if exists {
		return nil, fmt.Errorf(
			"ya existe un registro con ese nombre o slug",
		)
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

	exists, err := s.Exists(
		ctx,
		collection,
		item.Slug,
		id,
	)

	if err != nil {
		return err
	}

	if exists {
		return fmt.Errorf(
			"ya existe otro registro con ese nombre o slug",
		)
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
