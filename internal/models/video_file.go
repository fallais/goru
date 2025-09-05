package models

import (
	"path/filepath"

	"github.com/google/uuid"
)

type ExternalIDs struct {
	TMDBID  string `json:"tmdb_id"`
	TVDBID  string `json:"tvdb_id"`
	AniDBID string `json:"anidb_id"`
}

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

	ExternalIDs ExternalIDs `json:"external_ids"`
}

func NewVideoFile(path string, cs ConflictStrategy) *VideoFile {
	vf := &VideoFile{
		ID:               uuid.New().String(),
		Path:             path,
		Filename:         filepath.Base(path),
		ConflictStrategy: cs,
	}

	vf.MediaType = GuessMediaType(vf.Filename)
	return vf
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

func (vf *VideoFile) GetFileType() FileType {
	return GetFileTypeFromExtension(filepath.Ext(vf.Filename))
}

// IsLookupUp checks if any external IDs are set for the video file.
// If yes, the video file has metadata.
func (vf *VideoFile) IsLookupUp() bool {
	return vf.ExternalIDs.TMDBID != "" || vf.ExternalIDs.TVDBID != "" || vf.ExternalIDs.AniDBID != ""
}
