package models

import "time"

type ProductImage struct {
	URL   string `json:"url" firestore:"url"`
	Alt   string `json:"alt" firestore:"alt"`
	Order int    `json:"order" firestore:"order"`
}

type ProductColor struct {
	ID       string         `json:"id" firestore:"id"`
	Name     string         `json:"name" firestore:"name"`
	ImageURL string         `json:"imageUrl" firestore:"imageUrl"`
	Images   []ProductImage `json:"images" firestore:"images"`
}

type ProductVariant struct {
	ID      string `json:"id" firestore:"id"`
	ColorID string `json:"colorId" firestore:"colorId"`
	Size    string `json:"size" firestore:"size"`
	SKU     string `json:"sku" firestore:"sku"`
	Stock   int    `json:"stock" firestore:"stock"`
}

type Product struct {
	ID           string           `json:"id" firestore:"-"`
	Name         string           `json:"name" firestore:"name"`
	Slug         string           `json:"slug" firestore:"slug"`
	Description  string           `json:"description" firestore:"description"`
	Price        float64          `json:"price" firestore:"price"`
	OldPrice     float64          `json:"oldPrice" firestore:"oldPrice"`
	CategoryID   string           `json:"categoryId" firestore:"categoryId"`
	CollectionID string           `json:"collectionId" firestore:"collectionId"`
	TagIDs       []string         `json:"tagIds" firestore:"tagIds"`
	Images       []ProductImage   `json:"images" firestore:"images"`
	Colors       []ProductColor   `json:"colors" firestore:"colors"`
	Variants     []ProductVariant `json:"variants" firestore:"variants"`
	Published    bool             `json:"published" firestore:"published"`
	Featured     bool             `json:"featured" firestore:"featured"`
	IsNew        bool             `json:"isNew" firestore:"isNew"`
	CreatedAt    time.Time        `json:"createdAt" firestore:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt" firestore:"updatedAt"`
}
