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

func TestAuthRolesMigrationDoesNotSeedLocalPrivilegedUsers(t *testing.T) {
	t.Parallel()

	migrationSQL := readMigrationFile(t, "0003_auth_roles_workflows.sql")
	forbidden := []string{
		"@clinicpulse.local",
		"system-admin@clinicpulse.local",
		"org-admin@clinicpulse.local",
		"district-manager@clinicpulse.local",
		"reporter@clinicpulse.local",
		"$2a$",
		"$2b$",
		"$2y$",
	}
	for _, value := range forbidden {
		if strings.Contains(migrationSQL, value) {
			t.Fatalf("expected auth roles migration not to contain local seed value %q", value)
		}
	}
}

func TestLocalPhase3AuthSeedExistsOutsideMigrations(t *testing.T) {
	t.Parallel()

	seedSQL := readSeedFile(t, "local_phase3_auth_users.sql")
	required := []string{
		"@clinicpulse.local",
		"system-admin@clinicpulse.local",
		"org-admin@clinicpulse.local",
		"district-manager@clinicpulse.local",
		"reporter@clinicpulse.local",
		"$2a$",
	}
	for _, value := range required {
		if !strings.Contains(seedSQL, value) {
			t.Fatalf("expected local auth seed to contain %q", value)
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

func readMigrationFile(t *testing.T, name string) string {
	t.Helper()

	sqlBytes, err := os.ReadFile(filepath.Join("..", "..", "migrations", name))
	if err != nil {
		t.Fatalf("read migration %s: %v", name, err)
	}
	return string(sqlBytes)
}

func readSeedFile(t *testing.T, name string) string {
	t.Helper()

	sqlBytes, err := os.ReadFile(filepath.Join("..", "..", "seeds", name))
	if err != nil {
		t.Fatalf("read seed %s: %v", name, err)
	}
	return string(sqlBytes)
}
