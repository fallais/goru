package subtitles

import "goru/internal/models"

type SubtitleProvider interface {
	Get(videoFile *models.VideoFile, language string) (string, error)
	Download(videoFile *models.VideoFile, language string) error
}
