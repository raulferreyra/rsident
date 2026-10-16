package models

import "time"

type CatalogItem struct {
	ID        string    `json:"id" firestore:"-"`
	Name      string    `json:"name" firestore:"name"`
	Slug      string    `json:"slug" firestore:"slug"`
	Active    bool      `json:"active" firestore:"active"`
	CreatedAt time.Time `json:"createdAt" firestore:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt" firestore:"updatedAt"`
}
