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
	"goru/internal/services/states"
	"goru/pkg/log"
	"net/http"
	"strings"

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

type PlanHandler struct {
	fileService      *files.FileService
	formatterService *formatters.FormatterService
}

func NewPlanHandler(fileService *files.FileService, formatterService *formatters.FormatterService) PlanHandler {
	return PlanHandler{
		fileService:      fileService,
		formatterService: formatterService,
	}
}

// Create handles plan creation.
func (h *PlanHandler) Create(w http.ResponseWriter, r *http.Request) {
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

// ApplyRequest represents the request body for plan application
type ApplyRequest struct {
	Plan *plans.Plan `json:"plan"`
}

// ApplyResponse represents the response for plan application
type ApplyResponse struct {
	Status  string       `json:"status"`
	Applied int          `json:"applied"`
	Errors  []ApplyError `json:"errors,omitempty"`
	Summary string       `json:"summary"`
}

// ApplyError represents an error that occurred during plan application
type ApplyError struct {
	File    string `json:"file"`
	Message string `json:"message"`
}

// Apply handles plan application.
func (h *PlanHandler) Apply(w http.ResponseWriter, r *http.Request) {
	var req ApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Plan == nil {
		writeError(w, "plan is required", http.StatusBadRequest)
		return
	}

	// Initialize services
	stateService, err := states.NewStateService()
	if err != nil {
		log.Error("failed to initialize state service", zap.Error(err))
		writeError(w, "failed to initialize state tracking", http.StatusInternalServerError)
		return
	}

	// Apply the plan changes
	appliedCount := 0
	var applyErrors []ApplyError

	for _, change := range req.Plan.Changes {
		if change.Action == plans.ActionRename && !change.IsConflicting() {
			oldPath := change.Before.Path
			newPath := change.After.Path

			err := h.fileService.RenameFile(oldPath, newPath)
			if err != nil {
				log.Error("failed to rename file",
					zap.Error(err),
					zap.String("oldPath", oldPath),
					zap.String("newPath", newPath))

				applyErrors = append(applyErrors, ApplyError{
					File:    change.Before.Filename,
					Message: fmt.Sprintf("Failed to rename file: %v", err),
				})
				continue
			}

			// Track rename operation in state
			if err := stateService.AddRenameOperation(
				oldPath,
				newPath,
				change.Before.Filename,
				change.After.Filename,
				nil, // MediaInfo - using nil for now as in CLI implementation
			); err != nil {
				log.Error("failed to add rename to state", zap.Error(err))
				// Don't fail the operation, just log the warning
			}

			appliedCount++
			log.Debug("successfully renamed file",
				zap.String("from", change.Before.Filename),
				zap.String("to", change.After.Filename))
		}
	}

	// Create response
	status := "success"
	summary := fmt.Sprintf("Applied %d rename operations", appliedCount)

	if len(applyErrors) > 0 {
		if appliedCount == 0 {
			status = "error"
			summary = "Failed to apply any rename operations"
		} else {
			status = "partial"
			summary = fmt.Sprintf("Applied %d rename operations with %d errors", appliedCount, len(applyErrors))
		}
	}

	response := ApplyResponse{
		Status:  status,
		Applied: appliedCount,
		Errors:  applyErrors,
		Summary: summary,
	}

	writeJSON(w, response)
}

// processDirectory processes a directory and returns a plan (similar to CLI plan command)
func (h *PlanHandler) processDirectory(directory models.Directory) (*plans.Plan, error) {
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
