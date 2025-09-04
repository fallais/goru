package handlers

import (
	"fmt"
	"net/http"

	"goru/internal/models"
	"goru/pkg/log"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// TVShowGetResponse represents the response from TV show get
type TVShowGetResponse struct {
	TVShow *models.TVShow `json:"tvshow"`
}

func (h *TVShowHandler) Get(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	tvshow, err := h.provider.GetTVShowByID(id)
	if err != nil {
		log.Error("TV show get failed", zap.Error(err), zap.String("id", id))
		writeError(w, fmt.Sprintf("get failed: %v", err), http.StatusInternalServerError)
		return
	}

	response := TVShowGetResponse{
		TVShow: tvshow,
	}

	writeJSON(w, response)
}
