package watcher

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"goru/internal/models"
	"goru/internal/services/providers"
	"goru/pkg/log"

	"github.com/spf13/viper"
	"github.com/tidwall/buntdb"
	"go.uber.org/zap"
)

type FileRecord struct {
	Path    string
	ModTime int64
	Renamed bool
}

type Watcher struct {
	db            *buntdb.DB
	fileCache     map[string]FileRecord
	cacheMux      sync.RWMutex
	defaultDir    string
	scanInterval  time.Duration
	flushInterval time.Duration
	providers     []providers.Provider
}

func New(dbFile string, providers []providers.Provider) (*Watcher, error) {
	db, err := buntdb.Open(dbFile)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}
	defer db.Close()

	return &Watcher{
		db:            db,
		fileCache:     make(map[string]FileRecord),
		defaultDir:    viper.GetString("watcher.default_directory"),
		scanInterval:  30 * time.Minute,
		flushInterval: 1 * time.Minute,
		providers:     providers,
	}, nil
}

func (w *Watcher) Start() {
	log.Debug("Starting watcher service", zap.String("default_directory", w.defaultDir))

	w.db.View(func(tx *buntdb.Tx) error {
		tx.Ascend("", func(key, value string) bool {
			var rec FileRecord
			if err := json.Unmarshal([]byte(value), &rec); err == nil {
				w.fileCache[key] = rec
			}
			return true
		})
		return nil
	})

	go func() {
		ticker := time.NewTicker(w.flushInterval)
		defer ticker.Stop()
		for range ticker.C {
			w.flushCache(w.db)
		}
	}()

	ticker := time.NewTicker(w.scanInterval)
	defer ticker.Stop()

	w.scanDir(w.defaultDir, DirConfig{
		Type:     "",
		Provider: "",
		ThisOnly: false,
	})

	for range ticker.C {
		w.scanDir(w.defaultDir, DirConfig{
			Type:     "",
			Provider: "",
			ThisOnly: false,
		})
	}
}

func (w *Watcher) scanDir(root string, parentCfg DirConfig) {
	log.Debug("Scanning directory", zap.String("directory", root))

	filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}

		if d.IsDir() {
			entries, _ := os.ReadDir(path)

			hasIgnore := false
			for _, e := range entries {
				if e.Name() == "ignore.myapp" {
					hasIgnore = true
					break
				}
			}

			if hasIgnore {
				hasKeep := false
				for _, e := range entries {
					if e.Name() == "keep.myapp" {
						hasKeep = true
						break
					}
				}

				if !hasKeep {
					log.Debug("directory ignored", zap.String("path", path))
					return filepath.SkipDir
				}
			}

			cfg := parentCfg
			for _, e := range entries {
				if e.Name() == ".myapp" {
					localCfg := parseMyAppFile(filepath.Join(path, e.Name()))
					if localCfg.Type != "" {
						cfg.Type = localCfg.Type
					}
					if localCfg.Provider != "" {
						cfg.Provider = localCfg.Provider
					}
					if localCfg.ThisOnly {
						parentCfg = DirConfig{}
						cfg = localCfg
					}
				}
			}

			parentCfg = cfg
			return nil
		}

		if strings.HasSuffix(d.Name(), ".mkv") || strings.HasSuffix(d.Name(), ".mp4") {
			log.Debug("video file found", zap.String("path", path), zap.String("type", parentCfg.Type), zap.String("provider", parentCfg.Provider))

			videoFile := models.NewVideoFile(path, models.DefaultConflictStrategy)

			// TODO: override media type if needed

			w.processFile(videoFile)
		}

		return nil
	})
}

func (w *Watcher) processFile(videoFile *models.VideoFile) {
	log.Debug("processing file", zap.String("path", videoFile.Path))

	for _, p := range w.providers {
		err := p.Provide(videoFile)
		if err != nil {
			log.Error("providing metadata failed", zap.String("provider", p.Name()), zap.String("file", videoFile.Path), zap.Error(err))
		} else {
			break
		}
	}

	w.cacheMux.Lock()
	rec := w.fileCache[videoFile.Path]
	rec.Renamed = true
	w.fileCache[videoFile.Path] = rec
	w.cacheMux.Unlock()
}

func (w *Watcher) flushCache(db *buntdb.DB) {
	w.cacheMux.RLock()
	defer w.cacheMux.RUnlock()

	db.Update(func(tx *buntdb.Tx) error {
		for path, rec := range w.fileCache {
			data, _ := json.Marshal(rec)
			tx.Set(path, string(data), nil)
		}
		log.Debug("cache flush complete")
		return nil
	})
}

type DirConfig struct {
	Type     string
	Provider string
	ThisOnly bool
}

func parseMyAppFile(path string) DirConfig {
	cfg := DirConfig{}
	data, err := os.ReadFile(path)
	if err != nil {
		return cfg
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		if strings.TrimSpace(line) == "" {
			continue
		}
		kv := strings.SplitN(line, "=", 2)
		if len(kv) == 2 {
			key, val := strings.TrimSpace(kv[0]), strings.TrimSpace(kv[1])
			switch key {
			case "type":
				cfg.Type = val
			case "provider":
				cfg.Provider = val
			case "this_only":
				cfg.ThisOnly = (val == "true")
			}
		}
	}
	return cfg
}
