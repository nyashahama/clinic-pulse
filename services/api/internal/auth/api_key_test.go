package auth

import (
	"strings"
	"testing"
)

func TestGenerateAPIKeyReturnsDemoSecretAndPrefix(t *testing.T) {
	t.Parallel()

	secret, prefix, err := GenerateAPIKey("demo")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	if !strings.HasPrefix(secret, "cp_demo_") {
		t.Fatalf("expected demo key prefix, got %q", secret)
	}
	if !strings.HasPrefix(secret, prefix) || len(prefix) != 16 {
		t.Fatalf("expected 16-character display prefix from secret, secret=%q prefix=%q", secret, prefix)
	}
}

func TestGenerateAPIKeyRejectsUnknownEnvironment(t *testing.T) {
	t.Parallel()

	if _, _, err := GenerateAPIKey("prod"); err == nil {
		t.Fatal("expected unknown environment to fail")
	}
}

func TestHashAPIKeyUsesPepperAndRejectsInvalidSecret(t *testing.T) {
	t.Parallel()

	secret := "cp_demo_abcdefghijklmnopqrstuvwxyz0123456789"
	withoutPepper, err := HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	withPepper, err := HashAPIKey(secret, "pepper")
	if err != nil {
		t.Fatalf("HashAPIKey with pepper returned error: %v", err)
	}
	if withoutPepper == withPepper {
		t.Fatal("expected pepper to change hash")
	}
	if len(withPepper) != 64 {
		t.Fatalf("expected sha256 hex hash length 64, got %d", len(withPepper))
	}
	if _, err := HashAPIKey("not-a-clinicpulse-key", ""); err == nil {
		t.Fatal("expected invalid API key format to fail")
	}
}

func TestAPIKeyEnvironmentParsesKnownPrefixes(t *testing.T) {
	t.Parallel()

	for _, tt := range []struct {
		secret string
		want   string
	}{
		{secret: "cp_demo_abc", want: "demo"},
		{secret: "cp_live_abc", want: "live"},
	} {
		got, err := APIKeyEnvironment(tt.secret)
		if err != nil {
			t.Fatalf("APIKeyEnvironment(%q) returned error: %v", tt.secret, err)
		}
		if got != tt.want {
			t.Fatalf("expected %q, got %q", tt.want, got)
		}
	}
}
