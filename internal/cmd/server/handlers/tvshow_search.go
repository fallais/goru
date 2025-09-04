package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"goru/internal/models"
	"goru/pkg/log"

	"go.uber.org/zap"
)

// TVShowSearchResponse represents the response from TV show search
type TVShowSearchResponse struct {
	TVShows []*models.TVShow `json:"tvshows"`
	Status  string           `json:"status"`
	Error   string           `json:"error,omitempty"`
}

func (h *TVShowHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		log.Error("TVShow query is required")
		writeError(w, "query parameter is required", http.StatusBadRequest)
		return
	}

	var year int
	if yearStr := r.URL.Query().Get("year"); yearStr != "" {
		var err error
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			log.Error("Invalid year parameter", zap.String("year", yearStr), zap.Error(err))
			writeError(w, "invalid year parameter", http.StatusBadRequest)
			return
		}
	}

	tvshows, err := h.provider.SearchTVShows(query, year)
	if err != nil {
		log.Error("TV show search failed", zap.Error(err), zap.String("query", query))
		writeError(w, fmt.Sprintf("search failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := TVShowSearchResponse{
		TVShows: tvshows,
		Status:  "success",
	}

	writeJSON(w, response)
}
