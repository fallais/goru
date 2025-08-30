package common

import (
	"errors"
	"fmt"
	"goru/internal/models"
	"goru/internal/services/files"
	"goru/internal/services/formatters"
	"goru/internal/services/plans"
	"goru/internal/services/providers"
	"goru/internal/services/providers/tmdb"
	"goru/internal/services/subtitles"
	"goru/pkg/log"

	"github.com/fatih/color"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

var (
	Green  = color.New(color.FgGreen, color.Bold)
	Red    = color.New(color.FgRed, color.Bold)
	Yellow = color.New(color.FgYellow)
	Blue   = color.New(color.FgBlue)
	Cyan   = color.New(color.FgCyan)
	Gray   = color.New(color.FgHiBlack)
)

var ErrNoFilesFound = errors.New("no video files found")

func RunPlan(fileService *files.FileService, formatterService *formatters.FormatterService, config models.Config, subtitleProvider subtitles.SubtitleProvider) (*plans.Plan, error) {
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
	var subtitleFiles []string
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
			log.Debug("providing metadata for file", zap.String("file", file.Filename))
			err := provider.Provide(file)
			if err != nil {
				log.Error("failed to provide metadata", zap.Error(err))
			}

			// Download subtitles for each video file
			if viper.GetBool("subtitles") {
				log.Debug("providing metadata for file", zap.String("file", file.Filename))

				sub, err := subtitleProvider.Get(file, viper.GetString("subtitles.language"))
				if err != nil {
					log.Error("failed to download subtitles", zap.Error(err))
				} else {
					subtitleFiles = append(subtitleFiles, sub)
				}

			}
		}

		videoFiles = append(videoFiles, currentFiles...)
	}

	if len(videoFiles) == 0 {
		return nil, ErrNoFilesFound
	}

	fmt.Printf("Found %d video file(s)\n\n", len(videoFiles))

	// Create the plan
	plan, err := plans.NewPlan(videoFiles, subtitleFiles, formatterService)
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

	return plan, nil
}

// DisplayPlanResults displays the results of a rename plan
func DisplayPlanResults(plan *plans.Plan) {
	alreadyCorrectCount := 0
	needsRenameCount := 0
	skippedCount := 0

	fmt.Println("Goru will perform the following actions:")
	fmt.Println()

	for _, change := range plan.Changes {
		switch change.Action {
		case plans.ActionRename:
			if change.IsConflicting() {
				// Conflicted change
				needsRenameCount++
				fmt.Printf("%c %s → %s %s\n", change.Action, change.Before.Filename, Yellow.Sprint(change.After.Filename), Red.Sprint("(CONFLICT)"))
			} else {
				// Ready to be renamed
				needsRenameCount++
				Yellow.Printf("%c", change.Action)
				fmt.Printf(" %s → %s\n", change.Before.Filename, Yellow.Sprint(change.After.Filename))
			}

		case plans.ActionNoop:
			// File is already correctly named
			alreadyCorrectCount++
			Green.Printf("%c", change.Action)
			fmt.Printf("%s\n", Green.Sprint(change.Before.Filename))

		case plans.ActionSkip:
			skippedCount++
			Blue.Printf("%c", change.Action)
			fmt.Printf(" %s: %s\n", change.Before.Filename, Blue.Sprint("skipped"))
		}
	}

	for _, e := range plan.Errors {
		Red.Printf("%c", plans.ActionSkip)
		fmt.Printf(" %s: %s (%s)\n", e.File, Red.Sprint("ERROR"), e.Message)
	}

	// Summary
	printPlanSummary(plan, alreadyCorrectCount, needsRenameCount, len(plan.Errors), skippedCount)
}

// printPlanSummary prints a summary of the plan results
func printPlanSummary(plan *plans.Plan, alreadyCorrectCount, needsRenameCount, errorCount, skippedCount int) {
	fmt.Println()
	fmt.Println(color.HiBlackString("─────────────────────────────────────────────────────────────"))
	fmt.Printf("Plan Summary: ")
	Green.Printf("%d correct", alreadyCorrectCount)
	fmt.Print(", ")
	Yellow.Printf("%d to rename", needsRenameCount)
	fmt.Print(", ")
	if skippedCount > 0 {
		Blue.Printf("%d skipped", skippedCount)
		fmt.Print(", ")
	}
	if errorCount > 0 {
		Red.Printf("%d errors", errorCount)
	} else {
		fmt.Print("0 errors")
	}
	fmt.Printf(", %d total\n", len(plan.Changes))

	if len(plan.Conflicts) > 0 {
		fmt.Printf("Conflicts: %d total, %d resolved\n", len(plan.Conflicts), plan.Summary().ResolvedConflicts)
	}

	if needsRenameCount > 0 {
		fmt.Println()
		Yellow.Println("To apply these changes, run: goru apply")
	}
}
