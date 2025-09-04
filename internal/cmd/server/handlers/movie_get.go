package handlers

import (
	"fmt"
	"goru/internal/models"
	"goru/pkg/log"
	"net/http"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type MovieGetResponse struct {
	Movie *models.Movie `json:"movie"`
}

func (h *MovieHandler) Get(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	movie, err := h.provider.GetMovieByID(id)
	if err != nil {
		log.Error("Failed to get movie", zap.Error(err), zap.String("id", id))
		writeError(w, fmt.Sprintf("failed to get movie: %v", err), http.StatusInternalServerError)
		return
	}

	response := MovieGetResponse{
		Movie: movie,
	}

	writeJSON(w, response)
}
