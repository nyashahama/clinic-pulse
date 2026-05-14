package config

import (
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type DeployEnv string

const (
	DeployEnvLocal      DeployEnv = "local"
	DeployEnvStaging    DeployEnv = "staging"
	DeployEnvProduction DeployEnv = "production"
)

const (
	defaultAddr            = ":8080"
	defaultDatabaseURL     = "postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable"
	defaultReadTimeout     = 10 * time.Second
	defaultWriteTimeout    = 20 * time.Second
	defaultIdleTimeout     = 60 * time.Second
	defaultShutdownTimeout = 10 * time.Second
	minAPIKeyPepperLength  = 32
)

type Config struct {
	DeployEnv              DeployEnv
	Addr                   string
	DatabaseURL            string
	APIKeyPepper           string
	ReadTimeout            time.Duration
	WriteTimeout           time.Duration
	IdleTimeout            time.Duration
	ShutdownTimeout        time.Duration
	WebhookDeliveryEnabled bool
	TrustedOrigins         []string
	LoginRateLimit         int
	MutationRateLimit      int
	RateLimitWindow        time.Duration
}

func Load() (Config, error) {
	deployEnv := DeployEnv(envOrDefault("CLINICPULSE_DEPLOY_ENV", string(DeployEnvLocal)))

	addr := strings.TrimSpace(os.Getenv("CLINICPULSE_API_ADDR"))
	if addr == "" {
		if port := strings.TrimSpace(os.Getenv("PORT")); port != "" {
			addr = ":" + strings.TrimPrefix(port, ":")
		} else {
			addr = defaultAddr
		}
	}

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" && deployEnv == DeployEnvLocal {
		databaseURL = defaultDatabaseURL
	}

	readTimeout, err := durationFromEnv("CLINICPULSE_API_READ_TIMEOUT", defaultReadTimeout)
	if err != nil {
		return Config{}, err
	}
	writeTimeout, err := durationFromEnv("CLINICPULSE_API_WRITE_TIMEOUT", defaultWriteTimeout)
	if err != nil {
		return Config{}, err
	}
	idleTimeout, err := durationFromEnv("CLINICPULSE_API_IDLE_TIMEOUT", defaultIdleTimeout)
	if err != nil {
		return Config{}, err
	}
	shutdownTimeout, err := durationFromEnv("CLINICPULSE_API_SHUTDOWN_TIMEOUT", defaultShutdownTimeout)
	if err != nil {
		return Config{}, err
	}

	apiKeyPepper := os.Getenv("CLINICPULSE_API_KEY_PEPPER")
	webhookDeliveryEnabled := os.Getenv("CLINICPULSE_WEBHOOK_DELIVERY_ENABLED") == "true"
	trustedOrigins := splitCSV(os.Getenv("CLINICPULSE_TRUSTED_ORIGINS"))
	rateLimitWindow, err := durationFromEnv("CLINICPULSE_RATE_LIMIT_WINDOW", time.Minute)
	if err != nil {
		return Config{}, err
	}
	loginRateLimit, err := intEnv("CLINICPULSE_LOGIN_RATE_LIMIT", 8)
	if err != nil {
		return Config{}, err
	}
	mutationRateLimit, err := intEnv("CLINICPULSE_MUTATION_RATE_LIMIT", 60)
	if err != nil {
		return Config{}, err
	}

	cfg := Config{
		DeployEnv:              deployEnv,
		Addr:                   addr,
		DatabaseURL:            databaseURL,
		APIKeyPepper:           apiKeyPepper,
		ReadTimeout:            readTimeout,
		WriteTimeout:           writeTimeout,
		IdleTimeout:            idleTimeout,
		ShutdownTimeout:        shutdownTimeout,
		WebhookDeliveryEnabled: webhookDeliveryEnabled,
		TrustedOrigins:         trustedOrigins,
		LoginRateLimit:         loginRateLimit,
		MutationRateLimit:      mutationRateLimit,
		RateLimitWindow:        rateLimitWindow,
	}

	if err := cfg.Validate(); err != nil {
		return Config{}, err
	}

	return cfg, nil
}

func (c Config) Validate() error {
	var problems []string

	switch c.DeployEnv {
	case DeployEnvLocal, DeployEnvStaging, DeployEnvProduction:
	default:
		problems = append(problems, fmt.Sprintf("CLINICPULSE_DEPLOY_ENV must be one of %q, %q, or %q", DeployEnvLocal, DeployEnvStaging, DeployEnvProduction))
	}

	if c.DeployEnv != DeployEnvLocal {
		if strings.TrimSpace(c.DatabaseURL) == "" {
			problems = append(problems, "DATABASE_URL is required outside local deploy env")
		} else if isLocalDatabaseURL(c.DatabaseURL) {
			problems = append(problems, "DATABASE_URL must not use localhost outside local deploy env")
		}

		if len(c.APIKeyPepper) < minAPIKeyPepperLength {
			problems = append(problems, fmt.Sprintf("CLINICPULSE_API_KEY_PEPPER must be at least %d characters outside local deploy env", minAPIKeyPepperLength))
		}

		if len(c.TrustedOrigins) == 0 {
			problems = append(problems, "CLINICPULSE_TRUSTED_ORIGINS is required outside local deploy env")
		}
	}

	if c.LoginRateLimit <= 0 || c.MutationRateLimit <= 0 || c.RateLimitWindow <= 0 {
		problems = append(problems, "rate limit settings must be positive")
	}

	for _, timeout := range []struct {
		name  string
		value time.Duration
	}{
		{name: "CLINICPULSE_API_READ_TIMEOUT", value: c.ReadTimeout},
		{name: "CLINICPULSE_API_WRITE_TIMEOUT", value: c.WriteTimeout},
		{name: "CLINICPULSE_API_IDLE_TIMEOUT", value: c.IdleTimeout},
		{name: "CLINICPULSE_API_SHUTDOWN_TIMEOUT", value: c.ShutdownTimeout},
	} {
		if timeout.value <= 0 {
			problems = append(problems, fmt.Sprintf("%s must be positive", timeout.name))
		}
	}

	if len(problems) > 0 {
		return fmt.Errorf("invalid config: %s", strings.Join(problems, "; "))
	}

	return nil
}

func envOrDefault(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func splitCSV(value string) []string {
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			result = append(result, strings.TrimRight(part, "/"))
		}
	}
	return result
}

func intEnv(key string, fallback int) (int, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a positive integer: %w", key, err)
	}
	if parsed <= 0 {
		return 0, fmt.Errorf("%s must be positive", key)
	}

	return parsed, nil
}

func durationFromEnv(key string, fallback time.Duration) (time.Duration, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback, nil
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return 0, fmt.Errorf("%s must be a valid duration: %w", key, err)
	}

	return duration, nil
}

func isLocalDatabaseURL(databaseURL string) bool {
	parsed, err := url.Parse(databaseURL)
	if err != nil {
		return false
	}

	host := strings.ToLower(parsed.Hostname())
	if host == "localhost" {
		return true
	}

	ip := net.ParseIP(host)
	return ip != nil && ip.IsLoopback()
}
