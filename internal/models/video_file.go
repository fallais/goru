package models

import (
	"path/filepath"

	"github.com/google/uuid"
)

// VideoFile represents a video file.
type VideoFile struct {
	ID       string   `json:"id"`
	Path     string   `json:"path"`
	Filename string   `json:"filename"`
	FileType FileType `json:"file_type"`

	// Media type can be Movie or TVShow
	MediaType MediaType `json:"media_type"`

	// Metadata can be Movie or Episode
	Metadata any `json:"metadata"`

	ConflictStrategy ConflictStrategy `json:"conflict_strategy"`
}

func NewVideoFile(path string, fileType FileType, mediaType MediaType, cs ConflictStrategy) *VideoFile {
	return &VideoFile{
		ID:               uuid.New().String(),
		Path:             path,
		Filename:         filepath.Base(path),
		FileType:         fileType,
		MediaType:        mediaType,
		ConflictStrategy: cs,
	}
}

func (vf *VideoFile) GetID() string {
	if movie, ok := vf.Metadata.(Movie); ok {
		if movie.ExternalIDs.TMDBID != "" {
			return movie.ExternalIDs.TMDBID
		}
		if movie.ExternalIDs.TVDBID != "" {
			return movie.ExternalIDs.TVDBID
		}
		if movie.ExternalIDs.AniDBID != "" {
			return movie.ExternalIDs.AniDBID
		}
	}

	if tvshow, ok := vf.Metadata.(TVShow); ok {
		if tvshow.ExternalIDs.TMDBID != "" {
			return tvshow.ExternalIDs.TMDBID
		}
		if tvshow.ExternalIDs.TVDBID != "" {
			return tvshow.ExternalIDs.TVDBID
		}
		if tvshow.ExternalIDs.AniDBID != "" {
			return tvshow.ExternalIDs.AniDBID
		}
	}

	return vf.ID
}
