package main

import (
	"context"
	"log"
	"os"

	"clinicpulse/services/api/internal/config"
	apihttp "clinicpulse/services/api/internal/http"
	apiruntime "clinicpulse/services/api/internal/runtime"
	"clinicpulse/services/api/internal/store"
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("load config: %v", err)
	}

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatalf("open database: %v", err)
	}
	defer pool.Close()

	router := apihttp.NewRouter(
		store.New(pool),
		apihttp.WithAPIKeyPepper(cfg.APIKeyPepper),
		apihttp.WithWebhookDeliveryEnabled(cfg.WebhookDeliveryEnabled),
	)
	server := apiruntime.NewServer(apiruntime.ServerConfig{
		Addr:            cfg.Addr,
		ReadTimeout:     cfg.ReadTimeout,
		WriteTimeout:    cfg.WriteTimeout,
		IdleTimeout:     cfg.IdleTimeout,
		ShutdownTimeout: cfg.ShutdownTimeout,
	}, router)

	logger.Printf("starting api server deploy_env=%s addr=%s", cfg.DeployEnv, cfg.Addr)
	if err := apiruntime.Serve(ctx, server, cfg.ShutdownTimeout, logger); err != nil {
		logger.Fatalf("serve api: %v", err)
	}
}
