package handlers

import (
	"goru/internal/services/providers"
)

type MovieHandler struct {
	provider providers.Provider
}

// NewMovieHandler creates a new movie handler
func NewMovieHandler(provider providers.Provider) MovieHandler {
	return MovieHandler{
		provider: provider,
	}
}
