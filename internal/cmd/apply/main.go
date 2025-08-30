package apply

import (
	"fmt"
	"strings"

	"goru/internal/cmd/common"
	"goru/internal/cmd/plan"
	"goru/internal/services/files"
	"goru/internal/services/plans"
	"goru/internal/services/states"
	"goru/pkg/log"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"go.uber.org/zap"
)

func Run(cmd *cobra.Command, args []string) {
	log.Debug("goru is starting", zap.String("command", "apply"))

	// Create file service
	fileService := files.NewFileService("", "", viper.GetStringSlice("filters"))

	// Run plan before applying changes
	// TOFIX : I need to return plan
	plan.Run(cmd, args)
	var plan plans.Plan

	if !viper.GetBool("auto-approve") {
		fmt.Println()
		fmt.Println()
		fmt.Println("Do you want to perform these actions?")
		fmt.Println("Goru will perform the actions described above.")
		fmt.Println("Only 'yes' will be accepted to approve.")
		fmt.Println()

		fmt.Print("Enter a value: ")
		var response string
		fmt.Scanln(&response)
		if strings.ToLower(response) != "yes" {
			fmt.Println("Operation cancelled.")
			return
		}
	}

	// Initialize state service for tracking renames
	stateService, err := states.NewStateService()
	if err != nil {
		log.Error("failed to initialize state service", zap.Error(err))
		return
	}

	fmt.Println("\nApplying renames...")
	for _, change := range plan.Changes {
		if change.Action == plans.ActionRename && !change.IsConflicting() {
			oldPath := change.Before.Path
			newPath := change.After.Path

			err := fileService.RenameFile(oldPath, newPath)
			if err != nil {
				fmt.Print("  ")
				common.Red.Print("✗ ")
				fmt.Printf("Failed to rename %s: %v\n", change.Before.Filename, err)
			} else {
				fmt.Print("  ")
				common.Green.Print("✓ ")
				fmt.Printf("Renamed: %s", newPath)
				fmt.Println()

				// Add to state
				if err := stateService.AddRenameOperation(
					oldPath,
					newPath,
					change.Before.Filename,
					change.After.Filename,
					nil, // TODO: MediaInfo needs to be handled differently in new structure
				); err != nil {
					log.Error("failed to add rename to state", zap.Error(err))
					common.Yellow.Printf("    Warning: Failed to track rename in state\n")
				}

			}
		}
	}

}
