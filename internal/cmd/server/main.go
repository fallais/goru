package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/internal/services/plans"
	"goru/internal/services/providers"
	"goru/internal/services/providers/tmdb"
	"goru/pkg/log"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

// Server holds the server dependencies
type Server struct {
	fileService      *files.FileService
	formatterService *formatters.FormatterService
	config           models.Config
}

// Response structures
type DirectoryResponse struct {
	Files []FileInfo `json:"files"`
	Path  string     `json:"path"`
}

type FileInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	IsDir   bool   `json:"isDir"`
	Size    int64  `json:"size"`
	ModTime string `json:"modTime"`
}

type LookupRequest struct {
	Directory string `json:"directory"`
	Type      string `json:"type"`     // "movie", "tv", "auto"
	Provider  string `json:"provider"` // "tmdb", "tvdb", "anidb"
	Recursive bool   `json:"recursive"`
}

type LookupResponse struct {
	Plan   *plans.Plan `json:"plan"`
	Status string      `json:"status"`
	Error  string      `json:"error,omitempty"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func Run(cmd *cobra.Command, args []string) {
	log.Info("goru is starting", zap.String("command", "server"))

	// Unmarshal configuration
	var config models.Config
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatal("failed to unmarshal config", zap.Error(err))
	}
	if err := config.Validate(); err != nil {
		log.Fatal("invalid config", zap.Error(err))
	}

	// Create services
	fileService := files.NewFileService("", "", viper.GetStringSlice("filters"))
	formatterService := formatters.NewFormatterService("", "")

	server := &Server{
		fileService:      fileService,
		formatterService: formatterService,
		config:           config,
	}

	// Get server configuration from flags
	port, _ := cmd.Flags().GetString("port")
	host, _ := cmd.Flags().GetString("host")

	// Setup routes
	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()
	api.HandleFunc("/directory", server.handleDirectory).Methods("GET")
	api.HandleFunc("/lookup", server.handleLookup).Methods("POST")
	api.HandleFunc("/health", server.handleHealth).Methods("GET")

	// Serve static files from web directory
	webDir := filepath.Join(".", "web", "build")
	if _, err := os.Stat(webDir); os.IsNotExist(err) {
		log.Warn("Web build directory not found, serving from development location", zap.String("dir", webDir))
		webDir = filepath.Join(".", "web", "public")
	}

	// Static file server
	router.PathPrefix("/").Handler(http.FileServer(http.Dir(webDir)))

	// Start server
	address := fmt.Sprintf("%s:%s", host, port)
	log.Info("Server starting", zap.String("address", address))
	log.Info("Open your browser to", zap.String("url", fmt.Sprintf("http://%s", address)))

	if err := http.ListenAndServe(address, router); err != nil {
		log.Fatal("Server failed to start", zap.Error(err))
	}
}

// handleDirectory handles directory listing requests
func (s *Server) handleDirectory(w http.ResponseWriter, r *http.Request) {
	directory := r.URL.Query().Get("path")
	if directory == "" {
		s.writeError(w, "directory path is required", http.StatusBadRequest)
		return
	}

	// Check if directory exists
	if _, err := os.Stat(directory); os.IsNotExist(err) {
		s.writeError(w, "directory does not exist", http.StatusNotFound)
		return
	}

	// Read directory contents
	entries, err := os.ReadDir(directory)
	if err != nil {
		s.writeError(w, fmt.Sprintf("failed to read directory: %v", err), http.StatusInternalServerError)
		return
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		files = append(files, FileInfo{
			Name:    entry.Name(),
			Path:    filepath.Join(directory, entry.Name()),
			IsDir:   entry.IsDir(),
			Size:    info.Size(),
			ModTime: info.ModTime().Format("2006-01-02 15:04:05"),
		})
	}

	response := DirectoryResponse{
		Files: files,
		Path:  directory,
	}

	s.writeJSON(w, response)
}

// handleLookup handles media lookup requests
func (s *Server) handleLookup(w http.ResponseWriter, r *http.Request) {
	var req LookupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.writeError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.Directory == "" {
		s.writeError(w, "directory is required", http.StatusBadRequest)
		return
	}

	if req.Type == "" {
		req.Type = "auto"
	}
	if req.Provider == "" {
		req.Provider = "tmdb"
	}

	// Create directory configuration
	directory := models.Directory{
		Name:      "web-request",
		Path:      req.Directory,
		Type:      req.Type,
		Provider:  req.Provider,
		Recursive: req.Recursive,
	}

	// Process the directory similar to how the CLI does it
	plan, err := s.processDirectory(directory)
	if err != nil {
		s.writeError(w, fmt.Sprintf("failed to process directory: %v", err), http.StatusInternalServerError)
		return
	}

	response := LookupResponse{
		Plan:   plan,
		Status: "success",
	}

	s.writeJSON(w, response)
}

// handleHealth handles health check requests
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	health := map[string]string{
		"status":  "ok",
		"service": "goru-server",
	}
	s.writeJSON(w, health)
}

// processDirectory processes a directory and returns a plan (similar to CLI plan command)
func (s *Server) processDirectory(directory models.Directory) (*plans.Plan, error) {
	log.Debug("Processing directory", zap.String("path", directory.Path), zap.String("type", directory.Type))

	// Get video files from directory
	videoFiles, err := s.fileService.ScanDirectory(directory.Path, directory.Recursive, directory.Type)
	if err != nil {
		return nil, fmt.Errorf("failed to scan directory: %w", err)
	}

	if len(videoFiles) == 0 {
		log.Debug("No video files found in directory", zap.String("directory", directory.Path))
		// Return an empty plan instead of an error
		return &plans.Plan{
			Changes: []plans.Change{},
			Errors:  []plans.Error{},
		}, nil
	}

	// Create provider
	var provider providers.Provider
	switch strings.ToLower(directory.Provider) {
	case "tmdb":
		provider, err = tmdb.New(viper.GetString("providers.tmdb.api_key"))
		if err != nil {
			return nil, fmt.Errorf("failed to initialize TMDB provider: %w", err)
		}
	default:
		return nil, fmt.Errorf("unsupported provider: %s", directory.Provider)
	}

	// Lookup media information for each file concurrently
	maxConcurrent := viper.GetInt("max_concurrent")
	if maxConcurrent <= 0 {
		maxConcurrent = 10 // fallback to default
	}
	processedFiles, err := processFilesMetadataConcurrently(videoFiles, provider, maxConcurrent)
	if err != nil {
		log.Error("failed to process files concurrently", zap.Error(err))
	}

	// Create the plan
	plan, err := plans.NewPlan(processedFiles, nil, s.formatterService)
	if err != nil {
		return nil, fmt.Errorf("failed to create plan: %w", err)
	}

	return plan, nil
}

// writeJSON writes a JSON response
func (s *Server) writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Error("failed to encode JSON response", zap.Error(err))
	}
}

// writeError writes an error response
func (s *Server) writeError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(statusCode)

	response := ErrorResponse{Error: message}
	json.NewEncoder(w).Encode(response)
}

// processFilesMetadataConcurrently processes video files metadata concurrently with a limited number of workers
func processFilesMetadataConcurrently(files []*models.VideoFile, provider providers.Provider, maxConcurrent int) ([]*models.VideoFile, error) {
	if len(files) == 0 {
		return files, nil
	}

	// Set conflict strategy for all files (use default if not specified)
	for _, file := range files {
		if file.ConflictStrategy == "" {
			file.ConflictStrategy = models.DefaultConflictStrategy
		}
	}

	// Create semaphore to limit concurrent operations
	semaphore := make(chan struct{}, maxConcurrent)
	var wg sync.WaitGroup
	var hasErrors bool
	var mu sync.Mutex

	// Process each file concurrently
	for _, file := range files {
		wg.Add(1)
		go func(f *models.VideoFile) {
			defer wg.Done()

			// Acquire semaphore
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// Provide metadata for the file
			err := provider.Provide(f)
			if err != nil {
				log.Error("failed to provide metadata", zap.Error(err), zap.String("file", f.Path))
				mu.Lock()
				hasErrors = true
				mu.Unlock()
			}
		}(file)
	}

	// Wait for all goroutines to complete
	wg.Wait()

	var err error
	if hasErrors {
		err = fmt.Errorf("some files failed to process metadata (check logs for details)")
	}

	return files, err
}
