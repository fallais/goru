package providers

import (
	"goru/internal/models"
	"strconv"
	"strings"
)

type Provider interface {
	SearchMovie(title string, year int) (*models.Movie, error)
	SearchTVShow(title string, year int) (*models.TVShow, error)
	GetEpisode(showID, season, episode int) (*models.Episode, error)

	// Provide video file with metadata information coming from the Internet
	Provide(file *models.VideoFile) error
}

// ExtractYear tries to extract a year from a filename
func ExtractYear(filename string) int {
	// Look for 4-digit years (1900-2099)
	for _, word := range strings.Fields(filename) {
		if len(word) == 4 {
			if year, err := strconv.Atoi(word); err == nil {
				if year >= 1900 && year <= 2099 {
					return year
				}
			}
		}
	}
	return 0
}
