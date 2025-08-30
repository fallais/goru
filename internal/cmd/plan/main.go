package plan

import (
	"fmt"

	"goru/internal/cmd/common"
	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/internal/services/plans"
	"goru/internal/services/providers"
	"goru/internal/services/providers/tmdb"
	"goru/pkg/log"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

func Run(cmd *cobra.Command, args []string) {
	log.Info("goru is starting", zap.String("command", "plan"))

	// Unmarshal configuration
	var config models.Config
	if err := viper.Unmarshal(&config); err != nil {
		log.Fatal("failed to unmarshal config", zap.Error(err))
	}
	if err := config.Validate(); err != nil {
		log.Fatal("invalid config", zap.Error(err))
	}

	// Create file service
	fileService := files.NewFileService("", "", viper.GetStringSlice("filters"))

	// Create the formatter service
	formatterService := formatters.NewFormatterService("", "")

	// Determine directories to scan (whether user is giving a single dir or multiple dirs with config file)
	var directories []models.Directory
	if viper.GetString("dir") != "" {
		directories = append(directories, models.Directory{
			Name:      "root",
			Path:      viper.GetString("dir"),
			Type:      viper.GetString("type"),
			Provider:  viper.GetString("provider"),
			Recursive: viper.GetBool("recursive"),
		})
	} else {
		directories = config.Directories
	}

	// Scan each directory for video files
	var videoFiles []*models.VideoFile
	for _, dir := range directories {
		if string(dir.ConflictStrategy) == "" {
			dir.ConflictStrategy = models.DefaultConflictStrategy
		}

		fmt.Printf("Scanning directory: %s\n", dir.Path)
		fmt.Printf("Conflict resolution strategy: %s\n", dir.ConflictStrategy)
		currentFiles, err := fileService.ScanDirectory(dir.Path, dir.Recursive, dir.Type)
		if err != nil {
			log.Fatal("failed to scan directory", zap.Error(err))
		}

		if len(currentFiles) == 0 {
			color.Yellow("No video files found in the specified directory.")
			continue
		}

		// Initialize provider
		var provider providers.Provider
		switch viper.GetString("provider") {
		case "tmdb":
			tmdbProvider, err := tmdb.New(viper.GetString("providers.tmdb.api_key"))
			if err != nil {
				log.Fatal("failed to initialize TMDB service", zap.Error(err))
			}

			provider = tmdbProvider
		case "tvdb":
			log.Fatal("tvdb not implemented yet")
		default:
			log.Fatal("unsupported database type", zap.String("provider", viper.GetString("provider")))
		}

		for _, file := range currentFiles {
			// Set the conflict strategy
			file.ConflictStrategy = models.ConflictStrategy(dir.ConflictStrategy)

			// Provider filename with metadata
			err := provider.Provide(file)
			if err != nil {
				log.Error("failed to provide metadata", zap.Error(err))
			}
		}

		videoFiles = append(videoFiles, currentFiles...)
	}

	if len(videoFiles) == 0 {
		return
	}

	fmt.Printf("Found %d video file(s)\n\n", len(videoFiles))

	// Create the plan
	plan, err := plans.NewPlan(videoFiles, formatterService)
	if err != nil {
		log.Fatal("failed to create plan", zap.Error(err))
	}

	// Resolve conflicts
	// TODO: fix with new strategy !!!!!!!!!!!!!!!
	if len(plan.Conflicts) > 0 {
		log.Debug("conflicts detected", zap.Int("nb_conflicts", len(plan.Conflicts)))
		err := plan.ResolveConflicts(models.ConflictStrategyAppendNumber)
		if err != nil {
			log.Fatal("failed to resolve conflicts", zap.Error(err))
		}
	}

	// Display results
	common.DisplayPlanResults(plan)
}
