package plans

import "goru/internal/models"

type FileInfo struct {
	Path     string `json:"path"`
	FileName string `json:"file_name"`
}

// Change represents a proposed change to a video file.
type Change struct {
	ID string `json:"id"`

	// Action to be performed
	Action Action `json:"action"`

	Before models.VideoFile `json:"before"`
	After  models.VideoFile `json:"after"`

	// ConflictIDs tracks which conflicts affect this change
	ConflictIDs []string `json:"conflict_ids,omitempty"`

	// Error stores any error that occurred during planning
	//Error string `json:"error,omitempty"`
}

// IsConflicting returns true if this change has unresolved conflicts
func (c *Change) IsConflicting() bool {
	return len(c.ConflictIDs) > 0
}
