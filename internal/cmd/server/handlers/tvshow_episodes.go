package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"goru/internal/models"
	"goru/pkg/log"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// EpisodeSearchResponse represents the response from episode search
type EpisodeSearchResponse struct {
	Episodes []*models.Episode `json:"episodes"`
}

func (h *TVShowHandler) ListEpisodes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tvShowIDString := vars["id"]

	tvShowID, err := strconv.Atoi(tvShowIDString)
	if err != nil {
		log.Error("Invalid TVShow ID", zap.String("tvshow_id", tvShowIDString), zap.Error(err))
		writeError(w, "invalid tvshow_id parameter", http.StatusBadRequest)
		return
	}

	var season int
	if seasonStr := r.URL.Query().Get("season"); seasonStr != "" {
		var err error
		season, err = strconv.Atoi(seasonStr)
		if err != nil {
			log.Error("Invalid season parameter", zap.String("season", seasonStr), zap.Error(err))
			writeError(w, "invalid season parameter", http.StatusBadRequest)
			return
		}
	}

	episodes, err := h.provider.ListEpisodes(tvShowID, season)
	if err != nil {
		log.Error("TV show search failed", zap.Error(err))
		writeError(w, fmt.Sprintf("search failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := EpisodeSearchResponse{
		Episodes: episodes,
	}

	writeJSON(w, response)
}
