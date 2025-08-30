package cmd

import (
	"github.com/spf13/cobra"
)

// stateCmd represents the state command
var stateCmd = &cobra.Command{
	Use:   "state",
	Short: "Manage rename operation state",
	Long: `Manage the state of rename operations performed by Goru.

The state command allows you to:
- List previous rename operations
- Revert specific rename operations
- View the history of changes made to your files

Examples:
  # List all rename operations
  goru state ls
  
  # List only unreversed operations
  goru state ls --active
  
  # Revert the last rename operation
  goru state revert
  
  # Revert a specific rename operation
  goru state revert --id abc123`,
}

func init() {
	rootCmd.AddCommand(stateCmd)
	stateCmd.AddCommand(stateLsCmd)
	stateCmd.AddCommand(stateRevertCmd)
}
