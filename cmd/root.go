package cmd

import (
	"goru/pkg/log"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "goru",
	Short: "A tool that helps you rename your video files",
	Long: `Goru is a CLI application that helps you rename video files by fetching
information from TheMovieDB, TheTVDB, and other databases.

It can rename large amounts of video files automatically by matching them
with movie or TV show information.`,
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)

	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.goru.yaml)")
	rootCmd.PersistentFlags().String("dir", "d", "Directory to scan for video files")
	rootCmd.PersistentFlags().BoolP("recursive", "r", false, "Scan directories recursively")
	rootCmd.PersistentFlags().StringP("type", "t", "auto", "Media type: movie, tv, or auto")
	rootCmd.PersistentFlags().String("provider", "tmdb", "Database provider: tmdb, tvdb or anidb")
	rootCmd.PersistentFlags().String("conflict", "append", "Conflict resolution strategy: skip, append, timestamp, prompt, overwrite, backup")
	rootCmd.PersistentFlags().Bool("subtitles", false, "Enable subtitles download")
	rootCmd.PersistentFlags().Int("parallelism", 10, "Maximum number of concurrent file processing operations")

	rootCmd.PersistentFlags().Bool("debug", false, "Enable debug mode")

	// Bind flags to viper
	viper.BindPFlag("type", rootCmd.PersistentFlags().Lookup("type"))
	viper.BindPFlag("provider", rootCmd.PersistentFlags().Lookup("provider"))
	viper.BindPFlag("conflict", rootCmd.PersistentFlags().Lookup("conflict"))
	viper.BindPFlag("subtitles", rootCmd.PersistentFlags().Lookup("subtitles"))
	viper.BindPFlag("parallelism", rootCmd.PersistentFlags().Lookup("parallelism"))
	viper.BindPFlag("debug", rootCmd.PersistentFlags().Lookup("debug"))

	// Env
	viper.BindEnv("tmdb.api_key", "TMDB_API_KEY")

	// Defaults
	viper.SetDefault("debug", false)
	viper.SetDefault("conflict", "append")
	viper.SetDefault("type", "auto")
	viper.SetDefault("provider", "tmdb")
	viper.SetDefault("parallelism", 10)
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		// Search config in home directory with name ".goru" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigType("yaml")
		viper.SetConfigName(".goru")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	viper.ReadInConfig()

	log.Init(viper.GetBool("debug"))
}
