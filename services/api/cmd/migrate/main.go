package main

import (
	"context"
	"log"
	"os"

	"clinicpulse/services/api/internal/config"
	"clinicpulse/services/api/internal/migrations"
	"clinicpulse/services/api/internal/store"
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("load config: %v", err)
	}

	dir := os.Getenv("CLINICPULSE_MIGRATIONS_DIR")
	if dir == "" {
		dir = "migrations"
	}
	if _, err := migrations.ListFiles(dir); err != nil {
		logger.Fatalf("validate migrations dir: %v", err)
	}

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("open database: %v", err)
	}
	defer pool.Close()

	if err := migrations.Run(ctx, pool, migrations.Options{Dir: dir}); err != nil {
		logger.Fatalf("apply migrations: %v", err)
	}

	logger.Printf("migrations applied from %s", dir)
}
