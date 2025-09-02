package handlers

import (
	"fmt"
	"goru/pkg/log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

// Response structures
type DirectoryResponse struct {
	Files []FileInfo `json:"files"`
	Path  string     `json:"path"`
}

type FileInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	IsDir   bool   `json:"isDir"`
	Size    int64  `json:"size"`
	ModTime string `json:"modTime"`
}

// Directory handles directory listing requests
func Directory(w http.ResponseWriter, r *http.Request) {
	directory := r.URL.Query().Get("path")
	if directory == "" {
		writeError(w, "directory path is required", http.StatusBadRequest)
		return
	}

	// Check if directory exists
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		writeError(w, "directory does not exist", http.StatusNotFound)
		return
	}

	// Read directory contents
	entries, err := os.ReadDir(directory)
	if err != nil {
		writeError(w, fmt.Sprintf("failed to read directory: %v", err), http.StatusInternalServerError)
		return
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		files = append(files, FileInfo{
			Name:    entry.Name(),
			Path:    filepath.Join(directory, entry.Name()),
			IsDir:   entry.IsDir(),
			Size:    info.Size(),
			ModTime: info.ModTime().Format("2006-01-02 15:04:05"),
		})
	}

	response := DirectoryResponse{
		Files: files,
		Path:  directory,
	}

	writeJSON(w, response)
}

// DefaultDirectory handles current directory request
func DefaultDirectory(w http.ResponseWriter, r *http.Request) {
	log.Info("Default directory requested")

	// Return default directory
	writeJSON(w, viper.GetString("directory"))
}
