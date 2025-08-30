package main

import (
	"fmt"
	"log"
	"os"
)

func main() {
	// Martin Morning
	for i := 1; i <= 52; i++ {
		// Create blank file in data/tvshows
		filePath := fmt.Sprintf("test/data/martin_morning/Martin Morning 1x%d.mkv", i)
		err := os.WriteFile(filePath, []byte(""), 0644)
		if err != nil {
			log.Fatalf("failed to create file: %v", err)
		}
	}
}
