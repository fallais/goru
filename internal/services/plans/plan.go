package plans

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"goru/internal/models"
	"goru/internal/services/formatters"
	"goru/pkg/log"

	"github.com/google/uuid"
	"go.uber.org/zap"
)

var ErrCouldNotExtractSeasonEpisode = errors.New("could not extract season/episode information")

type Error struct {
	Message string `json:"message"`
	File    string `json:"file"`
}

// Plan represents a complete rename plan with all operations and conflicts
type Plan struct {
	// ID of the plan
	ID string `json:"id"`

	// Timestamp of the plan creation
	Timestamp time.Time `json:"timestamp"`

	// Changes represent the proposed changes to be made
	Changes []Change `json:"changes"`

	// Errors contains any errors encountered during the plan
	Errors []Error `json:"errors"`

	// Applyable indicates if the plan can be applied
	Applyable bool

	// Conflicts between changes
	Conflicts []Conflict `json:"conflicts"`
}

// NewPlan creates a new rename plan for the given video files
func NewPlan(videoFiles []*models.VideoFile, formatterService *formatters.FormatterService) (*Plan, error) {
	plan := &Plan{
		ID:        uuid.New().String(),
		Timestamp: time.Now(),
		Changes:   make([]Change, 0, len(videoFiles)),
		Conflicts: make([]Conflict, 0),
	}

	// Create planned changes
	for _, videoFile := range videoFiles {
		change, err := createChange(videoFile, formatterService)
		if err != nil {
			log.Debug("failed to create planned change", zap.Error(err), zap.String("file", videoFile.Path))

			changeError := Error{
				Message: err.Error(),
				File:    videoFile.Path,
			}

			plan.Errors = append(plan.Errors, changeError)
			continue
		}

		plan.Changes = append(plan.Changes, *change)
	}

	// Detect conflicts
	conflicts := detectConflicts(plan.Changes)
	plan.Conflicts = conflicts

	// Update change conflict IDs based on conflicts
	updateChangeConflicts(plan)

	return plan, nil
}

// PlanSummary provides an overview of the plan
type PlanSummary struct {
	TotalChanges      int `json:"total_changes"`
	ReadyChanges      int `json:"ready_changes"`
	ConflictedChanges int `json:"conflicted_changes"`
	SkippedChanges    int `json:"skipped_changes"`
	ErrorChanges      int `json:"error_changes"`
	NoopChanges       int `json:"noop_changes"`
	TotalConflicts    int `json:"total_conflicts"`
	ResolvedConflicts int `json:"resolved_conflicts"`
}

// Summary provides a summary of the plan's changes and conflicts
func (p *Plan) Summary() PlanSummary {
	summary := PlanSummary{
		TotalChanges:   len(p.Changes),
		TotalConflicts: len(p.Conflicts),
		ErrorChanges:   len(p.Errors),
	}

	for _, change := range p.Changes {
		switch change.Action {
		case ActionRename:
			if change.IsConflicting() {
				summary.ConflictedChanges++
			} else {
				summary.ReadyChanges++
			}
		case ActionSkip:
			summary.SkippedChanges++
		case ActionNoop:
			summary.NoopChanges++
		}
	}

	for _, conflict := range p.Conflicts {
		if conflict.Resolved {
			summary.ResolvedConflicts++
		}
	}

	return summary
}

// createChange creates a single planned change
func createChange(videoFile *models.VideoFile, formatterService *formatters.FormatterService) (*Change, error) {
	change := &Change{
		ID:     uuid.New().String(),
		Action: ActionNoop,
		Before: models.VideoFile{
			Path:     videoFile.Path,
			Filename: videoFile.Filename,
		},
	}

	// Format the target name
	targetName, err := formatterService.FormatFilename(videoFile)
	if err != nil {
		return nil, fmt.Errorf("error while formatting filename: %w", err)
	}

	targetPath := filepath.Join(filepath.Dir(videoFile.Path), targetName)

	// Set the After info
	change.After = models.VideoFile{
		Path:     targetPath,
		Filename: targetName,
	}

	// Determine action based on whether file needs to be renamed
	if videoFile.Filename != targetName {
		change.Action = ActionRename
	} else {
		change.Action = ActionNoop
	}

	return change, nil
}

// detectConflicts detects conflicts between planned changes
func detectConflicts(changes []Change) []Conflict {
	conflicts := make([]Conflict, 0)
	targetPaths := make(map[string][]string) // targetPath -> []changeID

	// Group changes by target path
	for _, change := range changes {
		if change.Action == ActionRename {
			targetPaths[change.After.Path] = append(targetPaths[change.After.Path], change.ID)
		}
	}

	// Check for multiple source conflicts
	for targetPath, changeIDs := range targetPaths {
		if len(changeIDs) > 1 {
			conflict := Conflict{
				ID:           uuid.New().String(),
				TargetPath:   targetPath,
				ChangeIDs:    changeIDs,
				ConflictType: ConflictTypeMultipleSource,
				Resolved:     false,
			}
			conflicts = append(conflicts, conflict)
		} else {
			// Check if target already exists on disk
			changeID := changeIDs[0]
			if fileExists(targetPath) {
				conflict := Conflict{
					ID:           uuid.New().String(),
					TargetPath:   targetPath,
					ChangeIDs:    []string{changeID},
					ConflictType: ConflictTypeTargetExists,
					Resolved:     false,
				}
				conflicts = append(conflicts, conflict)
			}
		}
	}

	return conflicts
}

// updateChangeConflicts updates change conflict IDs based on detected conflicts
func updateChangeConflicts(plan *Plan) {
	// Create a map of change ID to conflict IDs
	changeConflicts := make(map[string][]string)

	for _, conflict := range plan.Conflicts {
		for _, changeID := range conflict.ChangeIDs {
			changeConflicts[changeID] = append(changeConflicts[changeID], conflict.ID)
		}
	}

	// Update change conflict IDs
	for i := range plan.Changes {
		change := &plan.Changes[i]
		if conflictIDs, hasConflict := changeConflicts[change.ID]; hasConflict {
			change.ConflictIDs = conflictIDs
		}
	}
}

// fileExists checks if a file exists at the given path
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}

// HasUnresolvedConflict checks if there are any unresolved conflicts in the plan
func (p *Plan) HasUnresolvedConflict() bool {
	return false
}

// RenameResult represents the result of a rename operation
type RenameResult struct {
	VideoFile      models.VideoFile
	Success        bool
	Error          error
	MediaInfo      interface{} // Can be MovieInfo, TVShowInfo, etc.
	NewFileName    string
	ConflictAction string // Action taken during conflict resolution
}

// ResolveConflicts resolves all conflicts in the plan using the specified strategy
func (p *Plan) ResolveConflicts(strategy models.ConflictStrategy) error {
	for i := range p.Conflicts {
		log.Debug("resolving conflict", zap.String("conflict_id", p.Conflicts[i].ID), zap.String("strategy", string(strategy)))
		conflict := &p.Conflicts[i]
		if !conflict.Resolved {
			if err := p.resolveConflict(conflict, strategy); err != nil {
				log.Error("failed to resolve conflict", zap.Error(err), zap.String("conflict_id", conflict.ID))
				return fmt.Errorf("failed to resolve conflict %s: %w", conflict.ID, err)
			}
		}
	}

	return nil
}

// resolveConflict resolves a single conflict
func (p *Plan) resolveConflict(conflict *Conflict, strategy models.ConflictStrategy) error {
	switch conflict.ConflictType {
	case ConflictTypeMultipleSource:
		return p.resolveMultipleSourceConflict(conflict, strategy)
	case ConflictTypeTargetExists:
		return p.resolveTargetExistsConflict(conflict, strategy)
	default:
		return fmt.Errorf("unknown conflict type: %v", conflict.ConflictType)
	}
}

// resolveMultipleSourceConflict resolves a conflict where multiple sources map to the same target
func (p *Plan) resolveMultipleSourceConflict(conflict *Conflict, strategy models.ConflictStrategy) error {
	// Find all changes involved in this conflict
	conflictingChanges := make([]*Change, 0, len(conflict.ChangeIDs))
	for i := range p.Changes {
		change := &p.Changes[i]
		for _, changeID := range conflict.ChangeIDs {
			if change.ID == changeID {
				conflictingChanges = append(conflictingChanges, change)
				break
			}
		}
	}

	// Apply resolution strategy
	switch strategy {
	case models.ConflictStrategySkip:
		// Skip all conflicting changes
		for _, change := range conflictingChanges {
			change.Action = ActionSkip
		}

	case models.ConflictStrategyAppendNumber:
		// Append numbers to target filenames to make them unique
		for i, change := range conflictingChanges {
			if i == 0 {
				// Keep the first one as-is
				continue
			}

			// Generate new filename with number suffix
			dir := filepath.Dir(change.After.Path)
			ext := filepath.Ext(change.After.Filename)
			nameWithoutExt := change.After.Filename[:len(change.After.Filename)-len(ext)]

			// Find a unique number
			counter := i
			var newFileName string
			var newPath string

			for {
				newFileName = fmt.Sprintf("%s (%d)%s", nameWithoutExt, counter, ext)
				newPath = filepath.Join(dir, newFileName)

				// Check if this path conflicts with any other change or existing file
				if !p.pathConflictsWithOtherChanges(newPath, change.ID) && !fileExists(newPath) {
					break
				}
				counter++
			}

			// Update the change with the new target
			change.After.Path = newPath
			change.After.Filename = newFileName
		}

	case models.ConflictStrategyAppendTimestamp:
		// Append timestamps to target filenames to make them unique
		for i, change := range conflictingChanges {
			if i == 0 {
				// Keep the first one as-is
				continue
			}

			// Generate new filename with timestamp suffix
			dir := filepath.Dir(change.After.Path)
			ext := filepath.Ext(change.After.Filename)
			nameWithoutExt := change.After.Filename[:len(change.After.Filename)-len(ext)]

			// Use current timestamp with microseconds for uniqueness
			timestamp := time.Now().Format("20060102-150405.000000")
			newFileName := fmt.Sprintf("%s (%s)%s", nameWithoutExt, timestamp, ext)
			newPath := filepath.Join(dir, newFileName)

			// Update the change with the new target
			change.After.Path = newPath
			change.After.Filename = newFileName
		}

	case models.ConflictStrategyOverwrite:
		// Keep the first, skip others
		for i, change := range conflictingChanges {
			if i > 0 {
				change.Action = ActionSkip
			}
		}

	default:
		return fmt.Errorf("unsupported conflict strategy: %v", strategy)
	}

	// Mark conflict as resolved
	conflict.Resolved = true
	conflict.Resolution = ConflictResolution{
		Strategy:      p.getStrategyName(strategy),
		Modifications: make(map[string]string),
		Timestamp:     time.Now(),
	}

	// Clear conflict IDs from changes
	for _, change := range conflictingChanges {
		change.ConflictIDs = removeConflictID(change.ConflictIDs, conflict.ID)
	}

	return nil
}

// resolveTargetExistsConflict resolves a conflict where the target file already exists
func (p *Plan) resolveTargetExistsConflict(conflict *Conflict, strategy models.ConflictStrategy) error {
	if len(conflict.ChangeIDs) != 1 {
		return fmt.Errorf("target exists conflict should have exactly one change, got %d", len(conflict.ChangeIDs))
	}

	// Find the conflicting change
	var change *Change
	for i := range p.Changes {
		if p.Changes[i].ID == conflict.ChangeIDs[0] {
			change = &p.Changes[i]
			break
		}
	}

	if change == nil {
		return fmt.Errorf("could not find change with ID %s", conflict.ChangeIDs[0])
	}

	// Apply resolution strategy
	switch strategy {
	case models.ConflictStrategySkip:
		change.Action = ActionSkip

	case models.ConflictStrategyOverwrite:
		// Keep the rename action - the actual file service will handle the overwrite
		// No action needed here

	default:
		// For other strategies, skip for now - more sophisticated logic can be added later
		change.Action = ActionSkip
	}

	// Mark conflict as resolved
	conflict.Resolved = true
	conflict.Resolution = ConflictResolution{
		Strategy:      p.getStrategyName(strategy),
		Modifications: make(map[string]string),
		Timestamp:     time.Now(),
	}

	// Clear conflict ID from change
	change.ConflictIDs = removeConflictID(change.ConflictIDs, conflict.ID)

	return nil
}

// getStrategyName returns a human-readable name for the conflict strategy
func (p *Plan) getStrategyName(strategy models.ConflictStrategy) string {
	switch strategy {
	case models.ConflictStrategySkip:
		return "skip"
	case models.ConflictStrategyAppendNumber:
		return "append_number"
	case models.ConflictStrategyAppendTimestamp:
		return "append_timestamp"
	case models.ConflictStrategyPromptUser:
		return "prompt_user"
	case models.ConflictStrategyOverwrite:
		return "overwrite"
	default:
		return "unknown"
	}
}

// pathConflictsWithOtherChanges checks if a path conflicts with any other changes in the plan
func (p *Plan) pathConflictsWithOtherChanges(targetPath, excludeChangeID string) bool {
	for _, change := range p.Changes {
		if change.ID != excludeChangeID && change.Action == ActionRename && change.After.Path == targetPath {
			return true
		}
	}
	return false
}
