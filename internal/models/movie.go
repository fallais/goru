package models

import "time"

type Movie struct {
	ID            string      `json:"id"`
	Title         string      `json:"title"`
	OriginalTitle string      `json:"original_title"`
	ReleaseDate   time.Time   `json:"release_date"`
	Genre         Genre       `json:"genre"`
	Director      string      `json:"director"`
	ExternalIDs   ExternalIDs `json:"external_ids"`
}

type ExternalIDs struct {
	TMDBID  string `json:"tmdb_id"`
	TVDBID  string `json:"tvdb_id"`
	AniDBID string `json:"anidb_id"`
}

type Confidence struct {
	Score float64 `json:"score"`
}
