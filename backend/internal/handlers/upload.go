package handlers

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func UploadProductImage(c *gin.Context) {
	productID := c.Param("id")
	if productID == "" || filepath.Base(productID) != productID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de producto inválido"})
		return
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxImageSize+(1<<20))
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió ningún archivo válido"})
		return
	}
	defer file.Close()
	ext, err := validateImage(file, header.Size)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	filename := uuid.NewString() + ext
	uploadDir := filepath.Join("uploads", "products", productID)
	if err := os.MkdirAll(uploadDir, 0750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear la carpeta de imágenes"})
		return
	}
	filePath := filepath.Join(uploadDir, filename)
	if err := c.SaveUploadedFile(header, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo guardar la imagen"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"url": "/uploads/products/" + productID + "/" + filename})
}
