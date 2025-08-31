package common

import (
	"context"
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
	"sync"

	"github.com/fatih/color"
	"github.com/spf13/viper"
	"go.uber.org/zap"
	"golang.org/x/sync/semaphore"
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
			Format:    viper.GetString("format"),
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
		}

		// Process files concurrently
		processedFiles, processedSubtitles, err := processFilesConcurrently(currentFiles, provider, subtitleProvider, viper.GetInt("parallelism"))
		if err != nil {
			log.Error("failed to process files concurrently", zap.Error(err))
		}

		videoFiles = append(videoFiles, processedFiles...)
		subtitleFiles = append(subtitleFiles, processedSubtitles...)
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

// FileProcessResult holds the result of processing a single file
type FileProcessResult struct {
	File     *models.VideoFile
	Subtitle string
	Error    error
}

func processFilesConcurrently(files []*models.VideoFile, provider providers.Provider, subtitleProvider subtitles.SubtitleProvider, maxConcurrent int) ([]*models.VideoFile, []string, error) {
	if len(files) == 0 {
		return nil, nil, nil
	}

	sem := semaphore.NewWeighted(int64(maxConcurrent))
	results := make(chan FileProcessResult, len(files))
	var wg sync.WaitGroup

	for _, f := range files {
		// Acquire semaphore to limit concurrency
		if err := sem.Acquire(context.Background(), 1); err != nil {
			continue
		}

		wg.Add(1)
		go func(f *models.VideoFile) {
			defer wg.Done()

			result := FileProcessResult{File: f}

			// Process file synchronously
			log.Debug("providing metadata", zap.String("file", f.Filename))
			if err := provider.Provide(f); err != nil {
				result.Error = err
			}

			log.Debug("checking for subtitles", zap.String("file", f.Filename))
			if viper.GetBool("subtitles") {
				sub, err := subtitleProvider.Get(f, viper.GetString("subtitles.language"))
				if err == nil {
					result.Subtitle = sub
				}
			}

			results <- result
			sem.Release(1)
		}(f)
	}

	// Close results after all goroutines finish
	go func() {
		wg.Wait()
		close(results)
	}()

	// Collect results
	var processedFiles []*models.VideoFile
	var subtitleFiles []string
	var hasErrors bool

	for result := range results {
		processedFiles = append(processedFiles, result.File)
		if result.Subtitle != "" {
			subtitleFiles = append(subtitleFiles, result.Subtitle)
		}
		if result.Error != nil {
			hasErrors = true
		}
	}

	var err error
	if hasErrors {
		err = fmt.Errorf("some files failed to process (check logs for details)")
	}

	return processedFiles, subtitleFiles, err
}
