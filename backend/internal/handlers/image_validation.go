package handlers

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
)

const maxImageSize = 5 << 20

// validateImage checks the bytes, not the client-supplied MIME type or filename.
func validateImage(file multipart.File, size int64) (string, error) {
	if size <= 0 || size > maxImageSize {
		return "", fmt.Errorf("el archivo debe pesar entre 1 byte y 5 MB")
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("no se pudo leer el archivo")
	}
	header := make([]byte, 512)
	n, err := file.Read(header)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("no se pudo leer el archivo")
	}
	contentType := http.DetectContentType(header[:n])
	ext := ""
	switch contentType {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	default:
		if n >= 12 && string(header[:4]) == "RIFF" && string(header[8:12]) == "WEBP" {
			ext = ".webp"
		} else {
			return "", fmt.Errorf("formato no permitido; usa JPG, PNG o WEBP")
		}
	}
	if ext != ".webp" {
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			return "", fmt.Errorf("no se pudo leer el archivo")
		}
		if _, _, err := image.DecodeConfig(file); err != nil {
			return "", fmt.Errorf("el archivo no contiene una imagen válida")
		}
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("no se pudo leer el archivo")
	}
	return ext, nil
}
