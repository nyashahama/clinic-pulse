package store

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestAuditEventsMigrationDeclaresImmutabilityTriggers(t *testing.T) {
	t.Parallel()

	migrationSQL := readIntegrationMigrationSQL(t)
	required := []string{
		"CREATE FUNCTION prevent_audit_events_mutation()",
		"BEFORE UPDATE OR DELETE ON audit_events",
		"BEFORE TRUNCATE ON audit_events",
		"EXECUTE FUNCTION prevent_audit_events_mutation()",
	}

	for _, want := range required {
		if !strings.Contains(migrationSQL, want) {
			t.Fatalf("expected audit_events immutability migration to contain %q", want)
		}
	}
}

func readIntegrationMigrationSQL(t *testing.T) string {
	t.Helper()

	migrations, err := filepath.Glob(filepath.Join("..", "..", "migrations", "*.sql"))
	if err != nil {
		t.Fatalf("find migrations: %v", err)
	}
	if len(migrations) == 0 {
		t.Fatal("expected migrations")
	}

	var builder strings.Builder
	for _, migration := range migrations {
		sqlBytes, err := os.ReadFile(migration)
		if err != nil {
			t.Fatalf("read migration %s: %v", migration, err)
		}
		builder.Write(sqlBytes)
		builder.WriteByte('\n')
	}

	return builder.String()
}
