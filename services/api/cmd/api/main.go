package main

import (
	"context"
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
	bootstrapLogger := observability.NewLogger(os.Stdout, observability.Fields{
		"service": "clinicpulse-api",
	}).Slog()

	cfg, err := config.Load()
	if err != nil {
		bootstrapLogger.Error("config_load_failed", "error", err)
		os.Exit(1)
	}
	logger := observability.NewLogger(os.Stdout, observability.Fields{
		"service":    cfg.ObservabilityServiceName,
		"deploy_env": cfg.DeployEnv,
	})
	metrics := observability.NewRegistry()

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Slog().Error("database_open_failed", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	router := apihttp.NewRouter(
		store.New(pool),
		apihttp.WithAPIKeyPepper(cfg.APIKeyPepper),
		apihttp.WithWebhookDeliveryEnabled(cfg.WebhookDeliveryEnabled),
		apihttp.WithTrustedOrigins(cfg.TrustedOrigins),
		apihttp.WithLoginRateLimiter(security.NewFixedWindowLimiter(cfg.LoginRateLimit, cfg.RateLimitWindow, time.Now)),
		apihttp.WithMutationRateLimiter(security.NewFixedWindowLimiter(cfg.MutationRateLimit, cfg.RateLimitWindow, time.Now)),
		apihttp.WithObservability(logger, metrics),
		apihttp.WithMetricsEndpoint(cfg.MetricsEnabled, cfg.MetricsToken),
	)
	server := apiruntime.NewServer(apiruntime.ServerConfig{
		Addr:            cfg.Addr,
		ReadTimeout:     cfg.ReadTimeout,
		WriteTimeout:    cfg.WriteTimeout,
		IdleTimeout:     cfg.IdleTimeout,
		ShutdownTimeout: cfg.ShutdownTimeout,
	}, router)

	logger.Slog().Info("api_server_starting", "addr", cfg.Addr)
	if err := apiruntime.Serve(ctx, server, cfg.ShutdownTimeout, logger.Slog()); err != nil {
		logger.Slog().Error("api_server_failed", "error", err)
		os.Exit(1)
	}
}
