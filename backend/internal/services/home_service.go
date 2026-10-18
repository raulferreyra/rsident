package services

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
	"github.com/raulferreyra/rsident/backend/internal/models"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type HomeService struct{ db *firestore.Client }

func NewHomeService(db *firestore.Client) *HomeService { return &HomeService{db: db} }
func (s *HomeService) Get(ctx context.Context) (models.HomeConfig, error) {
	var cfg models.HomeConfig
	doc, err := s.db.Collection("settings").Doc("home").Get(ctx)
	if status.Code(err) == codes.NotFound {
		return models.HomeConfig{Banners: []models.HomeBanner{}, BestSellerIDs: []string{}}, nil
	}
	if err != nil {
		return cfg, err
	}
	if err := doc.DataTo(&cfg); err != nil {
		return cfg, err
	}
	if cfg.Banners == nil {
		cfg.Banners = []models.HomeBanner{}
	}
	if cfg.BestSellerIDs == nil {
		cfg.BestSellerIDs = []string{}
	}
	return cfg, nil
}
func (s *HomeService) Save(ctx context.Context, cfg models.HomeConfig) error {
	if len(cfg.Banners) > 3 {
		return fmt.Errorf("el Home admite como máximo 3 banners")
	}
	if len(cfg.BestSellerIDs) > 8 {
		return fmt.Errorf("selecciona como máximo 8 productos más vendidos")
	}
	for _, b := range cfg.Banners {
		if b.MediaURL == "" || b.Title == "" || b.ButtonText == "" || b.LinkTarget == "" {
			return fmt.Errorf("cada banner requiere medio, título, botón y destino")
		}
		if b.MediaType != "image" && b.MediaType != "video" {
			return fmt.Errorf("tipo de medio no válido")
		}
		if b.LinkType != "product" && b.LinkType != "page" && b.LinkType != "filter" {
			return fmt.Errorf("tipo de enlace no válido")
		}
	}
	_, err := s.db.Collection("settings").Doc("home").Set(ctx, cfg)
	return err
}
