package plan

import (
	"goru/internal/cmd/common"
	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/pkg/log"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

func Run(cmd *cobra.Command, args []string) {
	log.Debug("goru is starting", zap.String("command", "plan"))

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
	plan, err := common.RunPlan(fileService, formatterService, config)
	if err != nil && err != common.ErrNoFilesFound {
		log.Fatal("failed to run plan", zap.Error(err))
	}
	if err == common.ErrNoFilesFound {
		// No video files found, handle accordingly
		color.Yellow("No video files found.")
	}

	// Display results
	common.DisplayPlanResults(plan)
}
