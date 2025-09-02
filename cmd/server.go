package cmd

import (
	"goru/internal/cmd/server"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var serverCmd = &cobra.Command{
	Use:   "server",
	Short: "Start the web server for the goru application",
	Long:  `Start a web server that provides a user interface for goru operations.`,
	Run:   server.Run,
}

func init() {
	rootCmd.AddCommand(serverCmd)
	serverCmd.Flags().String("port", "", "Port to run the server on")
	serverCmd.Flags().String("host", "", "Host to bind the server to")
	serverCmd.Flags().String("directory", "", "Default directory to scan")

	viper.BindPFlag("host", serverCmd.Flags().Lookup("host"))
	viper.BindPFlag("port", serverCmd.Flags().Lookup("port"))
	viper.BindPFlag("directory", serverCmd.Flags().Lookup("directory"))

	viper.SetDefault("host", "localhost")
	viper.SetDefault("port", "8080")
	viper.SetDefault("directory", ".")
}
