package models

// MediaType represents the type of media (movie, tv show, etc.)
type MediaType int

const (
	MediaTypeMovie MediaType = iota
	MediaTypeTVShow
	MediaTypeAnime
	MediaTypeUnknown
)
