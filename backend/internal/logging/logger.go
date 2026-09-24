package logging

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"time"
)

const (
	logDirectory = "./logs"
	retention    = 48 * time.Hour
)

var (
	App   *log.Logger
	Error *log.Logger

	appFile   *os.File
	errorFile *os.File
)

func Init() error {
	if err := os.MkdirAll(logDirectory, 0755); err != nil {
		return fmt.Errorf("error creando directorio de logs: %w", err)
	}

	if err := cleanOldLogs(); err != nil {
		return fmt.Errorf("error limpiando logs antiguos: %w", err)
	}

	if err := rotate(); err != nil {
		return err
	}

	return nil
}

func rotate() error {
	Close()

	date := time.Now().Format("2006-01-02")

	var err error

	appFile, err = openLogFile(
		fmt.Sprintf("app-%s.log", date),
	)
	if err != nil {
		return err
	}

	errorFile, err = openLogFile(
		fmt.Sprintf("error-%s.log", date),
	)
	if err != nil {
		appFile.Close()
		return err
	}

	App = log.New(
		io.MultiWriter(os.Stdout, appFile),
		"",
		log.Ldate|log.Ltime|log.Lmicroseconds,
	)

	Error = log.New(
		io.MultiWriter(os.Stderr, errorFile),
		"",
		log.Ldate|log.Ltime|log.Lmicroseconds,
	)

	return nil
}

func openLogFile(name string) (*os.File, error) {
	path := filepath.Join(logDirectory, name)

	file, err := os.OpenFile(
		path,
		os.O_CREATE|os.O_APPEND|os.O_WRONLY,
		0644,
	)

	if err != nil {
		return nil, fmt.Errorf(
			"error abriendo archivo de log %s: %w",
			path,
			err,
		)
	}

	return file, nil
}

func cleanOldLogs() error {
	entries, err := os.ReadDir(logDirectory)
	if err != nil {
		return err
	}

	cutoff := time.Now().Add(-retention)

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			path := filepath.Join(
				logDirectory,
				entry.Name(),
			)

			if err := os.Remove(path); err != nil {
				return err
			}
		}
	}

	return nil
}

func Close() {
	if appFile != nil {
		_ = appFile.Close()
		appFile = nil
	}

	if errorFile != nil {
		_ = errorFile.Close()
		errorFile = nil
	}
}
