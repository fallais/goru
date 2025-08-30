package models

// VideoFile represents a video file.
type VideoFile struct {
	Path     string   `json:"path"`
	Filename string   `json:"filename"`
	FileType FileType `json:"file_type"`

	// Media type can be Movie or TVShow
	MediaType MediaType `json:"media_type"`

	// Metadata can be Movie or Episode
	Metadata any `json:"metadata"`

	ConflictStrategy ConflictStrategy `json:"conflict_strategy"`
}
