package auth

import (
	"regexp"
	"testing"
)

func TestGenerateSessionTokenReturnsUniqueURLSafeTokens(t *testing.T) {
	t.Parallel()

	first, err := GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken returned error: %v", err)
	}
	second, err := GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken returned error: %v", err)
	}

	if first == "" || second == "" {
		t.Fatalf("expected non-empty tokens, got %q and %q", first, second)
	}
	if first == second {
		t.Fatal("expected generated tokens to be unique")
	}

	urlSafe := regexp.MustCompile(`^[A-Za-z0-9_-]+$`)
	if !urlSafe.MatchString(first) || !urlSafe.MatchString(second) {
		t.Fatalf("expected URL-safe tokens, got %q and %q", first, second)
	}
}

func TestHashSessionTokenIsDeterministicSHA256Hex(t *testing.T) {
	t.Parallel()

	token := "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

	hash, err := HashSessionToken(token)
	if err != nil {
		t.Fatalf("HashSessionToken returned error: %v", err)
	}
	again, err := HashSessionToken(token)
	if err != nil {
		t.Fatalf("HashSessionToken returned error: %v", err)
	}

	const want = "0f007385b6f9d4b7eeb2748605afe1a984a0a3bfa3f014d09e2a784ce9e5cd1a"
	if hash != want {
		t.Fatalf("expected %q, got %q", want, hash)
	}
	if again != hash {
		t.Fatalf("expected deterministic hash, got %q then %q", hash, again)
	}
}

func TestHashSessionTokenAcceptsGeneratedToken(t *testing.T) {
	t.Parallel()

	token, err := GenerateSessionToken()
	if err != nil {
		t.Fatalf("GenerateSessionToken returned error: %v", err)
	}

	hash, err := HashSessionToken(token)
	if err != nil {
		t.Fatalf("HashSessionToken returned error for generated token: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
}

func TestHashSessionTokenDiffersForDifferentTokens(t *testing.T) {
	t.Parallel()

	first, err := HashSessionToken("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
	if err != nil {
		t.Fatalf("HashSessionToken returned error: %v", err)
	}
	second, err := HashSessionToken("AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
	if err != nil {
		t.Fatalf("HashSessionToken returned error: %v", err)
	}

	if first == second {
		t.Fatal("expected different tokens to produce different hashes")
	}
}

func TestHashSessionTokenRejectsInvalidTokens(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		token string
	}{
		{name: "empty", token: ""},
		{name: "malformed", token: "not valid base64 url token!"},
		{name: "short", token: "AAAAAAAAAAA"},
		{name: "padded", token: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			if _, err := HashSessionToken(tt.token); err == nil {
				t.Fatal("expected invalid token to return error")
			}
		})
	}
}
