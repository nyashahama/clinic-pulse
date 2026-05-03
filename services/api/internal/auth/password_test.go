package auth

import "testing"

func TestHashPasswordAndVerifyPasswordAcceptsMatchingPassword(t *testing.T) {
	t.Parallel()

	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == "" {
		t.Fatal("expected non-empty hash")
	}
	if hash == "correct horse battery staple" {
		t.Fatal("expected hash to differ from plaintext")
	}

	ok, err := VerifyPassword("correct horse battery staple", hash)
	if err != nil {
		t.Fatalf("VerifyPassword returned error: %v", err)
	}
	if !ok {
		t.Fatal("expected password to verify")
	}
}

func TestVerifyPasswordRejectsMismatchWithoutError(t *testing.T) {
	t.Parallel()

	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}

	ok, err := VerifyPassword("wrong password", hash)
	if err != nil {
		t.Fatalf("expected mismatch to return no error, got %v", err)
	}
	if ok {
		t.Fatal("expected mismatch to return false")
	}
}

func TestHashPasswordRejectsEmptyPassword(t *testing.T) {
	t.Parallel()

	if _, err := HashPassword(""); err == nil {
		t.Fatal("expected empty password to return error")
	}
}

func TestHashPasswordRejectsOverlongPassword(t *testing.T) {
	t.Parallel()

	if _, err := HashPassword(string(make([]byte, 73))); err == nil {
		t.Fatal("expected overlong password to return error")
	}
}

func TestVerifyPasswordRejectsEmptyInputs(t *testing.T) {
	t.Parallel()

	if ok, err := VerifyPassword("", "$2a$10$012345678901234567890u3mE8ta2a1OO9SKrVuFej8YgpaJf5X3C"); err == nil || ok {
		t.Fatalf("expected empty password to fail with error, ok=%v err=%v", ok, err)
	}

	if ok, err := VerifyPassword("password", ""); err == nil || ok {
		t.Fatalf("expected empty hash to fail with error, ok=%v err=%v", ok, err)
	}
}

func TestVerifyPasswordRejectsOverlongPassword(t *testing.T) {
	t.Parallel()

	hash, err := HashPassword("password")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}

	ok, err := VerifyPassword(string(make([]byte, 73)), hash)
	if err == nil {
		t.Fatal("expected overlong password to return error")
	}
	if ok {
		t.Fatal("expected overlong password to return false")
	}
}

func TestVerifyPasswordRejectsMalformedHash(t *testing.T) {
	t.Parallel()

	ok, err := VerifyPassword("password", "not-a-bcrypt-hash")
	if err == nil {
		t.Fatal("expected malformed hash to return error")
	}
	if ok {
		t.Fatal("expected malformed hash to return false")
	}
}
