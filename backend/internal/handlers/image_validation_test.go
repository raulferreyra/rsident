package handlers

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"testing"
)

func multipartFile(data []byte) multipart.File {
	return &seekableBuffer{Reader: bytes.NewReader(data)}
}

type seekableBuffer struct{ *bytes.Reader }

func (b *seekableBuffer) Close() error { return nil }

func TestValidateImageRejectsFakeMimeAndUnsupportedContent(t *testing.T) {
	file := multipartFile([]byte("not an image"))
	defer file.Close()
	if _, err := validateImage(file, int64(len("not an image"))); err == nil {
		t.Fatal("expected non-image content to be rejected")
	}
}

func TestValidateImageRejectsOversizedFile(t *testing.T) {
	file := multipartFile([]byte{0xff, 0xd8, 0xff})
	defer file.Close()
	if _, err := validateImage(file, maxImageSize+1); err == nil {
		t.Fatal("expected oversized image to be rejected")
	}
}

func TestValidateImageAcceptsValidPNG(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 1, 1))
	img.Set(0, 0, color.RGBA{R: 20, G: 40, B: 60, A: 255})
	var buffer bytes.Buffer
	if err := png.Encode(&buffer, img); err != nil {
		t.Fatal(err)
	}
	data := buffer.Bytes()
	file := multipartFile(data)
	defer file.Close()
	ext, err := validateImage(file, int64(len(data)))
	if err != nil {
		t.Fatalf("expected valid PNG, got: %v", err)
	}
	if ext != ".png" {
		t.Fatalf("expected .png, got %q", ext)
	}
}

func TestValidateImageRejectsTruncatedPNG(t *testing.T) {
	data := []byte{0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a, 0x00}
	file := multipartFile(data)
	defer file.Close()
	if _, err := validateImage(file, int64(len(data))); err == nil {
		t.Fatal("expected truncated PNG to be rejected")
	}
}

func TestValidateImageRejectsMalformedWebPContainer(t *testing.T) {
	data := []byte{'R', 'I', 'F', 'F', 0x04, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P'}
	file := multipartFile(data)
	defer file.Close()
	if _, err := validateImage(file, int64(len(data))); err == nil {
		t.Fatal("expected malformed WEBP to be rejected")
	}
}

func TestValidWebPContainerRejectsRIFFWithoutImageFrame(t *testing.T) {
	data := []byte{
		'R', 'I', 'F', 'F', 0x04, 0x00, 0x00, 0x00, 'W', 'E', 'B', 'P',
	}
	if validWebPContainer(data) {
		t.Fatal("expected RIFF header without chunks to be rejected")
	}
}
