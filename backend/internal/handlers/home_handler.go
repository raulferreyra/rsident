package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/raulferreyra/rsident/backend/internal/models"
	"github.com/raulferreyra/rsident/backend/internal/services"
)

type HomeHandler struct{ service *services.HomeService }

func NewHomeHandler(s *services.HomeService) *HomeHandler { return &HomeHandler{service: s} }
func (h *HomeHandler) Get(c *gin.Context) {
	cfg, err := h.service.Get(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo cargar la configuración del Home"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}
func (h *HomeHandler) Save(c *gin.Context) {
	var cfg models.HomeConfig
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Configuración inválida"})
		return
	}
	if err := h.service.Save(c.Request.Context(), cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func (h *HomeHandler) UploadMedia(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 52<<20)
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió ningún archivo"})
		return
	}
	defer file.Close()
	ext := strings.ToLower(filepath.Ext(header.Filename))
	allowed := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".mp4": true, ".webm": true}
	if !allowed[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Formato no permitido. Usa JPG, PNG, WEBP, MP4 o WEBM"})
		return
	}
	if header.Size <= 0 || header.Size > 50<<20 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El archivo debe pesar como máximo 50 MB"})
		return
	}
	name := uuid.NewString() + ext
	dir := filepath.Join("uploads", "home")
	if err := os.MkdirAll(dir, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear la carpeta de medios"})
		return
	}
	if err := c.SaveUploadedFile(header, filepath.Join(dir, name)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar el medio"})
		return
	}
	mediaType := "image"
	if ext == ".mp4" || ext == ".webm" {
		mediaType = "video"
	}
	c.JSON(http.StatusCreated, gin.H{"url": "/uploads/home/" + name, "mediaType": mediaType})
}
