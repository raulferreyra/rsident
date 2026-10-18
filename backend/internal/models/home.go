package models

type HomeBanner struct {
	MediaURL   string `json:"mediaUrl" firestore:"mediaUrl"`
	MediaType  string `json:"mediaType" firestore:"mediaType"`
	Title      string `json:"title" firestore:"title"`
	ButtonText string `json:"buttonText" firestore:"buttonText"`
	LinkType   string `json:"linkType" firestore:"linkType"`
	LinkTarget string `json:"linkTarget" firestore:"linkTarget"`
}
type HomeConfig struct {
	Banners       []HomeBanner `json:"banners" firestore:"banners"`
	Message       string       `json:"message" firestore:"message"`
	BestSellerIDs []string     `json:"bestSellerIds" firestore:"bestSellerIds"`
}
