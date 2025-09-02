package server

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"goru/internal/cmd/server/handlers"
	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/internal/services/providers/tmdb"
	"goru/pkg/log"

	"github.com/gorilla/mux"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

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

	// Create provider
	tmdbProvider, err := tmdb.New(viper.GetString("providers.tmdb.api_key"))
	if err != nil {
		log.Fatal("failed to create TMDB provider", zap.Error(err))
	}

	// Create handlers
	lookupHandler := handlers.NewLookupHandler(fileService, formatterService)
	healthHandler := handlers.NewHealthHandler()
	movieSearchHandler := handlers.NewMovieSearchHandler(tmdbProvider)
	tvShowSearchHandler := handlers.NewTVShowSearchHandler(tmdbProvider)

	// Setup routes
	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()
	api.HandleFunc("/directory", handlers.Directory).Methods("GET")
	api.HandleFunc("/directory/default", handlers.DefaultDirectory).Methods("GET")
	api.HandleFunc("/lookup", lookupHandler.Lookup).Methods("POST")
	api.HandleFunc("/health", healthHandler.Health).Methods("GET")
	api.HandleFunc("/search/movies", movieSearchHandler.Search).Methods("GET")
	api.HandleFunc("/search/tvshows", tvShowSearchHandler.Search).Methods("GET")

	// Serve static files from web directory
	webDir := filepath.Join(".", "web", "build")
	if _, err := os.Stat(webDir); os.IsNotExist(err) {
		log.Warn("Web build directory not found, serving from development location", zap.String("dir", webDir))
		webDir = filepath.Join(".", "web", "public")
	}

	// Static file server
	router.PathPrefix("/").Handler(http.FileServer(http.Dir(webDir)))

	// Start server
	address := fmt.Sprintf("%s:%s", viper.GetString("host"), viper.GetString("port"))
	log.Info("Server starting", zap.String("address", address))
	log.Info("Open your browser to", zap.String("url", fmt.Sprintf("http://%s", address)))

	if err := http.ListenAndServe(address, router); err != nil {
		log.Fatal("Server failed to start", zap.Error(err))
	}
}
