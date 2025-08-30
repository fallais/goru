package plans

type Action rune

const (
	// ActionNoop indicates no action is required. Basically this is when a file is
	// already nammed as it has to be.
	ActionNoop Action = 0

	// ActionRename indicates a file should be renamed.
	ActionRename Action = '~'

	// ActionSkip indicates a file should be skipped.
	// We do not use ActionNoop because we want to explicitly notify the user.
	ActionSkip Action = '-'
)
