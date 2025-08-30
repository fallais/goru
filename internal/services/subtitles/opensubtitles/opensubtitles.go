package opensubtitles

import (
	"fmt"

	"goru/internal/models"
	"goru/internal/services/subtitles"

	"github.com/oz/osdb"
)

type openSubtitles struct {
	apiKey string
	client *osdb.Client
}

func New(apiKey string) subtitles.SubtitleProvider {
	c, _ := osdb.NewClient()
	return &openSubtitles{apiKey: apiKey, client: c}
}

func (o *openSubtitles) Get(videoFile *models.VideoFile, language string) (string, error) {
	o.client.LogIn("", "", "")

	subs, err := o.client.FileSearch(videoFile.Path, []string{language})
	if err != nil {
		return "", fmt.Errorf("failed to search subtitles: %w", err)
	}
	return subs[0].SubFileName, nil
}

func (o *openSubtitles) Download(videoFile *models.VideoFile, language string) error {
	o.client.LogIn("", "", "")

	subs, err := o.client.FileSearch(videoFile.Path, []string{language})
	if err != nil {
		return fmt.Errorf("failed to search subtitles: %w", err)
	}

	if err := o.client.Download(&subs[0]); err != nil {
		return fmt.Errorf("failed to download subtitles: %w", err)
	}

	return nil
}
