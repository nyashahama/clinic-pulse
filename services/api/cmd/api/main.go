package main

import (
	"context"
	"log"
	"os"
	"time"

	"clinicpulse/services/api/internal/config"
	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/observability"
	apiruntime "clinicpulse/services/api/internal/runtime"
	"clinicpulse/services/api/internal/security"
	"clinicpulse/services/api/internal/store"
)

func main() {
	logger := log.New(os.Stdout, "", log.LstdFlags)

	cfg, err := config.Load()
	if err != nil {
		logger.Fatalf("load config: %v", err)
	}
	jsonLogger := observability.NewJSONLogger(os.Stdout, observability.Fields{
		"service":    cfg.ObservabilityServiceName,
		"deploy_env": cfg.DeployEnv,
	})
	metrics := observability.NewRegistry()

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
		apihttp.WithTrustedOrigins(cfg.TrustedOrigins),
		apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(cfg.LoginRateLimit, cfg.RateLimitWindow, time.Now)),
		apihttp.WithMutationRateLimiter(security.NewFixedWindowLimiter(cfg.MutationRateLimit, cfg.RateLimitWindow, time.Now)),
		apihttp.WithObservability(jsonLogger, metrics),
		apihttp.WithMetricsEndpoint(cfg.MetricsEnabled, cfg.MetricsToken),
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
