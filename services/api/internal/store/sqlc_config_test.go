package store

import (
	"os"
	"strings"
	"testing"
)

func TestSQLCConfigUsesMigrationsAndPGX(t *testing.T) {
	config, err := os.ReadFile("../../sqlc.yaml")
	if err != nil {
		t.Fatalf("read sqlc config: %v", err)
	}

	text := string(config)
	for _, want := range []string{
		`schema: "migrations"`,
		`queries: "internal/store/sqlc"`,
		`package: "db"`,
		`out: "internal/db"`,
		`sql_package: "pgx/v5"`,
	} {
		if !strings.Contains(text, want) {
			t.Fatalf("expected sqlc config to contain %q, got:\n%s", want, text)
		}
	}
}

func TestStoreInitializesSQLCQueries(t *testing.T) {
	store := New(nil)

	if store.queries == nil {
		t.Fatal("expected Store to initialize sqlc query bindings")
	}
}
