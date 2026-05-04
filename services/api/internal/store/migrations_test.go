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
		"Password hashes correspond to the local demo password shared out-of-band.",
		"$2b$",
	}
	for _, value := range required {
		if !strings.Contains(seedSQL, value) {
			t.Fatalf("expected local auth seed to contain %q", value)
		}
	}
}

func TestOfflineSyncMigrationAddsPilotReadinessTables(t *testing.T) {
	t.Parallel()

	migrationSQL := readMigrationFile(t, "0006_offline_sync_pilot_readiness.sql")
	required := []string{
		"CREATE TABLE report_sync_attempts",
		"result TEXT NOT NULL CHECK",
		"result IN ('created', 'duplicate', 'conflict', 'validation_error', 'forbidden', 'server_error')",
		"client_attempt_count INTEGER NOT NULL DEFAULT 1",
		"CREATE INDEX report_sync_attempts_external_created_at_idx",
		"CREATE INDEX report_sync_attempts_result_created_at_idx",
		"CREATE INDEX current_status_freshness_updated_at_idx",
	}
	for _, value := range required {
		if !strings.Contains(migrationSQL, value) {
			t.Fatalf("expected offline sync migration to contain %q", value)
		}
	}
}

func TestOfflineSyncLedgerClinicIDMigrationAllowsMalformedValidationAttempts(t *testing.T) {
	t.Parallel()

	migrationSQL := readMigrationFile(t, "0007_nullable_sync_attempt_clinic_id.sql")
	required := []string{
		"ALTER TABLE report_sync_attempts",
		"ALTER COLUMN clinic_id DROP NOT NULL",
	}
	for _, value := range required {
		if !strings.Contains(migrationSQL, value) {
			t.Fatalf("expected nullable sync attempt clinic migration to contain %q", value)
		}
	}
}

func TestPartnerReadinessMigrationAddsPartnerTables(t *testing.T) {
	t.Parallel()

	migrationSQL := readMigrationFile(t, "0008_partner_readiness.sql")
	required := []string{
		"CREATE TABLE partner_api_keys",
		"environment TEXT NOT NULL CHECK (environment IN ('demo', 'live'))",
		"key_hash TEXT NOT NULL CHECK",
		"CREATE UNIQUE INDEX partner_api_keys_hash_unique_idx",
		"partner_api_keys_organisation_created_at_idx",
		"partner_api_keys_active_idx",
		"CREATE TABLE partner_webhook_subscriptions",
		"status TEXT NOT NULL CHECK (status IN ('active', 'disabled'))",
		"last_test_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(last_test_metadata) = 'object')",
		"partner_webhook_subscriptions_organisation_created_at_idx",
		"partner_webhook_subscriptions_status_idx",
		"CREATE TABLE partner_webhook_events",
		"payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),\n    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object')",
		"status TEXT NOT NULL CHECK (status IN ('queued', 'delivered', 'failed', 'preview_only'))",
		"partner_webhook_events_subscription_created_at_idx",
		"partner_webhook_events_status_created_at_idx",
		"CREATE TABLE partner_export_runs",
		"format TEXT NOT NULL CHECK (format IN ('json', 'csv'))",
		"partner_export_runs_organisation_created_at_idx",
		"partner_export_runs_requested_by_created_at_idx",
		"CREATE TABLE integration_status_checks",
		"status TEXT NOT NULL CHECK (status IN ('passing', 'attention', 'failing'))",
		"integration_status_checks_org_name_unique_idx",
		"integration_status_checks_status_checked_at_idx",
	}
	for _, value := range required {
		if !strings.Contains(migrationSQL, value) {
			t.Fatalf("expected partner readiness migration to contain %q", value)
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
