package models

import "time"

// Episode represents a TV show episode
type Episode struct {
	Title     string    `json:"name"`
	Season    int       `json:"season_number"`
	Episode   int       `json:"episode_number"`
	AirDate   time.Time `json:"air_date"`
	Summary   string    `json:"overview"`
	Thumbnail string    `json:"still_path"`
	TVShow    TVShow    `json:"tv_show,omitempty"`

	ExternalIDs ExternalIDs `json:"external_ids,omitempty"`
}
