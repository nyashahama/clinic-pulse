package config

import (
	"strings"
	"testing"
)

func clearConfigEnv(t *testing.T) {
	t.Helper()

	for _, key := range []string{
		"CLINICPULSE_DEPLOY_ENV",
		"CLINICPULSE_API_ADDR",
		"PORT",
		"DATABASE_URL",
		"CLINICPULSE_API_KEY_PEPPER",
		"CLINICPULSE_API_READ_TIMEOUT",
		"CLINICPULSE_API_WRITE_TIMEOUT",
		"CLINICPULSE_API_IDLE_TIMEOUT",
		"CLINICPULSE_API_SHUTDOWN_TIMEOUT",
		"CLINICPULSE_WEBHOOK_DELIVERY_ENABLED",
	} {
		t.Setenv(key, "")
	}
}

func TestLoadAllowsLocalDefaults(t *testing.T) {
	clearConfigEnv(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.DeployEnv != DeployEnvLocal {
		t.Fatalf("DeployEnv = %q, want %q", cfg.DeployEnv, DeployEnvLocal)
	}

	if cfg.Addr != ":8080" {
		t.Fatalf("Addr = %q, want :8080", cfg.Addr)
	}
}

func TestLoadUsesProviderPortWhenAddressIsUnset(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("PORT", "3131")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Addr != ":3131" {
		t.Fatalf("Addr = %q, want :3131", cfg.Addr)
	}
}

func TestLoadNormalizesProviderPortWithLeadingColon(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("PORT", ":3000")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if cfg.Addr != ":3000" {
		t.Fatalf("Addr = %q, want :3000", cfg.Addr)
	}
}

func TestLoadRejectsUnknownDeployEnv(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CLINICPULSE_DEPLOY_ENV", "preview")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want validation error")
	}

	if !strings.Contains(err.Error(), "CLINICPULSE_DEPLOY_ENV") {
		t.Fatalf("Load() error = %q, want mention CLINICPULSE_DEPLOY_ENV", err.Error())
	}
}

func TestLoadRejectsUnsafeStagingConfig(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CLINICPULSE_DEPLOY_ENV", string(DeployEnvStaging))
	t.Setenv("CLINICPULSE_API_KEY_PEPPER", "short")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want validation error")
	}

	errText := err.Error()
	for _, want := range []string{"DATABASE_URL", "CLINICPULSE_API_KEY_PEPPER"} {
		if !strings.Contains(errText, want) {
			t.Fatalf("Load() error = %q, want mention %s", errText, want)
		}
	}
}

func TestLoadRejectsNonPositiveTimeout(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CLINICPULSE_API_READ_TIMEOUT", "0s")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want validation error")
	}

	if !strings.Contains(err.Error(), "CLINICPULSE_API_READ_TIMEOUT") {
		t.Fatalf("Load() error = %q, want mention CLINICPULSE_API_READ_TIMEOUT", err.Error())
	}
}

func TestLoadRejectsInvalidDurationSyntax(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CLINICPULSE_API_READ_TIMEOUT", "soon")

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want validation error")
	}

	if !strings.Contains(err.Error(), "CLINICPULSE_API_READ_TIMEOUT") {
		t.Fatalf("Load() error = %q, want mention CLINICPULSE_API_READ_TIMEOUT", err.Error())
	}
}

func TestLoadRejectsLocalDatabaseInProduction(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CLINICPULSE_DEPLOY_ENV", string(DeployEnvProduction))
	t.Setenv("DATABASE_URL", "postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable")
	t.Setenv("CLINICPULSE_API_KEY_PEPPER", strings.Repeat("p", 32))

	_, err := Load()
	if err == nil {
		t.Fatal("Load() error = nil, want validation error")
	}

	if !strings.Contains(err.Error(), "localhost") {
		t.Fatalf("Load() error = %q, want mention localhost", err.Error())
	}
}
