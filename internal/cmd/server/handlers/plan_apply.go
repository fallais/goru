package handlers

import (
	"encoding/json"
	"fmt"
	"goru/internal/services/plans"
	"goru/internal/services/states"
	"goru/pkg/log"
	"net/http"

	"go.uber.org/zap"
)

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
