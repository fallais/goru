package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"

	"goru/internal/services/files"
	"goru/internal/services/states"
	"goru/pkg/log"

	"github.com/spf13/viper"
	"go.uber.org/zap"
)

type StateHandler struct {
	stateService *states.StateService
	fileService  *files.FileService
}

func NewStateHandler() (*StateHandler, error) {
	stateService, err := states.NewStateService()
	if err != nil {
		return nil, err
	}

	fileService := files.NewFileService("", "", viper.GetStringSlice("filters"))

	return &StateHandler{
		stateService: stateService,
		fileService:  fileService,
	}, nil
}

// StateResponse represents the response for the state endpoint
type StateResponse struct {
	Version     string              `json:"version"`
	Entries     []states.StateEntry `json:"entries"`
	ActiveCount int                 `json:"active_count"`
	TotalCount  int                 `json:"total_count"`
}

// RevertRequest represents the request body for revert operations
type RevertRequest struct {
	ID   string `json:"id,omitempty"`
	Last bool   `json:"last,omitempty"`
	All  bool   `json:"all,omitempty"`
}

// RevertResponse represents the response for revert operations
type RevertResponse struct {
	Success      bool            `json:"success"`
	Message      string          `json:"message"`
	RevertedIDs  []string        `json:"reverted_ids"`
	Failed       []RevertFailure `json:"failed,omitempty"`
	SuccessCount int             `json:"success_count"`
	TotalCount   int             `json:"total_count"`
}

type RevertFailure struct {
	ID     string `json:"id"`
	Reason string `json:"reason"`
}

// State handles GET /api/state
func (h *StateHandler) State(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	activeOnly := r.URL.Query().Get("active") == "true"
	limitStr := r.URL.Query().Get("limit")

	state, err := h.stateService.LoadState()
	if err != nil {
		log.Error("failed to load state", zap.Error(err))
		writeError(w, "Failed to load state", http.StatusInternalServerError)
		return
	}

	entries := state.Entries
	activeCount := 0

	// Filter active entries and count them
	if activeOnly {
		var filteredEntries []states.StateEntry
		for _, entry := range entries {
			if !entry.Reverted {
				filteredEntries = append(filteredEntries, entry)
				activeCount++
			}
		}
		entries = filteredEntries
	} else {
		// Count active entries for the response
		for _, entry := range entries {
			if !entry.Reverted {
				activeCount++
			}
		}
	}

	// Apply limit if specified
	if limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 && limit < len(entries) {
			entries = entries[:limit]
		}
	}

	response := StateResponse{
		Version:     state.Version,
		Entries:     entries,
		ActiveCount: activeCount,
		TotalCount:  len(state.Entries),
	}

	writeJSON(w, response)
}

// Revert handles POST /api/state/revert
func (h *StateHandler) Revert(w http.ResponseWriter, r *http.Request) {
	var req RevertRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate that only one option is specified
	optionCount := 0
	if req.ID != "" {
		optionCount++
	}
	if req.Last {
		optionCount++
	}
	if req.All {
		optionCount++
	}

	if optionCount == 0 {
		writeError(w, "Must specify one of: id, last, or all", http.StatusBadRequest)
		return
	}

	if optionCount > 1 {
		writeError(w, "Can only specify one of: id, last, or all", http.StatusBadRequest)
		return
	}

	var entriesToRevert []states.StateEntry

	if req.ID != "" {
		// Revert specific entry by ID
		entry, err := h.stateService.GetEntryByID(req.ID)
		if err != nil {
			writeError(w, err.Error(), http.StatusNotFound)
			return
		}

		if entry.Reverted {
			writeError(w, "Entry is already reverted", http.StatusBadRequest)
			return
		}

		entriesToRevert = []states.StateEntry{*entry}
	} else if req.Last {
		// Revert last active entry
		entry, err := h.stateService.GetLastActiveEntry()
		if err != nil {
			writeError(w, err.Error(), http.StatusNotFound)
			return
		}

		entriesToRevert = []states.StateEntry{*entry}
	} else if req.All {
		// Revert all active entries
		entries, err := h.stateService.GetActiveEntries()
		if err != nil {
			writeError(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if len(entries) == 0 {
			writeError(w, "No active entries to revert", http.StatusBadRequest)
			return
		}

		entriesToRevert = entries
	}

	// Perform the reverts
	var revertedIDs []string
	var failures []RevertFailure
	successCount := 0

	for _, entry := range entriesToRevert {
		log.Debug("Attempting to revert entry",
			zap.String("id", entry.ID),
			zap.String("from", entry.NewName),
			zap.String("to", entry.OriginalName))

		failure := h.revertEntry(entry)
		if failure != nil {
			failures = append(failures, *failure)
			log.Warn("Failed to revert entry",
				zap.String("id", entry.ID),
				zap.String("reason", failure.Reason))
		} else {
			revertedIDs = append(revertedIDs, entry.ID)
			successCount++
			log.Info("Successfully reverted entry",
				zap.String("id", entry.ID),
				zap.String("original_name", entry.OriginalName))
		}
	}

	response := RevertResponse{
		Success:      successCount > 0,
		Message:      h.buildRevertMessage(successCount, len(entriesToRevert)),
		RevertedIDs:  revertedIDs,
		Failed:       failures,
		SuccessCount: successCount,
		TotalCount:   len(entriesToRevert),
	}

	// Use appropriate HTTP status code
	statusCode := http.StatusOK
	if successCount == 0 {
		statusCode = http.StatusBadRequest
	} else if successCount < len(entriesToRevert) {
		statusCode = http.StatusPartialContent
	}

	w.WriteHeader(statusCode)
	writeJSON(w, response)
}

// revertEntry attempts to revert a single entry and returns failure info if unsuccessful
func (h *StateHandler) revertEntry(entry states.StateEntry) *RevertFailure {
	// Check if the new file still exists
	if _, err := os.Stat(entry.NewPath); os.IsNotExist(err) {
		return &RevertFailure{
			ID:     entry.ID,
			Reason: "File not found: " + entry.NewPath,
		}
	}

	// Check if original path would conflict
	originalPath := entry.OriginalPath
	if _, err := os.Stat(originalPath); err == nil {
		return &RevertFailure{
			ID:     entry.ID,
			Reason: "Original file already exists: " + originalPath,
		}
	}

	// Perform the revert
	if err := h.fileService.RenameFile(entry.NewPath, originalPath); err != nil {
		return &RevertFailure{
			ID:     entry.ID,
			Reason: "Failed to rename file: " + err.Error(),
		}
	}

	// Mark as reverted in state
	if err := h.stateService.MarkAsReverted(entry.ID); err != nil {
		// File was reverted but state wasn't updated - this is a warning, not a failure
		log.Warn("File reverted but failed to update state",
			zap.String("id", entry.ID),
			zap.Error(err))
	}

	return nil
}

// buildRevertMessage creates an appropriate message based on the revert results
func (h *StateHandler) buildRevertMessage(successCount, totalCount int) string {
	if successCount == 0 {
		return "No operations could be reverted"
	} else if successCount == totalCount {
		if totalCount == 1 {
			return "Operation successfully reverted"
		}
		return "All operations successfully reverted"
	} else {
		return "Some operations could not be reverted"
	}
}
