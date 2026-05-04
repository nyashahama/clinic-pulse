package auth

import (
	"encoding/base64"
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

func TestGenerateAPIKeyReturnsLiveSecretForTrimmedCaseInsensitiveEnvironment(t *testing.T) {
	t.Parallel()

	secret, prefix, err := GenerateAPIKey(" Live ")
	if err != nil {
		t.Fatalf("GenerateAPIKey returned error: %v", err)
	}
	if !strings.HasPrefix(secret, "cp_live_") {
		t.Fatalf("expected live key prefix, got %q", secret)
	}
	if !strings.HasPrefix(secret, prefix) || len(prefix) != 16 {
		t.Fatalf("expected 16-character display prefix from secret, secret=%q prefix=%q", secret, prefix)
	}
	if _, err := HashAPIKey(secret, ""); err != nil {
		t.Fatalf("expected generated live key to hash successfully: %v", err)
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

	secret := "cp_demo_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
	withoutPepper, err := HashAPIKey(secret, "")
	if err != nil {
		t.Fatalf("HashAPIKey returned error: %v", err)
	}
	if withoutPepper != "2b618a1aa6d7bcb6878287c88b291b3df77a0a7b12919e5fd7ea514c500053a4" {
		t.Fatalf("unexpected unpeppered hash: %q", withoutPepper)
	}
	withPepper, err := HashAPIKey(secret, "pepper")
	if err != nil {
		t.Fatalf("HashAPIKey with pepper returned error: %v", err)
	}
	if withPepper != "699cb3e489a46c156eeb288588da66e7657de3ca6aa7de7cd4a7eec9b59665d9" {
		t.Fatalf("unexpected peppered hash: %q", withPepper)
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

func TestAPIKeyEnvironmentParsesValidGeneratedLikeKeys(t *testing.T) {
	t.Parallel()

	for _, tt := range []struct {
		secret string
		want   string
	}{
		{secret: generatedLikeAPIKey("demo", 0x00), want: "demo"},
		{secret: generatedLikeAPIKey("live", 0xff), want: "live"},
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

func TestAPIKeyEnvironmentRejectsMalformedKeys(t *testing.T) {
	t.Parallel()

	for _, secret := range []string{
		"cp_demo_",
		"cp_demo_not valid",
		"cp_demo_abc",
		" " + generatedLikeAPIKey("demo", 0x00),
		generatedLikeAPIKey("live", 0xff) + "\n",
	} {
		if _, err := APIKeyEnvironment(secret); err == nil {
			t.Fatalf("expected APIKeyEnvironment(%q) to fail", secret)
		}
		if _, err := HashAPIKey(secret, ""); err == nil {
			t.Fatalf("expected HashAPIKey(%q) to fail", secret)
		}
	}
}

func generatedLikeAPIKey(environment string, value byte) string {
	randomBytes := make([]byte, apiKeyRandomBytes)
	for i := range randomBytes {
		randomBytes[i] = value
	}
	return "cp_" + environment + "_" + base64.RawURLEncoding.EncodeToString(randomBytes)
}
