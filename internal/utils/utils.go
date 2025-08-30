package utils

import (
	"regexp"
	"strconv"
	"strings"

	"goru/internal/models"
)

var patterns = []*regexp.Regexp{
	// S01E02, s01.e02, s01-e02
	regexp.MustCompile(`(?i)s(\d{1,2})[.\s_-]*e(\d{1,2})`),
	// 1x02 style
	regexp.MustCompile(`(?i)(\d{1,2})x(\d{1,2})`),
	// Verbose: Season 1 Episode 2
	regexp.MustCompile(`(?i)season[ ._-]?(\d{1,2}).*episode[ ._-]?(\d{1,2})`),
	// Season only
	regexp.MustCompile(`(?i)s(\d{1,2})(?:[^0-9]|$)`),
	regexp.MustCompile(`(?i)season[ ._-]?(\d{1,2})`),
	// Episode only
	regexp.MustCompile(`(?i)e(\d{1,2})(?:[^0-9]|$)`),
}

func ExtractSeasonEpisode(filename string) (season, episode int) {
	lower := strings.ToLower(filename)

	for _, re := range patterns {
		m := re.FindStringSubmatch(lower)
		if len(m) == 0 {
			continue
		}

		switch len(m) {
		case 3: // season + episode
			season, _ = strconv.Atoi(m[1])
			episode, _ = strconv.Atoi(m[2])
			return season, episode
		case 2: // season-only or episode-only
			num, _ := strconv.Atoi(m[1])
			if strings.Contains(re.String(), "e(") { // episode-only regex
				return 0, num
			}
			return num, 0
		}
	}
	return 0, 0
}

// GuessMediaType tries to guess if a file is a movie or TV show based on filename patterns
func GuessMediaType(filename string) models.MediaType {
	filename = strings.ToLower(filename)

	// Common TV show patterns
	tvPatterns := []string{
		"s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", // Season patterns
		"e0", "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", // Episode patterns
		"episode", "ep", "season",
		"x0", "x1", "x2", "x3", "x4", "x5", "x6", "x7", "x8", "x9", // SxxExx pattern
	}

	for _, pattern := range tvPatterns {
		if strings.Contains(filename, pattern) {
			return models.MediaTypeTVShow
		}
	}

	// Default to movie if no TV patterns found
	return models.MediaTypeMovie
}
