package services

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/firestore"

	"github.com/raulferreyra/rsident/backend/internal/models"
)

type ProductService struct {
	db *firestore.Client
}

func NewProductService(
	db *firestore.Client,
) *ProductService {
	return &ProductService{
		db: db,
	}
}

func (s *ProductService) List(
	ctx context.Context,
	admin bool,
) ([]models.Product, error) {
	query := s.db.
		Collection("products").
		OrderBy("createdAt", firestore.Desc)

	if !admin {
		query = query.Where(
			"published",
			"==",
			true,
		)
	}

	docs, err := query.Documents(ctx).GetAll()

	if err != nil {
		return nil, fmt.Errorf(
			"error listando productos: %w",
			err,
		)
	}

	products := make(
		[]models.Product,
		0,
		len(docs),
	)

	for _, doc := range docs {
		var product models.Product

		if err := doc.DataTo(&product); err != nil {
			return nil, fmt.Errorf(
				"error convirtiendo producto %s: %w",
				doc.Ref.ID,
				err,
			)
		}

		product.ID = doc.Ref.ID

		products = append(
			products,
			product,
		)
	}

	return products, nil
}

func (s *ProductService) Get(
	ctx context.Context,
	id string,
) (*models.Product, error) {
	doc, err := s.db.
		Collection("products").
		Doc(id).
		Get(ctx)

	if err != nil {
		return nil, err
	}

	var product models.Product

	if err := doc.DataTo(&product); err != nil {
		return nil, err
	}

	product.ID = doc.Ref.ID

	return &product, nil
}

func (s *ProductService) Create(
	ctx context.Context,
	product models.Product,
) (*models.Product, error) {
	now := time.Now()

	product.CreatedAt = now
	product.UpdatedAt = now

	if product.Images == nil {
		product.Images = []models.ProductImage{}
	}

	if product.Colors == nil {
		product.Colors = []models.ProductColor{}
	}

	if product.Variants == nil {
		product.Variants = []models.ProductVariant{}
	}

	if product.TagIDs == nil {
		product.TagIDs = []string{}
	}

	ref, _, err := s.db.
		Collection("products").
		Add(ctx, product)

	if err != nil {
		return nil, err
	}

	product.ID = ref.ID

	return &product, nil
}

func (s *ProductService) Update(
	ctx context.Context,
	id string,
	product models.Product,
) error {
	product.UpdatedAt = time.Now()

	if product.Images == nil {
		product.Images = []models.ProductImage{}
	}

	if product.Colors == nil {
		product.Colors = []models.ProductColor{}
	}

	if product.Variants == nil {
		product.Variants = []models.ProductVariant{}
	}

	if product.TagIDs == nil {
		product.TagIDs = []string{}
	}

	_, err := s.db.
		Collection("products").
		Doc(id).
		Set(ctx, product)

	return err
}

func (s *ProductService) Delete(
	ctx context.Context,
	id string,
) error {
	_, err := s.db.
		Collection("products").
		Doc(id).
		Delete(ctx)

	return err
}
