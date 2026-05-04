package config

import "os"

type Config struct {
	Addr                   string
	DatabaseURL            string
	APIKeyPepper           string
	WebhookDeliveryEnabled bool
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

	apiKeyPepper := os.Getenv("CLINICPULSE_API_KEY_PEPPER")
	webhookDeliveryEnabled := os.Getenv("CLINICPULSE_WEBHOOK_DELIVERY_ENABLED") == "true"

	return Config{
		Addr:                   addr,
		DatabaseURL:            databaseURL,
		APIKeyPepper:           apiKeyPepper,
		WebhookDeliveryEnabled: webhookDeliveryEnabled,
	}
}
