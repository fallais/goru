package server

import (
	"fmt"
	"net/http"

	"goru/internal/cmd/server/handlers"
	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/internal/services/providers/tmdb"
	"goru/pkg/log"

	ghandlers "github.com/gorilla/handlers"
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
	planHandler := handlers.NewPlanHandler(fileService, formatterService)
	healthHandler := handlers.NewHealthHandler()
	movieHandler := handlers.NewMovieHandler(tmdbProvider)
	tvShowHandler := handlers.NewTVShowHandler(tmdbProvider)

	stateHandler, err := handlers.NewStateHandler()
	if err != nil {
		log.Fatal("failed to create state handler", zap.Error(err))
	}

	// Setup routes
	router := mux.NewRouter()

	// API routes
	api := router.PathPrefix("/api").Subrouter()
	api.HandleFunc("/directory", handlers.Directory).Methods("GET")
	api.HandleFunc("/directory/default", handlers.DefaultDirectory).Methods("GET")

	// Plan routes
	api.HandleFunc("/plan/create", planHandler.Create).Methods("GET")
	api.HandleFunc("/plan/apply", planHandler.Apply).Methods("POST")

	// Movie routes
	api.HandleFunc("/movies", movieHandler.Search).Methods("GET")
	api.HandleFunc("/movies/{id}", movieHandler.Get).Methods("GET")

	// Episode routes
	api.HandleFunc("/tvshows", tvShowHandler.Search).Methods("GET")
	api.HandleFunc("/tvshows/{id}", tvShowHandler.Get).Methods("GET")
	api.HandleFunc("/tvshows/{id}/episodes", tvShowHandler.ListEpisodes).Methods("GET")

	// State routes
	api.HandleFunc("/state", stateHandler.State).Methods("GET")
	api.HandleFunc("/state/revert", stateHandler.Revert).Methods("POST")

	api.HandleFunc("/health", healthHandler.Health).Methods("GET")

	// Allowed origins (your frontend)
	allowedOrigins := ghandlers.AllowedOrigins([]string{"http://localhost:3000"})
	allowedMethods := ghandlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	allowedHeaders := ghandlers.AllowedHeaders([]string{"Content-Type", "Authorization"})

	// Start server
	address := fmt.Sprintf("%s:%s", viper.GetString("host"), viper.GetString("port"))
	log.Info("Server starting", zap.String("address", address))
	log.Info("Open your browser to", zap.String("url", fmt.Sprintf("http://%s", address)))

	if err := http.ListenAndServe(address, ghandlers.CORS(allowedOrigins, allowedMethods, allowedHeaders)(router)); err != nil {
		log.Fatal("Server failed to start", zap.Error(err))
	}
}
