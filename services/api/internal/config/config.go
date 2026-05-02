package config

import "os"

type Config struct {
	Addr        string
	DatabaseURL string
}

func Load() Config {
	addr := os.Getenv("CLINICPULSE_API_ADDR")
	if addr == "" {
		addr = ":8080"
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		databaseURL = "postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable"
	}

	return Config{Addr: addr, DatabaseURL: databaseURL}
}
