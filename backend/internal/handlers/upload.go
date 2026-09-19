package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UploadProductImage(c *gin.Context) {
	productID := c.Param("id")

	if productID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "ID de producto requerido",
		})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No se recibió ningún archivo",
		})
		return
	}

	if !strings.HasPrefix(file.Header.Get("Content-Type"), "image/") {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "El archivo debe ser una imagen",
		})
		return
	}

	if file.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "La imagen no puede superar los 5 MB",
		})
		return
	}

	extension := strings.ToLower(filepath.Ext(file.Filename))

	if extension == "" {
		extension = ".jpg"
	}

	filename := uuid.NewString() + extension

	uploadDir := filepath.Join(
		"uploads",
		"products",
		productID,
	)

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo crear la carpeta de imágenes",
		})
		return
	}

	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo guardar la imagen",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"url": "/uploads/products/" + productID + "/" + filename,
	})
}
