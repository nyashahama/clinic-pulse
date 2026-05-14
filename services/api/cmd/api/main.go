package main

import (
	"context"
	"log"
	"net/http"

	"clinicpulse/services/api/internal/config"
	apihttp "clinicpulse/services/api/internal/http"
	"clinicpulse/services/api/internal/store"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer pool.Close()

	router := apihttp.NewRouter(
		store.New(pool),
		apihttp.WithAPIKeyPepper(cfg.APIKeyPepper),
		apihttp.WithWebhookDeliveryEnabled(cfg.WebhookDeliveryEnabled),
	)
	log.Fatal(http.ListenAndServe(cfg.Addr, router))
}
