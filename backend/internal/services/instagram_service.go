package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strconv"
)

type InstagramMedia struct {
	ID        string `json:"id"`
	MediaType string `json:"media_type"`
	MediaURL  string `json:"media_url"`
	Permalink string `json:"permalink"`
	Timestamp string `json:"timestamp"`
}

type instagramResponse struct {
	Data []InstagramMedia `json:"data"`
}

type InstagramService struct {
	apiURL      string
	accessToken string
	client      *http.Client
}

func NewInstagramService() *InstagramService {
	return &InstagramService{
		apiURL:      os.Getenv("INSTAGRAM_API_URL"),
		accessToken: os.Getenv("INSTAGRAM_ACCESS_TOKEN"),
		client:      &http.Client{},
	}
}

func (s *InstagramService) GetMedia(limit int) ([]InstagramMedia, error) {
	if s.apiURL == "" {
		return nil, fmt.Errorf("INSTAGRAM_API_URL no está configurado")
	}

	if s.accessToken == "" {
		return nil, fmt.Errorf("INSTAGRAM_ACCESS_TOKEN no está configurado")
	}

	if limit <= 0 {
		limit = 6
	}

	if limit > 25 {
		limit = 25
	}

	requestURL, err := url.Parse(s.apiURL)
	if err != nil {
		return nil, fmt.Errorf("URL de Instagram inválida: %w", err)
	}

	query := requestURL.Query()
	query.Set("fields", "id,media_type,media_url,permalink,timestamp")
	query.Set("limit", strconv.Itoa(limit))
	query.Set("access_token", s.accessToken)

	requestURL.RawQuery = query.Encode()

	request, err := http.NewRequest(http.MethodGet, requestURL.String(), nil)
	if err != nil {
		return nil, fmt.Errorf("no se pudo crear la solicitud: %w", err)
	}

	response, err := s.client.Do(request)
	if err != nil {
		return nil, fmt.Errorf("error conectando con Instagram: %w", err)
	}

	defer response.Body.Close()

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		var errorResponse struct {
			Error struct {
				Message string `json:"message"`
				Type    string `json:"type"`
				Code    int    `json:"code"`
			} `json:"error"`
		}

		if err := json.NewDecoder(response.Body).Decode(&errorResponse); err == nil {
			return nil, fmt.Errorf(
				"Instagram API respondió %d: %s",
				response.StatusCode,
				errorResponse.Error.Message,
			)
		}

		return nil, fmt.Errorf(
			"Instagram API respondió con HTTP %d",
			response.StatusCode,
		)
	}

	var result instagramResponse

	if err := json.NewDecoder(response.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("respuesta inválida de Instagram: %w", err)
	}

	return result.Data, nil
}
