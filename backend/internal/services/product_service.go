package services

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"cloud.google.com/go/firestore"

	"github.com/raulferreyra/rsident/backend/internal/logging"
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
	logging.App.Printf(
		"ProductService.List admin=%t service=%p db=%p",
		admin,
		s,
		s.db,
	)

	query := s.db.Collection("products").Query

	if !admin {
		query = query.Where(
			"published",
			"==",
			true,
		)
	}

	docs, err := query.Documents(ctx).GetAll()

	if err != nil {
		logging.Error.Printf(
			"ProductService.List error consultando Firestore: %v",
			err,
		)

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
			logging.Error.Printf(
				"ProductService.List error convirtiendo producto id=%s: %v",
				doc.Ref.ID,
				err,
			)

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

	sort.SliceStable(products, func(i, j int) bool {
		return products[i].CreatedAt.After(products[j].CreatedAt)
	})

	logging.App.Printf(
		"ProductService.List encontrados=%d admin=%t",
		len(products),
		admin,
	)

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
	old, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	product.ID = id
	product.CreatedAt = old.CreatedAt
	product.UpdatedAt = time.Now().UTC()
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

	_, err = s.db.Collection("products").Doc(id).Set(ctx, product)
	if err != nil {
		return err
	}

	kept := productAssetURLs(product)
	for url := range productAssetURLs(*old) {
		if _, exists := kept[url]; !exists {
			if err := removeProductAsset(id, url); err != nil {
				logging.Error.Printf(
					"No se pudo eliminar imagen antigua del producto %s (%s): %v",
					id,
					url,
					err,
				)
			}
		}
	}
	return nil
}

func (s *ProductService) Delete(
	ctx context.Context,
	id string,
) error {
	_, err := s.Get(ctx, id)
	if err != nil {
		return err
	}
	if _, err := s.db.Collection("products").Doc(id).Delete(ctx); err != nil {
		return err
	}
	if err := os.RemoveAll(filepath.Join("uploads", "products", filepath.Clean(id))); err != nil {
		logging.Error.Printf("No se pudo eliminar carpeta de imágenes del producto %s: %v", id, err)
		return fmt.Errorf("producto eliminado, pero no se pudieron eliminar sus imágenes: %w", err)
	}
	return nil
}

func productAssetURLs(product models.Product) map[string]struct{} {
	urls := make(map[string]struct{})
	for _, image := range product.Images {
		if image.URL != "" {
			urls[image.URL] = struct{}{}
		}
	}
	for _, color := range product.Colors {
		if color.ImageURL != "" {
			urls[color.ImageURL] = struct{}{}
		}
		for _, image := range color.Images {
			if image.URL != "" {
				urls[image.URL] = struct{}{}
			}
		}
	}
	return urls
}

func removeProductAsset(productID, url string) error {
	prefix := "/uploads/products/" + productID + "/"
	if !strings.HasPrefix(url, prefix) {
		return nil
	}
	name := strings.TrimPrefix(url, prefix)
	if name == "" || filepath.Base(name) != name || name == "." || name == ".." {
		return fmt.Errorf("ruta de imagen no válida")
	}
	return os.Remove(filepath.Join("uploads", "products", productID, name))
}
