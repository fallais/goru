package files

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"goru/internal/models"
	"goru/internal/utils"
	"goru/pkg/log"

	"go.uber.org/zap"
)

var SupportedExtensions = []models.FileType{
	models.FileTypeMP4,
	models.FileTypeMKV,
	models.FileTypeAVI,
	models.FileTypeMOV,
	models.FileTypeWMV,
	models.FileTypeFLV,
	models.FileTypeWEBM,
	models.FileTypeM4V,
	models.FileTypeMPG,
	models.FileTypeMPEG,
	models.FileType3GP,
	models.FileTypeOGV,
}

// FileService handles file operations and scanning
type FileService struct {
	supportedExtensions []models.FileType
	filters             []string
}

// NewFileService creates a new file service instance
func NewFileService(tvTemplate, movieTemplate string, filters []string) *FileService {
	fileService := &FileService{
		supportedExtensions: SupportedExtensions,
		filters:             filters,
	}

	return fileService
}

// ScanDirectory scans a directory for video files
func (fs *FileService) ScanDirectory(dirPath string, recursive bool, mediaTypeOverride string) ([]*models.VideoFile, error) {
	var videoFiles []*models.VideoFile

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Skip directories
		if info.IsDir() {
			// If not recursive and this is a subdirectory, skip it
			if !recursive && path != dirPath {
				return filepath.SkipDir
			}
			return nil
		}

		// Check if file has a supported video extension
		ext := strings.ToLower(filepath.Ext(path))
		if !models.IsSupportedExtension(ext) {
			log.Error("unsupported video file type", zap.String("file", path))
			return nil
		}

		videoFile := &models.VideoFile{
			Path:     path,
			Filename: info.Name(),
		}

		// Try to determine media type from filename
		switch mediaTypeOverride {
		case "movie":
			videoFile.MediaType = models.MediaTypeMovie
		case "tv":
			videoFile.MediaType = models.MediaTypeTVShow
		case "auto":
			videoFile.MediaType = utils.GuessMediaType(info.Name())
		}

		videoFiles = append(videoFiles, videoFile)
		return nil
	})

	return videoFiles, err
}

// RenameFile renames a file from old path to new path with conflict resolution
func (fs *FileService) RenameFile(oldPath, newPath string) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(newPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}

	// Perform the actual rename
	if err := os.Rename(oldPath, newPath); err != nil {
		return fmt.Errorf("failed to rename %s to %s: %w", oldPath, newPath, err)
	}

	return nil
}

// RenameFileSimple renames a file without conflict resolution (legacy method)
func (fs *FileService) RenameFileSimple(oldPath, newPath string) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(newPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	return os.Rename(oldPath, newPath)
}
