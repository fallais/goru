package models

// ConflictStrategy defines how to handle naming conflicts
type ConflictStrategy string

const (
	ConflictStrategySkip            ConflictStrategy = "skip"
	ConflictStrategyAppendNumber    ConflictStrategy = "append_number"
	ConflictStrategyAppendTimestamp ConflictStrategy = "append_timestamp"
	ConflictStrategyPromptUser      ConflictStrategy = "prompt_user"
	ConflictStrategyOverwrite       ConflictStrategy = "overwrite"
)

const DefaultConflictStrategy = ConflictStrategyAppendNumber
