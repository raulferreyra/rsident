package handlers

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
)

const maxImageSize = 5 << 20

// validateImage valida el contenido real y no confía en el MIME ni en el nombre del cliente.
func validateImage(file multipart.File, size int64) (string, error) {
	if size <= 0 || size > maxImageSize {
		return "", fmt.Errorf("el archivo debe pesar entre 1 byte y 5 MB")
	}
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", fmt.Errorf("no se pudo leer el archivo")
	}
	data, err := io.ReadAll(io.LimitReader(file, maxImageSize+1))
	if err != nil || int64(len(data)) != size || len(data) > maxImageSize {
		return "", fmt.Errorf("no se pudo leer la imagen completa")
	}

	contentType := http.DetectContentType(data[:min(len(data), 512)])
	switch contentType {
	case "image/jpeg":
		if _, _, err := image.Decode(bytes.NewReader(data)); err != nil {
			return "", fmt.Errorf("el archivo JPEG está dañado o incompleto")
		}
		return ".jpg", nil
	case "image/png":
		if _, _, err := image.Decode(bytes.NewReader(data)); err != nil {
			return "", fmt.Errorf("el archivo PNG está dañado o incompleto")
		}
		return ".png", nil
	default:
		if validWebPContainer(data) {
			return ".webp", nil
		}
		return "", fmt.Errorf("formato no permitido o imagen dañada; usa JPG, PNG o WEBP válidos")
	}
}

// validWebPContainer valida la longitud RIFF y los límites de todos los chunks,
// y exige un chunk de imagen con una cabecera de frame coherente. La biblioteca
// estándar de Go no decodifica WEBP; por eso no se afirma una decodificación total.
func validWebPContainer(data []byte) bool {
	if len(data) < 20 || string(data[0:4]) != "RIFF" || string(data[8:12]) != "WEBP" {
		return false
	}
	if uint64(binary.LittleEndian.Uint32(data[4:8]))+8 != uint64(len(data)) {
		return false
	}

	hasImage := false
	for offset := 12; offset < len(data); {
		if len(data)-offset < 8 {
			return false
		}
		kind := string(data[offset : offset+4])
		chunkSize := uint64(binary.LittleEndian.Uint32(data[offset+4 : offset+8]))
		payloadStart := offset + 8
		payloadEnd64 := uint64(payloadStart) + chunkSize
		if payloadEnd64 > uint64(len(data)) {
			return false
		}
		payloadEnd := int(payloadEnd64)
		payload := data[payloadStart:payloadEnd]

		switch kind {
		case "VP8X":
			if len(payload) < 10 {
				return false
			}
		case "VP8 ":
			if len(payload) < 10 || payload[3] != 0x9d || payload[4] != 0x01 || payload[5] != 0x2a {
				return false
			}
			width := binary.LittleEndian.Uint16(payload[6:8]) & 0x3fff
			height := binary.LittleEndian.Uint16(payload[8:10]) & 0x3fff
			if width == 0 || height == 0 {
				return false
			}
			hasImage = true
		case "VP8L":
			if len(payload) < 5 || payload[0] != 0x2f {
				return false
			}
			hasImage = true
		}

		next := payloadEnd
		if chunkSize%2 == 1 {
			next++
		}
		if next > len(data) {
			return false
		}
		offset = next
	}
	return hasImage
}
