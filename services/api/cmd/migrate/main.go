package main

import (
	"context"
	"os"

	"clinicpulse/services/api/internal/config"
	"clinicpulse/services/api/internal/migrations"
	"clinicpulse/services/api/internal/observability"
	"clinicpulse/services/api/internal/store"
)

func main() {
	logger := observability.NewLogger(os.Stdout, observability.Fields{
		"service": "clinicpulse-migrate",
	})

	cfg, err := config.Load()
	if err != nil {
		logger.Slog().Error("config_load_failed", "error", err)
		os.Exit(1)
	}
	logger = logger.With(observability.Fields{"deploy_env": cfg.DeployEnv})

	dir := os.Getenv("CLINICPULSE_MIGRATIONS_DIR")
	if dir == "" {
		dir = "migrations"
	}
	if _, err := migrations.ListFiles(dir); err != nil {
		logger.Slog().Error("migrations_dir_invalid", "dir", dir, "error", err)
		os.Exit(1)
	}

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Slog().Error("database_open_failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := migrations.Run(ctx, pool, migrations.Options{Dir: dir}); err != nil {
		logger.Slog().Error("migrations_apply_failed", "dir", dir, "error", err)
		os.Exit(1)
	}

	logger.Slog().Info("migrations_applied", "dir", dir)
}
