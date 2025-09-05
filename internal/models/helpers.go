package models

import (
	"strings"
)

// GuessMediaType tries to guess if a file is a movie or TV show based on filename patterns
func GuessMediaType(filename string) MediaType {
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
			return MediaTypeTVShow
		}
	}

	return MediaTypeMovie
}
