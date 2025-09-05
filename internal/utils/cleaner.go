package utils

import (
	"goru/internal/models"
	"path/filepath"
	"regexp"
	"strings"
)

func CleanFilename(filename string, mediaType models.MediaType) string {
	// Remove extension
	filename = strings.TrimSuffix(filename, filepath.Ext(filename))

	// Lowercase
	filename = strings.ToLower(filename)

	switch mediaType {
	case models.MediaTypeMovie:
		return cleanTitleMovie(filename)
	case models.MediaTypeTVShow:
		return cleanTitleTVShow(filename)
	}

	return ""
}

func cleanTitleTVShow(filename string) string {
	// Try to find season/episode pattern first
	reSeasonEp := regexp.MustCompile(`(?i)(s\d{1,2}e\d{1,2}|\d{1,2}x\d{1,3})`)
	loc := reSeasonEp.FindStringIndex(filename)
	if loc != nil {
		// Keep only the part before the season/episode pattern
		name := filename[:loc[0]]
		// Normalize separators
		name = strings.NewReplacer(".", " ", "_", " ", "-", " ").Replace(name)
		// Cleanup
		words := strings.Fields(name)
		return strings.Join(words, " ")
	}

	// Fallback deep search cleaning

	// Remove " copy" suffix from duplicated files
	filename = regexp.MustCompile(`\s*copy(\s*\(\d+\))?$`).ReplaceAllString(filename, "")

	// Remove episode info
	filename = regexp.MustCompile(`\bs\d{1,2}e\d{1,2}\b`).ReplaceAllString(filename, " ")
	filename = regexp.MustCompile(`\b\d{1,2}x\d{1,3}\b`).ReplaceAllString(filename, " ")

	// Remove resolution
	filename = regexp.MustCompile(`\b\d{3,4}p\b`).ReplaceAllString(filename, " ")

	// Remove codecs
	filename = regexp.MustCompile(`\b(x|h)\d{3}\b`).ReplaceAllString(filename, " ")

	// Remove audio
	filename = regexp.MustCompile(`\bddp?\d?(\.\d)?\b`).ReplaceAllString(filename, " ")
	filename = regexp.MustCompile(`\bdts\b|\bac3\b|\baac\b|\bmp3\b|\bflac\b`).ReplaceAllString(filename, " ")

	// Remove provider acronyms
	filename = regexp.MustCompile(`\b[a-z]{2,5}\b`).ReplaceAllString(filename, " ")

	// Remove extra release tags
	extraTags := []string{
		"final", "proper", "repack", "internal", "limited", "festival",
		"extended", "unrated", "remastered", "criterion",
	}
	for _, tag := range extraTags {
		filename = strings.ReplaceAll(filename, tag, " ")
	}

	// Remove release group suffix like "-IMMERSE"
	filename = regexp.MustCompile(`[-._][a-z0-9]{2,}$`).ReplaceAllString(filename, " ")

	// Normalize separators
	filename = strings.NewReplacer(".", " ", "_", " ", "-", " ").Replace(filename)

	// Remove brackets
	filename = regexp.MustCompile(`\[.*?\]|\(.*?\)|\{.*?\}`).ReplaceAllString(filename, " ")

	// Cleanup
	words := strings.Fields(filename)
	return strings.Join(words, " ")
}

func cleanTitleMovie(filename string) string {
	// Remove year (usually 1900-2099)
	filename = regexp.MustCompile(`\b(19|20)\d{2}\b`).ReplaceAllString(filename, " ")

	// Remove resolution
	filename = regexp.MustCompile(`\b\d{3,4}p\b`).ReplaceAllString(filename, " ")

	// Remove codecs
	filename = regexp.MustCompile(`\b(x|h)\d{3}\b`).ReplaceAllString(filename, " ")

	// Remove audio formats
	filename = regexp.MustCompile(`\bddp?\d?(\.\d)?\b`).ReplaceAllString(filename, " ")
	filename = regexp.MustCompile(`\bdts\b|\bac3\b|\baac\b|\bmp3\b|\bflac\b`).ReplaceAllString(filename, " ")

	// Remove extra release tags
	extraTags := []string{
		"final", "proper", "repack", "internal", "limited", "festival",
		"extended", "unrated", "remastered", "criterion",
	}
	for _, tag := range extraTags {
		filename = strings.ReplaceAll(filename, tag, " ")
	}

	// Remove release group suffix like "-IMMERSE"
	filename = regexp.MustCompile(`[-._][a-z0-9]{2,}$`).ReplaceAllString(filename, " ")

	// Normalize separators
	filename = strings.NewReplacer(".", " ", "_", " ", "-", " ").Replace(filename)

	// Remove brackets
	filename = regexp.MustCompile(`\[.*?\]|\(.*?\)|\{.*?\}`).ReplaceAllString(filename, " ")

	// Remove extra whitespace
	words := strings.Fields(filename)
	return strings.Join(words, " ")
}
