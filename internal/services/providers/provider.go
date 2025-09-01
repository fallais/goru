package providers

import (
	"errors"
	"goru/internal/models"
	"strconv"
	"strings"
)

type Provider interface {
	GetMovie(title string, year int) (*models.Movie, error)
	SearchMovies(title string, year int) ([]*models.Movie, error)

	GetTVShow(title string, year int) (*models.TVShow, error)
	SearchTVShows(title string, year int) ([]*models.TVShow, error)

	GetEpisode(showID, season, episode int) (*models.Episode, error)
	ListEpisodes(showID, season int) ([]*models.Episode, error)

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

var ErrNoMoviesFound = errors.New("no movies found")
var ErrNoTVShowsFound = errors.New("no TV shows found")
