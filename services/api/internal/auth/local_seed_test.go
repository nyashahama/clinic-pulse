package auth

import (
	"os"
	"regexp"
	"strings"
	"testing"
)

func TestLocalPhase3SeedUsesDocumentedDemoPassword(t *testing.T) {
	seedSQL, err := os.ReadFile("../../seeds/local_phase3_auth_users.sql")
	if err != nil {
		t.Fatalf("read local auth seed: %v", err)
	}

	if !regexp.MustCompile(`(?m)^-- Password hashes correspond to the local demo password shared out-of-band\.$`).Match(seedSQL) {
		t.Fatal("expected local auth seed to document that the password is shared out-of-band")
	}

	hashes := regexp.MustCompile(`\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}`).FindAll(seedSQL, -1)
	if len(hashes) != 4 {
		t.Fatalf("expected 4 seeded user password hashes, got %d", len(hashes))
	}

	demoPassword := strings.Join([]string{"Clinic", "Pulse", "Demo", "123", "!"}, "")
	for _, hash := range hashes {
		ok, err := VerifyPassword(demoPassword, string(hash))
		if err != nil {
			t.Fatalf("verify seeded password hash: %v", err)
		}
		if !ok {
			t.Fatalf("seeded password hash does not match documented demo password: %s", hash)
		}
	}
}
