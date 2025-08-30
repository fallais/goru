package formatters

// MovieTemplateData represents the data available for movie filename templates
type MovieTemplateData struct {
	Name     string
	Title    string
	Year     int
	Director string
	Genre    string
}

type TVShowTemplateData struct {
	Name    string // TV show name
	Title   string // Episode title
	Year    int    // First air date year
	Season  int    // Season number
	Episode int    // Episode number
}
