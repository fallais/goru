package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"goru/internal/models"
	"goru/pkg/log"

	"go.uber.org/zap"
)

// MovieSearchResponse represents the response from movie search
type MovieSearchResponse struct {
	Movies []*models.Movie `json:"movies"`
}

// Search handles movie search requests
func (h *MovieHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		writeError(w, "query parameter is required", http.StatusBadRequest)
		return
	}

	var year int
	if yearStr := r.URL.Query().Get("year"); yearStr != "" {
		var err error
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			writeError(w, "invalid year parameter", http.StatusBadRequest)
			return
		}
	}

	movies, err := h.provider.SearchMovies(query, year)
	if err != nil {
		log.Error("Movie search failed", zap.Error(err), zap.String("query", query))
		writeError(w, fmt.Sprintf("search failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := MovieSearchResponse{
		Movies: movies,
	}

	writeJSON(w, response)
}
