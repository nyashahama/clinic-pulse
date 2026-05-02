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
	cfg := config.Load()

	ctx := context.Background()
	pool, err := store.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer pool.Close()

	router := apihttp.NewRouter(store.New(pool))
	log.Fatal(http.ListenAndServe(cfg.Addr, router))
}
