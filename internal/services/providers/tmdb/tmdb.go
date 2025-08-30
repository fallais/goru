package tmdb

import (
	"fmt"
	"strconv"
	"strings"
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
		movie, err := d.SearchMovie(cleanName, year)
		if err != nil {
			return fmt.Errorf("failed to fetch movie metadata: %w", err)
		}

		file.Metadata = movie
	case models.MediaTypeTVShow:
		season, episode := utils.ExtractSeasonEpisode(file.Filename)
		if season == 0 || episode == 0 {
			return fmt.Errorf("could not extract season/episode from filename: %s", file.Filename)
		}

		show, err := d.SearchTVShow(cleanName, year)
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
func (d *tmdbProvider) SearchMovie(title string, year int) (*models.Movie, error) {
	// First try the exact title
	movie, err := d.searchMovieWithQuery(title, year)
	if err == nil {
		return movie, nil
	}

	// If no results, try searching with individual words
	words := strings.Fields(title)
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
	}

	return nil, fmt.Errorf("no movies found for title: %s (tried various word combinations)", title)
}

// SearchTVShow searches for TV shows by name with improved matching
func (d *tmdbProvider) SearchTVShow(name string, year int) (*models.TVShow, error) {
	// First try the exact name
	show, err := d.searchTVShowWithQuery(name, year)
	if err == nil {
		return show, nil
	}

	// If no results, try searching with individual words
	words := strings.Fields(name)
	if len(words) > 1 {
		// Try different combinations of words, starting with longer combinations
		for i := len(words); i >= 1; i-- {
			for j := 0; j <= len(words)-i; j++ {
				query := strings.Join(words[j:j+i], " ")
				if show, err := d.searchTVShowWithQuery(query, year); err == nil {
					return show, nil
				}
			}
		}
	}

	return nil, fmt.Errorf("no TV shows found for name: %s (tried various word combinations)", name)
}

// GetEpisode gets episode information for a specific TV show
func (d *tmdbProvider) GetEpisode(tvShowID, seasonNumber, episodeNumber int) (*models.Episode, error) {
	episode, err := d.getTVEpisodeDetails(tvShowID, seasonNumber, episodeNumber, nil)
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

// -------------------- Helper Functions -----------------------------

// searchMovieWithQuery performs a single search query to TMDB
func (d *tmdbProvider) searchMovieWithQuery(title string, year int) (*models.Movie, error) {
	options := map[string]string{}

	if year > 0 {
		options["year"] = strconv.Itoa(year)
	}

	results, err := d.getSearchMovies(title, options)
	if err != nil {
		return nil, fmt.Errorf("failed to search movies: %w", err)
	}

	if len(results.Results) == 0 {
		return nil, fmt.Errorf("no movies found for title: %s", title)
	}

	// Take the first result (most relevant)
	movie := results.Results[0]

	movieInfo := &models.Movie{
		Title:         movie.Title,
		OriginalTitle: movie.OriginalTitle,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(movie.ID, 10),
		},
	}

	// Extract year from release date
	if movie.ReleaseDate != "" {
		if date, err := time.Parse("2006-01-02", movie.ReleaseDate); err == nil {
			movieInfo.ReleaseDate = date
		}
	}

	return movieInfo, nil
}

// searchTVShowWithQuery performs a single search query to TMDB
func (d *tmdbProvider) searchTVShowWithQuery(name string, year int) (*models.TVShow, error) {
	options := map[string]string{}

	if year > 0 {
		options["first_air_date_year"] = strconv.Itoa(year)
	}

	results, err := d.getSearchTVShow(name, options)
	if err != nil {
		return nil, fmt.Errorf("failed to search TV shows: %w", err)
	}

	if len(results.Results) == 0 {
		return nil, fmt.Errorf("no TV shows found for name: %s", name)
	}

	// Take the first result (most relevant)
	show := results.Results[0]

	showInfo := &models.TVShow{
		Name:         show.Name,
		OriginalName: show.OriginalName,
		ExternalIDs: models.ExternalIDs{
			TMDBID: strconv.FormatInt(show.ID, 10),
		},
	}

	// Extract year from first air date
	if show.FirstAirDate != "" {
		if date, err := time.Parse("2006-01-02", show.FirstAirDate); err == nil {
			showInfo.FirstAirDate = date
		}
	}

	return showInfo, nil
}

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

// getSearchMovies performs a rate-limited movie search
func (d *tmdbProvider) getSearchMovies(title string, options map[string]string) (*tmdb.SearchMovies, error) {
	d.rateLimiter.Wait()
	return d.client.GetSearchMovies(title, options)
}

// getSearchTVShow performs a rate-limited TV show search
func (d *tmdbProvider) getSearchTVShow(name string, options map[string]string) (*tmdb.SearchTVShows, error) {
	d.rateLimiter.Wait()
	return d.client.GetSearchTVShow(name, options)
}

// getTVEpisodeDetails performs a rate-limited episode details lookup
func (d *tmdbProvider) getTVEpisodeDetails(tvShowID, seasonNumber, episodeNumber int, options map[string]string) (*tmdb.TVEpisodeDetails, error) {
	d.rateLimiter.Wait()
	return d.client.GetTVEpisodeDetails(tvShowID, seasonNumber, episodeNumber, options)
}
