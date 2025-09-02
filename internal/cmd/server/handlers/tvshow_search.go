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

// TVShowSearchRequest represents a TV show search request
type TVShowSearchRequest struct {
	Query   string `json:"query"`
	Year    int    `json:"year,omitempty"`
	Season  int    `json:"season,omitempty"`  // For fetching specific season episodes
	Episode int    `json:"episode,omitempty"` // For fetching specific episode
}

// TVShowSearchResponse represents the response from TV show search
type TVShowSearchResponse struct {
	Results  []models.TVShow  `json:"results"`
	Episodes []models.Episode `json:"episodes,omitempty"` // When season is specified
	Status   string           `json:"status"`
	Error    string           `json:"error,omitempty"`
}

// TVShowSearchHandler handles TV show search requests
type TVShowSearchHandler struct {
	provider providers.Provider
}

// NewTVShowSearchHandler creates a new TV show search handler
func NewTVShowSearchHandler(provider providers.Provider) TVShowSearchHandler {
	return TVShowSearchHandler{
		provider: provider,
	}
}

// Search handles TV show search requests
func (h *TVShowSearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		log.Error("Query parameter is required")
		writeError(w, "query parameter is required", http.StatusBadRequest)
		return
	}

	var year, season int
	if yearStr := r.URL.Query().Get("year"); yearStr != "" {
		var err error
		year, err = strconv.Atoi(yearStr)
		if err != nil {
			log.Error("Invalid year parameter", zap.String("year", yearStr), zap.Error(err))
			writeError(w, "invalid year parameter", http.StatusBadRequest)
			return
		}
	}

	if seasonStr := r.URL.Query().Get("season"); seasonStr != "" {
		var err error
		season, err = strconv.Atoi(seasonStr)
		if err != nil {
			log.Error("Invalid season parameter", zap.String("season", seasonStr), zap.Error(err))
			writeError(w, "invalid season parameter", http.StatusBadRequest)
			return
		}
	}

	results, err := h.searchTVShows(query, year)
	if err != nil {
		log.Error("TV show search failed", zap.Error(err), zap.String("query", query))
		writeError(w, fmt.Sprintf("search failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := TVShowSearchResponse{
		Results: results,
		Status:  "success",
	}

	// If season is specified, fetch episodes for that season
	if season > 0 && len(results) > 0 {
		// For simplicity, we'll get episodes for the first show result
		// In a real implementation, you might want to handle this differently
		firstShow := results[0]
		episodes, err := h.getSeasonEpisodes(firstShow, season)
		if err != nil {
			log.Error("Failed to get season episodes", zap.Error(err), zap.Int("season", season))
			// Don't fail the entire request, just continue without episodes
		} else {
			response.Episodes = episodes
		}
	}

	writeJSON(w, response)
}

// searchTVShows searches for TV shows using the provider
func (h *TVShowSearchHandler) searchTVShows(query string, year int) ([]models.TVShow, error) {
	results, err := h.provider.SearchTVShows(query, year)
	if err != nil {
		return nil, fmt.Errorf("TV show search failed: %w", err)
	}

	var tvShows []models.TVShow
	for _, show := range results {
		tvShows = append(tvShows, models.TVShow{
			Name:         show.Name,
			OriginalName: show.OriginalName,
			FirstAirDate: show.FirstAirDate,
			Genre:        show.Genre,
			Director:     show.Director,
			Seasons:      show.Seasons,
			Episodes:     show.Episodes,
			ExternalIDs:  show.ExternalIDs,
		})
	}

	return tvShows, nil
}

// getSeasonEpisodes fetches episodes for a specific season of a TV show
func (h *TVShowSearchHandler) getSeasonEpisodes(tvShow models.TVShow, seasonNumber int) ([]models.Episode, error) {
	// Check if we have a valid TMDB ID
	if tvShow.ExternalIDs.TMDBID == "" {
		return nil, fmt.Errorf("no TMDB ID available for TV show")
	}

	// Convert TMDB ID to int
	tmdbID, err := strconv.Atoi(tvShow.ExternalIDs.TMDBID)
	if err != nil {
		return nil, fmt.Errorf("invalid TMDB ID: %w", err)
	}

	// Check if provider supports listing episodes
	type EpisodeProvider interface {
		ListEpisodes(tvShowID, seasonNumber int) ([]*models.Episode, error)
	}

	if episodeProvider, ok := h.provider.(EpisodeProvider); ok {
		episodes, err := episodeProvider.ListEpisodes(tmdbID, seasonNumber)
		if err != nil {
			return nil, fmt.Errorf("failed to list episodes: %w", err)
		}

		// Convert to value slice instead of pointer slice
		var result []models.Episode
		for _, ep := range episodes {
			if ep != nil {
				result = append(result, *ep)
			}
		}
		return result, nil
	}

	// Provider doesn't support episode listing
	return []models.Episode{}, nil
}
