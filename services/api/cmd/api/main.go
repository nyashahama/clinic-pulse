package main

import (
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"clinicpulse/services/api/internal/config"
	apihttp "clinicpulse/services/api/internal/http"
)

func main() {
	cfg := config.Load()

	if _, err := pgxpool.ParseConfig(cfg.DatabaseURL); err != nil {
		log.Fatalf("invalid database url: %v", err)
	}

	router := apihttp.NewRouter()
	log.Fatal(http.ListenAndServe(cfg.Addr, router))
}
