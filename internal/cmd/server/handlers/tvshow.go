package handlers

import (
	"goru/internal/services/providers"
)

type TVShowHandler struct {
	provider providers.Provider
}

// NewTVShowHandler creates a new TV show handler
func NewTVShowHandler(provider providers.Provider) TVShowHandler {
	return TVShowHandler{
		provider: provider,
	}
}
