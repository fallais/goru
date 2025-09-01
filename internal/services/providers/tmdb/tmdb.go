package tmdb

import (
	"fmt"
	"strconv"
	"time"

	"goru/internal/models"
	"goru/internal/services/providers"
	"goru/internal/utils"

	tmdb "github.com/cyruzin/golang-tmdb"
)

// TMDB allows up to 50 requests per second
const TMDBRateLimit = 50

type tmdbProvider struct {
	client      *tmdb.Client
	apiKey      string
	rateLimiter *providers.RateLimiter
}

// New creates a new TMDB service instance
func New(apiKey string) (providers.Provider, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("TMDB API key is required")
	}

	client, err := tmdb.InitV4(apiKey)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize TMDB client: %w", err)
	}

	// Create rate limiter for 50 requests per second (TMDB API limit)
	rateLimiter := providers.NewRateLimiter(TMDBRateLimit)

	return &tmdbProvider{
		client:      client,
		apiKey:      apiKey,
		rateLimiter: rateLimiter,
	}, nil
}

func (d *tmdbProvider) Provide(file *models.VideoFile) error {
	// Clean the filename for searching
	cleanName := utils.CleanTitle(file.Filename)
	year := providers.ExtractYear(file.Filename)

	switch file.MediaType {
	case models.MediaTypeMovie:
		// Fetch movie metadata from TMDB
		movie, err := d.SearchMovies(cleanName, year)
		if err != nil {
			return fmt.Errorf("failed to fetch movie metadata: %w", err)
		}

		file.Metadata = movie
	case models.MediaTypeTVShow:
		season, episode := utils.ExtractSeasonEpisode(file.Filename)
		if season == 0 || episode == 0 {
			return fmt.Errorf("could not extract season/episode from filename: %s", file.Filename)
		}

		show, err := d.GetTVShow(cleanName, year)
		if err != nil {
			return fmt.Errorf("failed to search TV show: %w", err)
		}

		// Get episode information
		episodeInfo, err := d.getEpisodeInfo(show, season, episode)
		if err != nil {
			return fmt.Errorf("failed to get episode info: %w", err)
		}
		episodeInfo.TVShow = *show

		file.Metadata = episodeInfo
	}

	return nil
}

// SearchMovie searches for movies by title with improved matching
func (d *tmdbProvider) GetMovie(title string, year int) (*models.Movie, error) {
	movies, err := d.SearchMovies(title, year)
	if err != nil {
		return nil, fmt.Errorf("failed to search movies: %w", err)
	}
	if len(movies) == 0 {
		return nil, providers.ErrNoMoviesFound
	}
	return movies[0], nil
}

// SearchMovie searches for movies by title with improved matching
func (d *tmdbProvider) SearchMovies(title string, year int) ([]*models.Movie, error) {
	d.rateLimiter.Wait()

	options := map[string]string{}
	if year > 0 {
		options["year"] = strconv.Itoa(year)
	}

	resp, err := d.client.GetSearchMovies(title, options)
	if err != nil {
		return nil, fmt.Errorf("TMDB movie search failed: %w", err)
	}
	if len(resp.Results) == 0 {
		return nil, providers.ErrNoMoviesFound
	}

	var movies []*models.Movie
	for _, tmdbMovie := range resp.Results {
		movie, err := tmdbMovieToModel(tmdbMovie)
		if err != nil {
			return nil, fmt.Errorf("failed to convert TMDB movie to model: %w", err)
		}

		movies = append(movies, movie)
	}

	return movies, nil

	// If no results, try searching with individual words
	/* words := strings.Fields(title)
	if len(words) > 1 {
		// Try different combinations of words, starting with longer combinations
		for i := len(words); i >= 1; i-- {
			for j := 0; j <= len(words)-i; j++ {
				query := strings.Join(words[j:j+i], " ")
				if movie, err := d.searchMovieWithQuery(query, year); err == nil {
					return movie, nil
				}
			}
		}
	} */

}

func (d *tmdbProvider) GetTVShow(name string, year int) (*models.TVShow, error) {
	tvShows, err := d.SearchTVShows(name, year)
	if err != nil {
		return nil, fmt.Errorf("failed to search TV shows: %w", err)
	}
	if len(tvShows) == 0 {
		return nil, providers.ErrNoTVShowsFound
	}
	return tvShows[0], nil
}

// SearchTVShow searches for TV shows by name with improved matching
func (d *tmdbProvider) SearchTVShows(name string, year int) ([]*models.TVShow, error) {
	d.rateLimiter.Wait()

	options := map[string]string{}
	if year > 0 {
		options["first_air_date_year"] = strconv.Itoa(year)
	}

	// First try the exact name
	resp, err := d.client.GetSearchTVShow(name, options)
	if err != nil {
		return nil, fmt.Errorf("TMDB TV show search failed: %w", err)
	}
	if len(resp.Results) == 0 {
		return nil, providers.ErrNoTVShowsFound
	}

	var tvshows []*models.TVShow
	for _, tmdbShow := range resp.Results {
		show, err := tmdbShowToModel(tmdbShow)
		if err != nil {
			return nil, fmt.Errorf("failed to convert TMDB TV show to model: %w", err)
		}

		tvshows = append(tvshows, show)
	}

	return tvshows, nil
}

// GetEpisode gets episode information for a specific TV show
func (d *tmdbProvider) GetEpisode(tvShowID, seasonNumber, episodeNumber int) (*models.Episode, error) {
	d.rateLimiter.Wait()

	episode, err := d.client.GetTVEpisodeDetails(tvShowID, seasonNumber, episodeNumber, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get episode details: %w", err)
	}

	// Parse air date
	var airDate time.Time
	if episode.AirDate != "" {
		if date, err := time.Parse("2006-01-02", episode.AirDate); err == nil {
			airDate = date
		}
	}

	return &models.Episode{
		Title:     episode.Name,
		Season:    episode.SeasonNumber,
		Episode:   episode.EpisodeNumber,
		AirDate:   airDate,
		Summary:   episode.Overview,
		Thumbnail: episode.StillPath,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(episode.ID, 10),
		},
	}, nil
}

// GetEpisode gets episode information for a specific TV show
func (d *tmdbProvider) ListEpisodes(tvShowID, seasonNumber int) ([]*models.Episode, error) {
	d.rateLimiter.Wait()

	resp, err := d.client.GetTVSeasonDetails(tvShowID, seasonNumber, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get episode details: %w", err)
	}

	var episodes []*models.Episode
	for _, episode := range resp.Episodes {
		var airDate time.Time
		if episode.AirDate != "" {
			if date, err := time.Parse("2006-01-02", episode.AirDate); err == nil {
				airDate = date
			}
		}

		episodes = append(episodes, &models.Episode{
			Title:     episode.Name,
			Season:    episode.SeasonNumber,
			Episode:   episode.EpisodeNumber,
			AirDate:   airDate,
			Summary:   episode.Overview,
			Thumbnail: episode.StillPath,
			ExternalIDs: models.ExternalIDs{
				TMDBID: strconv.FormatInt(episode.ID, 10),
			},
		})
	}

	return episodes, nil
}

// -------------------- Helper Functions -----------------------------

// getEpisodeInfo helper method to get episode information
func (d *tmdbProvider) getEpisodeInfo(show *models.TVShow, season, episode int) (*models.Episode, error) {
	// Try to get episode from database service first
	showID, err := strconv.Atoi(show.ExternalIDs.TMDBID)
	if err != nil {
		return nil, fmt.Errorf("invalid show ID: %w", err)
	}

	episodeInfo, err := d.GetEpisode(showID, season, episode)
	if err != nil {
		return nil, fmt.Errorf("failed to get episode from database: %w", err)
	}

	return episodeInfo, nil
}
