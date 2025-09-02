package handlers

import (
	"encoding/json"
	"fmt"
	"goru/internal/cmd/common"
	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/internal/services/plans"
	"goru/internal/services/providers"
	"goru/internal/services/providers/tmdb"
	"goru/pkg/log"
	"net/http"
	"strings"
	"sync"

	"github.com/spf13/viper"
	"go.uber.org/zap"
)

type LookupRequest struct {
	Directory string `json:"directory"`
	Type      string `json:"type"`     // "movie", "tv", "auto"
	Provider  string `json:"provider"` // "tmdb", "tvdb", "anidb"
	Recursive bool   `json:"recursive"`
}

type LookupResponse struct {
	Plan   *plans.Plan `json:"plan"`
	Status string      `json:"status"`
	Error  string      `json:"error,omitempty"`
}

type LookupHandler struct {
	fileService      *files.FileService
	formatterService *formatters.FormatterService
}

func NewLookupHandler(fileService *files.FileService, formatterService *formatters.FormatterService) LookupHandler {
	return LookupHandler{
		fileService:      fileService,
		formatterService: formatterService,
	}
}

// HandleLookup handles media lookup requests
func (h *LookupHandler) Lookup(w http.ResponseWriter, r *http.Request) {
	var req LookupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Directory == "" {
		writeError(w, "directory is required", http.StatusBadRequest)
		return
	}

	if req.Type == "" {
		req.Type = "auto"
	}
	if req.Provider == "" {
		req.Provider = "tmdb"
	}

	// Create directory configuration
	directory := models.Directory{
		Name:      "web-request",
		Path:      req.Directory,
		Type:      req.Type,
		Provider:  req.Provider,
		Recursive: req.Recursive,
	}

	// Process the directory similar to how the CLI does it
	plan, err := h.processDirectory(directory)
	if err != nil {
		writeError(w, fmt.Sprintf("failed to process directory: %v", err), http.StatusInternalServerError)
		return
	}

	response := LookupResponse{
		Plan:   plan,
		Status: "success",
	}

	writeJSON(w, response)
}

// processDirectory processes a directory and returns a plan (similar to CLI plan command)
func (h *LookupHandler) processDirectory(directory models.Directory) (*plans.Plan, error) {
	log.Debug("Processing directory", zap.String("path", directory.Path), zap.String("type", directory.Type))

	// Get video files from directory
	videoFiles, err := h.fileService.ScanDirectory(directory.Path, directory.Recursive, directory.Type)
	if err != nil {
		return nil, fmt.Errorf("failed to scan directory: %w", err)
	}

	if len(videoFiles) == 0 {
		log.Debug("No video files found in directory", zap.String("directory", directory.Path))
		// Return an empty plan instead of an error
		return &plans.Plan{
			Changes: []plans.Change{},
			Errors:  []plans.Error{},
		}, nil
	}

	// Create provider
	var provider providers.Provider
	switch strings.ToLower(directory.Provider) {
	case "tmdb":
		provider, err = tmdb.New(viper.GetString("providers.tmdb.api_key"))
		if err != nil {
			return nil, fmt.Errorf("failed to initialize TMDB provider: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported provider: %s", directory.Provider)
	}

	// Lookup media information for each file concurrently
	processedFiles, processedSubtitles, err := common.ProcessFilesConcurrently(videoFiles, provider, nil, viper.GetInt("parallelism"))
	if err != nil {
		log.Error("failed to process files concurrently", zap.Error(err))
	}

	// Create the plan
	plan, err := plans.NewPlan(processedFiles, processedSubtitles, h.formatterService)
	if err != nil {
		return nil, fmt.Errorf("failed to create plan: %w", err)
	}

	return plan, nil
}

// processFilesMetadataConcurrently processes video files metadata concurrently with a limited number of workers
func (h *LookupHandler) processFilesMetadataConcurrently(files []*models.VideoFile, provider providers.Provider, maxConcurrent int) ([]*models.VideoFile, error) {
	if len(files) == 0 {
		return files, nil
	}

	// Set conflict strategy for all files (use default if not specified)
	for _, file := range files {
		if file.ConflictStrategy == "" {
			file.ConflictStrategy = models.DefaultConflictStrategy
		}
	}

	// Create semaphore to limit concurrent operations
	semaphore := make(chan struct{}, maxConcurrent)
	var wg sync.WaitGroup
	var hasErrors bool
	var mu sync.Mutex

	// Process each file concurrently
	for _, file := range files {
		wg.Add(1)
		go func(f *models.VideoFile) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Provide metadata for the file
			err := provider.Provide(f)
			if err != nil {
				log.Error("failed to provide metadata", zap.Error(err), zap.String("file", f.Path))
				mu.Lock()
				hasErrors = true
				mu.Unlock()
			}
		}(file)
	}

	// Wait for all goroutines to complete
	wg.Wait()

	var err error
	if hasErrors {
		err = fmt.Errorf("some files failed to process metadata (check logs for details)")
	}

	return files, err
}
