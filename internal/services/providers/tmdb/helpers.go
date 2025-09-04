package tmdb

import (
	"fmt"
	"goru/internal/models"
	"strconv"
	"time"

	tmdb "github.com/cyruzin/golang-tmdb"
)

type TMDBMovie struct {
	VoteCount        int64   "json:\"vote_count\""
	ID               int64   "json:\"id\""
	Video            bool    "json:\"video\""
	VoteAverage      float32 "json:\"vote_average\""
	Title            string  "json:\"title\""
	Popularity       float32 "json:\"popularity\""
	PosterPath       string  "json:\"poster_path\""
	OriginalLanguage string  "json:\"original_language\""
	OriginalTitle    string  "json:\"original_title\""
	GenreIDs         []int64 "json:\"genre_ids\""
	BackdropPath     string  "json:\"backdrop_path\""
	Adult            bool    "json:\"adult\""
	Overview         string  "json:\"overview\""
	ReleaseDate      string  "json:\"release_date\""
}

type TMDBTVShow struct {
	OriginalName     string   "json:\"original_name\""
	ID               int64    "json:\"id\""
	Name             string   "json:\"name\""
	VoteCount        int64    "json:\"vote_count\""
	VoteAverage      float32  "json:\"vote_average\""
	PosterPath       string   "json:\"poster_path\""
	FirstAirDate     string   "json:\"first_air_date\""
	Popularity       float32  "json:\"popularity\""
	GenreIDs         []int64  "json:\"genre_ids\""
	OriginalLanguage string   "json:\"original_language\""
	BackdropPath     string   "json:\"backdrop_path\""
	Overview         string   "json:\"overview\""
	OriginCountry    []string "json:\"origin_country\""
}

type TMDBEpisode struct {
	AirDate        string  "json:\"air_date\""
	EpisodeNumber  int     "json:\"episode_number\""
	ID             int64   "json:\"id\""
	Name           string  "json:\"name\""
	Overview       string  "json:\"overview\""
	ProductionCode string  "json:\"production_code\""
	Runtime        int     "json:\"runtime\""
	SeasonNumber   int     "json:\"season_number\""
	ShowID         int64   "json:\"show_id\""
	StillPath      string  "json:\"still_path\""
	VoteAverage    float32 "json:\"vote_average\""
	VoteCount      int64   "json:\"vote_count\""
	Crew           []struct {
		ID          int64  "json:\"id\""
		CreditID    string "json:\"credit_id\""
		Name        string "json:\"name\""
		Department  string "json:\"department\""
		Job         string "json:\"job\""
		Gender      int    "json:\"gender\""
		ProfilePath string "json:\"profile_path\""
	} "json:\"crew\""
	GuestStars []struct {
		ID          int64  "json:\"id\""
		Name        string "json:\"name\""
		CreditID    string "json:\"credit_id\""
		Character   string "json:\"character\""
		Order       int    "json:\"order\""
		Gender      int    "json:\"gender\""
		ProfilePath string "json:\"profile_path\""
	} "json:\"guest_stars\""
}

func tmdbMovieToModel(tmdbMovie TMDBMovie) (*models.Movie, error) {
	movieModel := &models.Movie{
		ID:            strconv.FormatInt(tmdbMovie.ID, 10),
		Title:         tmdbMovie.Title,
		OriginalTitle: tmdbMovie.OriginalTitle,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(tmdbMovie.ID, 10),
		},
	}

	// Extract year from release date
	if tmdbMovie.ReleaseDate != "" {
		date, err := time.Parse("2006-01-02", tmdbMovie.ReleaseDate)
		if err != nil {
			return nil, fmt.Errorf("failed to parse release date: %w", err)
		}

		movieModel.ReleaseDate = date
	}

	return movieModel, nil
}

func tmdbMovieDetailsToModel(tmdbMovie *tmdb.MovieDetails) (*models.Movie, error) {
	movieModel := &models.Movie{
		ID:            strconv.FormatInt(tmdbMovie.ID, 10),
		Title:         tmdbMovie.Title,
		OriginalTitle: tmdbMovie.OriginalTitle,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(tmdbMovie.ID, 10),
		},
	}

	// Extract year from release date
	if tmdbMovie.ReleaseDate != "" {
		date, err := time.Parse("2006-01-02", tmdbMovie.ReleaseDate)
		if err != nil {
			return nil, fmt.Errorf("failed to parse release date: %w", err)
		}

		movieModel.ReleaseDate = date
	}

	return movieModel, nil
}

func tmdbShowToModel(tmdbShow TMDBTVShow) (*models.TVShow, error) {
	tvShowModel := &models.TVShow{
		ID:           strconv.FormatInt(tmdbShow.ID, 10),
		Name:         tmdbShow.Name,
		OriginalName: tmdbShow.OriginalName,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(tmdbShow.ID, 10),
		},
	}

	// Extract first air date
	if tmdbShow.FirstAirDate != "" {
		date, err := time.Parse("2006-01-02", tmdbShow.FirstAirDate)
		if err != nil {
			return nil, fmt.Errorf("failed to parse first air date: %w", err)
		}

		tvShowModel.FirstAirDate = date
	}

	return tvShowModel, nil
}

func tmdbShowDetailsToModel(tmdbShow *tmdb.TVDetails) (*models.TVShow, error) {
	tvShowModel := &models.TVShow{
		ID:           strconv.FormatInt(tmdbShow.ID, 10),
		Name:         tmdbShow.Name,
		OriginalName: tmdbShow.OriginalName,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(tmdbShow.ID, 10),
		},
	}

	// Extract first air date
	if tmdbShow.FirstAirDate != "" {
		date, err := time.Parse("2006-01-02", tmdbShow.FirstAirDate)
		if err != nil {
			return nil, fmt.Errorf("failed to parse first air date: %w", err)
		}

		tvShowModel.FirstAirDate = date
	}

	return tvShowModel, nil
}
