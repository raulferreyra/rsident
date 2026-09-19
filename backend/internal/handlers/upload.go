package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UploadProductImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "No se recibió ningún archivo",
		})
		return
	}

	contentType := file.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
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

	productID := c.Param("id")

	uploadDir := filepath.Join("uploads", "products", productID)

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo crear la carpeta de imágenes",
		})
		return
	}

	extension := strings.ToLower(filepath.Ext(file.Filename))

	if extension == "" {
		extension = ".jpg"
	}

	filename := fmt.Sprintf("%s%s", generateFileName(), extension)
	filePath := filepath.Join(uploadDir, filename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "No se pudo guardar la imagen",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"url":  "/uploads/products/" + productID + "/" + filename,
		"path": filePath,
	})
}

func generateFileName() string {
	return uuid.NewString()
}
