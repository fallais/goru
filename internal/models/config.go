package models

import (
	validation "github.com/go-ozzo/ozzo-validation/v4"
)

type Config struct {
	Providers     map[string]Provider `yaml:"providers" mapstructure:"providers"`
	Directories   []Directory         `yaml:"directories" mapstructure:"directories"`
	MaxConcurrent int                 `yaml:"max_concurrent" mapstructure:"max_concurrent"`
}

type Provider struct {
	APIKey string `yaml:"api_key" mapstructure:"api_key"`
}

type Directory struct {
	Name             string           `yaml:"name" mapstructure:"name"`
	Path             string           `yaml:"path" mapstructure:"path"`
	Type             string           `yaml:"type" mapstructure:"type"`
	Provider         string           `yaml:"provider" mapstructure:"provider"`
	Recursive        bool             `yaml:"recursive" mapstructure:"recursive"`
	ConflictStrategy ConflictStrategy `yaml:"conflict_strategy" mapstructure:"conflict_strategy"`
	Format           string           `yaml:"format" mapstructure:"format"`
}

func (c Config) Validate() error {
	return validation.ValidateStruct(&c,
		validation.Field(&c.Providers),
		validation.Field(&c.Directories, validation.Each(validation.By(func(value interface{}) error {
			if dir, ok := value.(Directory); ok {
				return dir.Validate()
			}
			return nil
		}))),
	)
}

func (d Directory) Validate() error {
	return validation.ValidateStruct(&d,
		validation.Field(&d.Path, validation.Required),
		validation.Field(&d.Type, validation.Required),
		validation.Field(&d.ConflictStrategy, validation.In(
			ConflictStrategySkip,
			ConflictStrategyAppendNumber,
			ConflictStrategyAppendTimestamp,
			ConflictStrategyOverwrite,
			ConflictStrategyPromptUser,
		).Error("must be one of 'skip', 'append_number', 'append_timestamp', 'overwrite', or 'prompt_user'")),
	)
}

func (c *ConflictStrategy) UnmarshalText(text []byte) error {
	*c = ConflictStrategy(text)
	return nil
}
