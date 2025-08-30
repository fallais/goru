package cmd

import (
	"goru/internal/cmd/server"

	"github.com/spf13/cobra"
)

var (
	serverPort string
	serverHost string
)

// serverCmd represents the server command
var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the web server for the goru application",
	Long: `Start a web server that provides a user interface for goru operations.

The web server provides:
- A file browser for selecting directories to scan
- Interface to search for media information using TMDB
- Visual display of rename plans before applying changes
- Real-time feedback during rename operations

Examples:
  # Start server on default port (8080)
  goru server
  
  # Start server on specific port
  goru server --port 3000
  
  # Start server on specific host and port
  goru server --host 0.0.0.0 --port 8080`,
	Run: server.Run,
}

func init() {
	rootCmd.AddCommand(serverCmd)
	serverCmd.Flags().StringVarP(&serverPort, "port", "p", "8080", "Port to run the server on")
	serverCmd.Flags().StringVarP(&serverHost, "host", "H", "localhost", "Host to bind the server to")
}
