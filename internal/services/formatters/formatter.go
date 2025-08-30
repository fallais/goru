package formatters

import (
	"bytes"
	"fmt"
	"html"
	"text/template"

	"goru/internal/models"
)

type FormatterService struct {
	tvShowTemplate string
	movieTemplate  string
}

func NewFormatterService(tvTemplate, movieTemplate string) *FormatterService {
	fs := &FormatterService{}

	if tvTemplate == "" {
		fs.tvShowTemplate = TVShowTemplateDefault
	}
	if movieTemplate == "" {
		fs.movieTemplate = MovieTemplateDefault
	}

	return fs
}

func (fs *FormatterService) FormatFilename(videoFile *models.VideoFile) (string, error) {
	var templateStr string
	var data any

	switch videoFile.MediaType {
	case models.MediaTypeMovie:
		templateStr = fs.movieTemplate

		movie, ok := videoFile.Metadata.(*models.Movie)
		if !ok || movie == nil {
			return "", fmt.Errorf("metadata is nil or of wrong type")
		}

		data = MovieTemplateData{
			Name:     movie.Title,
			Year:     movie.ReleaseDate.Year(),
			Director: movie.Director,
			Genre:    string(movie.Genre),
		}

	case models.MediaTypeTVShow:
		templateStr = fs.tvShowTemplate

		episode, ok := videoFile.Metadata.(*models.Episode)
		if !ok || episode == nil {
			return "", fmt.Errorf("metadata is nil or of wrong type")
		}

		title := html.UnescapeString(episode.Title)
		showName := html.UnescapeString(episode.TVShow.Name)

		data = TVShowTemplateData{
			Name:    showName,
			Title:   title,
			Year:    episode.AirDate.Year(),
			Season:  episode.Season,
			Episode: episode.Episode,
		}
	}

	tmpl, err := template.New("filename").Option("missingkey=error").Parse(templateStr)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return "", err
	}

	// Append the extension after template processing
	filename := sanitizeFilename(buf.String())

	// Append the extension
	filename += models.SupportedExtensions[videoFile.FileType]

	return filename, nil
}
