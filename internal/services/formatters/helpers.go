package formatters

import "strings"

// sanitizeFilename removes or replaces characters that are not allowed in filenames
func sanitizeFilename(filename string) string {
	// Replace invalid characters with safe alternatives
	replacements := map[string]string{
		":":  " -",
		"*":  "",
		"?":  "",
		"\"": "'",
		"<":  "",
		">":  "",
		"|":  "",
		"/":  "",
		"\\": "",
	}

	for old, new := range replacements {
		filename = strings.ReplaceAll(filename, old, new)
	}

	// Remove multiple spaces and trim
	filename = strings.Join(strings.Fields(filename), " ")
	return strings.TrimSpace(filename)
}
