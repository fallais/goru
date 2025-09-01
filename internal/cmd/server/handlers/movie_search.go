package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"goru/internal/models"
	"goru/internal/services/providers"
	"goru/pkg/log"

	"go.uber.org/zap"
)

// MovieSearchRequest represents a movie search request
type MovieSearchRequest struct {
	Query string `json:"query"`
	Year  int    `json:"year,omitempty"`
}

// MovieSearchResponse represents the response from movie search
type MovieSearchResponse struct {
	Results []*models.Movie `json:"results"`
	Status  string          `json:"status"`
	Error   string          `json:"error,omitempty"`
}

// MovieSearchHandler handles movie search requests
type MovieSearchHandler struct {
	provider providers.Provider
}

// NewMovieSearchHandler creates a new movie search handler
func NewMovieSearchHandler(provider providers.Provider) MovieSearchHandler {
	return MovieSearchHandler{
		provider: provider,
	}
}

// Search handles movie search requests
func (h *MovieSearchHandler) Search(w http.ResponseWriter, r *http.Request) {
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

	results, err := h.searchMovies(query, year)
	if err != nil {
		log.Error("Movie search failed", zap.Error(err), zap.String("query", query))
		writeError(w, fmt.Sprintf("search failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := MovieSearchResponse{
		Results: results,
		Status:  "success",
	}

	writeJSON(w, response)
}

// searchMovies searches for movies using the provider
func (h *MovieSearchHandler) searchMovies(query string, year int) ([]*models.Movie, error) {
	movies, err := h.provider.SearchMovies(query, year)
	if err != nil {
		return nil, fmt.Errorf("movie search failed: %w", err)
	}

	return movies, nil
}
