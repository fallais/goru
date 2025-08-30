package formatters

import (
	"testing"
)

func TestSanitizeFilename(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "normal filename",
			input:    "normal_filename.txt",
			expected: "normal_filename.txt",
		},
		{
			name:     "filename with colon",
			input:    "file:with:colons.txt",
			expected: "file -with -colons.txt",
		},
		{
			name:     "filename with asterisk",
			input:    "file*with*asterisk.txt",
			expected: "filewithasterisk.txt",
		},
		{
			name:     "filename with question mark",
			input:    "file?with?question.txt",
			expected: "filewithquestion.txt",
		},
		{
			name:     "filename with double quotes",
			input:    "file\"with\"quotes.txt",
			expected: "file'with'quotes.txt",
		},
		{
			name:     "filename with angle brackets",
			input:    "file<with>brackets.txt",
			expected: "filewithbrackets.txt",
		},
		{
			name:     "filename with pipe",
			input:    "file|with|pipe.txt",
			expected: "filewithpipe.txt",
		},
		{
			name:     "filename with forward slash",
			input:    "file/with/slash.txt",
			expected: "filewithslash.txt",
		},
		{
			name:     "filename with backslash",
			input:    "file\\with\\backslash.txt",
			expected: "filewithbackslash.txt",
		},
		{
			name:     "filename with all invalid characters",
			input:    "file:*?\"<>|/\\invalid.txt",
			expected: "file -'invalid.txt",
		},
		{
			name:     "filename with multiple spaces",
			input:    "file    with    multiple    spaces.txt",
			expected: "file with multiple spaces.txt",
		},
		{
			name:     "filename with leading and trailing spaces",
			input:    "   file with spaces   ",
			expected: "file with spaces",
		},
		{
			name:     "filename with mixed invalid chars and spaces",
			input:    "  file:  with*  invalid?  chars  ",
			expected: "file - with invalid chars",
		},
		{
			name:     "filename with only invalid characters",
			input:    ":*?\"<>|/\\",
			expected: "-'",
		},
		{
			name:     "filename with only spaces",
			input:    "     ",
			expected: "",
		},
		{
			name:     "filename with tabs and newlines mixed with spaces",
			input:    "file\twith\ntabs\rand\nnewlines.txt",
			expected: "file with tabs and newlines.txt",
		},
		{
			name:     "complex real-world example",
			input:    "Meeting Notes: Q4 2023 <Sales Report>.docx",
			expected: "Meeting Notes - Q4 2023 Sales Report.docx",
		},
		{
			name:     "Windows path-like string",
			input:    "C:\\Users\\John\\Documents\\file.txt",
			expected: "C -UsersJohnDocumentsfile.txt",
		},
		{
			name:     "Unix path-like string",
			input:    "/home/user/documents/file.txt",
			expected: "homeuserdocumentsfile.txt",
		},
		{
			name:     "filename with consecutive invalid characters",
			input:    "file:::***???\\\\\\file.txt",
			expected: "file - - -file.txt",
		},
		{
			name:     "single character replacements",
			input:    ":",
			expected: "-",
		},
		{
			name:     "single character removals",
			input:    "*",
			expected: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeFilename(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeFilename(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestSanitizeFilename_EdgeCases(t *testing.T) {
	// Test with very long filename
	t.Run("very long filename", func(t *testing.T) {
		longInput := "a" + string(make([]byte, 1000)) + "very_long_filename_with_lots_of_characters_to_test_edge_cases.txt"
		result := sanitizeFilename(longInput)
		// Should not panic and should return a valid string
		if len(result) == 0 {
			t.Error("Expected non-empty result for long filename")
		}
	})

	// Test with unicode characters
	t.Run("unicode characters", func(t *testing.T) {
		input := "file_with_émojis_🎉_and_ñoñó.txt"
		result := sanitizeFilename(input)
		expected := "file_with_émojis_🎉_and_ñoñó.txt"
		if result != expected {
			t.Errorf("sanitizeFilename(%q) = %q, want %q", input, result, expected)
		}
	})

	// Test with only whitespace characters
	t.Run("only whitespace", func(t *testing.T) {
		input := " \t\n\r "
		result := sanitizeFilename(input)
		expected := ""
		if result != expected {
			t.Errorf("sanitizeFilename(%q) = %q, want %q", input, result, expected)
		}
	})
}

func BenchmarkSanitizeFilename(b *testing.B) {
	testCases := []string{
		"normal_filename.txt",
		"file:*?\"<>|/\\with_all_invalid_chars.txt",
		"   file   with   lots   of   spaces   ",
		"Meeting Notes: Q4 2023 <Sales Report>.docx",
	}

	for _, tc := range testCases {
		b.Run("input_"+tc, func(b *testing.B) {
			for i := 0; i < b.N; i++ {
				sanitizeFilename(tc)
			}
		})
	}
}
