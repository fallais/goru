package formatters

// Common template formats for different naming conventions
const (
	// TV Show templates
	TVShowTemplateDefault = PlexFormatTVShow

	// Movie templates
	MovieTemplateDefault = PlexFormatMovie

	// PlexFormatTVShow is : ShowName - S01E01 - First Episode
	PlexFormatTVShow = "{{.Name}} - S{{printf \"%02d\" .Season}}E{{printf \"%02d\" .Episode}} - {{.Title}}"

	// PlexFormatMovie is : MovieName (2001)
	PlexFormatMovie = "{{.Name}} ({{.Year}})"

	// KodiFormatTVShow is : ShowName (2001) - 1x01 - First Episode
	KodiFormatTVShow = "{{.Name}} ({{.Year}}) - {{.Title}} {{.Season}}x{{.Episode}})"

	// EmbyFormatTVShow is : ShowName (2001) - S01E01 - First Episode
	EmbyFormatTVShow = "{{.Name}} ({{.Year}}) - S{{printf \"%02d\" .Season}}E{{printf \"%02d\" .Episode}} - {{.Title}}"
)
