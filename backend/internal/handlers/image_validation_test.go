package handlers

import (
	"bytes"
	"encoding/base64"
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
	encoded := "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pXcAAAAASUVORK5CYII="
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		t.Fatal(err)
	}
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
