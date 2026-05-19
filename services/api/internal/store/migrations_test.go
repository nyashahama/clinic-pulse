package store

import (
	"context"
	"os"
	"path/filepath"
	"strconv"
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
		"Password hashes correspond to the local walkthrough password shared out-of-band.",
		"$2b$",
		"password_changed_at",
		"password_reset_required",
	}
	for _, value := range required {
		if !strings.Contains(seedSQL, value) {
			t.Fatalf("expected local auth seed to contain %q", value)
		}
	}
}

func TestLocalPhase3AuthSeedMigratesLegacyDistrictOrganisation(t *testing.T) {
	t.Parallel()

	seedSQL := readSeedFile(t, "local_phase3_auth_users.sql")
	legacySlug := "tshwane-north-demo-district"
	currentSlug := "tshwane-north-district"
	legacyName := "Tshwane North Demo District"
	currentName := "Tshwane North District"

	legacySlugIndex := strings.Index(seedSQL, legacySlug)
	seedOrganisationIndex := strings.Index(seedSQL, "WITH seed_organisation AS")
	if legacySlugIndex == -1 {
		t.Fatalf("expected local auth seed to reference legacy organisation slug %q", legacySlug)
	}
	if !strings.Contains(seedSQL, currentSlug) {
		t.Fatalf("expected local auth seed to reference current organisation slug %q", currentSlug)
	}
	if seedOrganisationIndex == -1 {
		t.Fatal("expected local auth seed to define seed_organisation insert block")
	}
	if legacySlugIndex > seedOrganisationIndex {
		t.Fatalf("expected local auth seed to migrate legacy slug before seed_organisation insert block")
	}

	for _, value := range []string{legacyName, currentName, "UPDATE organisations"} {
		if !strings.Contains(seedSQL, value) {
			t.Fatalf("expected local auth seed to contain %q", value)
		}
	}
}

func TestLocalPhase3ReviewEvidenceSeedUsesCurrentDistrictOrganisation(t *testing.T) {
	t.Parallel()

	seedSQL := readSeedFile(t, "local_phase3_review_evidence.sql")
	forbidden := []string{
		"tshwane-north-demo-district",
		"Tshwane North Demo District",
	}
	for _, value := range forbidden {
		if strings.Contains(seedSQL, value) {
			t.Fatalf("expected local review evidence seed not to contain legacy value %q", value)
		}
	}

	required := []string{
		"tshwane-north-district",
		"Tshwane North District",
	}
	for _, value := range required {
		if !strings.Contains(seedSQL, value) {
			t.Fatalf("expected local review evidence seed to contain %q", value)
		}
	}
}

func TestLocalPhase3AuthSeedMergesLegacyOrganisationEvidence(t *testing.T) {
	databaseURL := os.Getenv("AUTH_STORE_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set AUTH_STORE_TEST_DATABASE_URL to run local auth seed integration tests")
	}

	ctx := context.Background()
	store := newIntegrationStore(t, ctx, databaseURL)

	currentOrgID := insertIntegrationOrganisation(t, ctx, store, "Tshwane North District", "tshwane-north-district")
	legacyOrgID := insertIntegrationOrganisation(t, ctx, store, "Tshwane North Demo District", "tshwane-north-demo-district")
	reviewerID := insertIntegrationUser(t, ctx, store, "legacy-reviewer@example.test", "Legacy Reviewer", nil, nil)
	reporterID := insertIntegrationUser(t, ctx, store, "legacy-reporter@example.test", "Legacy Reporter", nil, nil)
	insertIntegrationClinicInDistrict(t, ctx, store, "clinic-legacy-seed", "Legacy Seed Clinic", "Tshwane North District")
	reportID := insertLocalSeedCompatibilityReport(t, ctx, store, reporterID)
	subscriptionID := insertLocalSeedCompatibilityEvidence(t, ctx, store, currentOrgID, legacyOrgID, reviewerID, reporterID, reportID)

	runLocalAuthSeed(t, ctx, store)

	var legacyCount int
	if err := store.pool.QueryRow(ctx, `
SELECT count(*)
FROM organisations
WHERE lower(slug) = 'tshwane-north-demo-district'`).Scan(&legacyCount); err != nil {
		t.Fatalf("count legacy organisations: %v", err)
	}
	if legacyCount != 0 {
		t.Fatalf("expected legacy organisation to be removed, got %d", legacyCount)
	}

	assertOrgScopedCount(t, ctx, store, "organisation_memberships", currentOrgID, 4)
	assertOrgScopedCount(t, ctx, store, "report_reviews", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "audit_events", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "report_sync_attempts", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "pilot_ingestion_runs", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "partner_api_keys", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "partner_webhook_subscriptions", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "partner_export_runs", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "integration_status_checks", currentOrgID, 2)

	for _, table := range []string{
		"organisation_memberships",
		"report_reviews",
		"audit_events",
		"report_sync_attempts",
		"pilot_ingestion_runs",
		"partner_api_keys",
		"partner_webhook_subscriptions",
		"partner_export_runs",
		"integration_status_checks",
	} {
		assertOrgScopedCount(t, ctx, store, table, legacyOrgID, 0)
	}

	var webhookEventCount int
	if err := store.pool.QueryRow(ctx, `
SELECT count(*)
FROM partner_webhook_events
WHERE subscription_id = $1`, subscriptionID).Scan(&webhookEventCount); err != nil {
		t.Fatalf("count webhook events: %v", err)
	}
	if webhookEventCount != 1 {
		t.Fatalf("expected legacy webhook event to remain attached to moved subscription, got %d", webhookEventCount)
	}
}

func TestLocalPhase3AuthSeedRenamesLegacyOnlyOrganisationEvidence(t *testing.T) {
	databaseURL := os.Getenv("AUTH_STORE_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set AUTH_STORE_TEST_DATABASE_URL to run local auth seed integration tests")
	}

	ctx := context.Background()
	store := newIntegrationStore(t, ctx, databaseURL)

	legacyOrgID := insertIntegrationOrganisation(t, ctx, store, "Tshwane North Demo District", "tshwane-north-demo-district")
	reviewerID := insertIntegrationUser(t, ctx, store, "legacy-only-reviewer@example.test", "Legacy Only Reviewer", nil, nil)
	reporterID := insertIntegrationUser(t, ctx, store, "legacy-only-reporter@example.test", "Legacy Only Reporter", nil, nil)
	insertIntegrationClinicInDistrict(t, ctx, store, "clinic-legacy-seed", "Legacy Seed Clinic", "Tshwane North District")
	reportID := insertLocalSeedCompatibilityReport(t, ctx, store, reporterID)
	insertLocalSeedCompatibilityEvidence(t, ctx, store, legacyOrgID, legacyOrgID, reviewerID, reporterID, reportID)

	runLocalAuthSeed(t, ctx, store)

	var currentOrgID int64
	if err := store.pool.QueryRow(ctx, `
SELECT id
FROM organisations
WHERE lower(slug) = 'tshwane-north-district'`).Scan(&currentOrgID); err != nil {
		t.Fatalf("select renamed organisation: %v", err)
	}
	if currentOrgID != legacyOrgID {
		t.Fatalf("expected legacy organisation id %d to be renamed in place, got %d", legacyOrgID, currentOrgID)
	}

	assertOrgScopedCount(t, ctx, store, "organisation_memberships", currentOrgID, 4)
	assertOrgScopedCount(t, ctx, store, "report_reviews", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "partner_api_keys", currentOrgID, 1)
	assertOrgScopedCount(t, ctx, store, "partner_export_runs", currentOrgID, 1)

	assertNoLegacyDistrictValue(t, ctx, store, "organisation_memberships", "district")
	assertNoLegacyDistrictValue(t, ctx, store, "partner_api_keys", "allowed_districts::text")
	assertNoLegacyDistrictValue(t, ctx, store, "partner_export_runs", "scope::text")
}

func TestLocalPhase3ReviewEvidenceSeedExistsOutsideMigrations(t *testing.T) {
	t.Parallel()

	seedSQL := readSeedFile(t, "local_phase3_review_evidence.sql")
	required := []string{
		"Local-only Phase 3 review evidence seed.",
		"pilot_ingestion_runs",
		"report_reviews",
		"report_sync_attempts",
		"partner_api_keys",
		"partner_webhook_subscriptions",
		"partner_webhook_events",
		"partner_export_runs",
		"clinicpulse.webhook_test",
		"sha256:local-review-partner-export",
		"now() - interval",
	}
	for _, value := range required {
		if !strings.Contains(seedSQL, value) {
			t.Fatalf("expected local review evidence seed to contain %q", value)
		}
	}
}

func TestAuthLifecycleMigrationAddsAdminLifecycleColumnsAndIndexes(t *testing.T) {
	t.Parallel()

	migrationSQL := readMigrationFile(t, "0009_auth_hardening_admin_lifecycle.sql")
	required := []string{
		"ADD COLUMN password_changed_at TIMESTAMPTZ",
		"ADD COLUMN password_reset_required BOOLEAN NOT NULL DEFAULT false",
		"SET password_changed_at = updated_at",
		"CREATE INDEX users_disabled_at_idx ON users (disabled_at)",
		"WHERE disabled_at IS NOT NULL",
		"CREATE INDEX users_password_reset_required_idx ON users (password_reset_required)",
		"WHERE password_reset_required = true",
		"CREATE VIEW admin_user_access AS",
		"organisation_memberships.id AS membership_id",
		"max(sessions.last_seen_at) AS last_seen_at",
		"sessions.expires_at > now()",
	}
	for _, value := range required {
		if !strings.Contains(migrationSQL, value) {
			t.Fatalf("expected auth lifecycle migration to contain %q", value)
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

func insertLocalSeedCompatibilityReport(
	t *testing.T,
	ctx context.Context,
	store Store,
	reporterID int64,
) int64 {
	t.Helper()

	var reportID int64
	if err := store.pool.QueryRow(ctx, `
INSERT INTO reports (
    clinic_id,
    reporter_name,
    source,
    submitted_at,
    status,
    reason,
    submitted_by_user_id,
    review_state
)
VALUES (
    'clinic-legacy-seed',
    'Legacy Reporter',
    'field_worker',
    now(),
    'degraded',
    'Legacy seed compatibility report.',
    $1,
    'accepted'
)
RETURNING id`, reporterID).Scan(&reportID); err != nil {
		t.Fatalf("insert local seed compatibility report: %v", err)
	}

	return reportID
}

func insertLocalSeedCompatibilityEvidence(
	t *testing.T,
	ctx context.Context,
	store Store,
	currentOrgID int64,
	legacyOrgID int64,
	reviewerID int64,
	reporterID int64,
	reportID int64,
) int64 {
	t.Helper()

	if _, err := store.pool.Exec(ctx, `
INSERT INTO organisation_memberships (organisation_id, user_id, role, district)
VALUES ($1, $2, 'district_manager', 'Tshwane North Demo District')`, legacyOrgID, reporterID); err != nil {
		t.Fatalf("insert legacy membership evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO report_reviews (report_id, reviewer_user_id, organisation_id, decision, notes)
VALUES ($1, $2, $3, 'accepted', 'Legacy review evidence.')`, reportID, reviewerID, legacyOrgID); err != nil {
		t.Fatalf("insert legacy review evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO audit_events (
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
    actor_user_id,
    actor_role,
    organisation_id,
    entity_type,
    entity_id
)
VALUES (
    'legacy-audit-seed-compat',
    'clinic-legacy-seed',
    'Legacy Reviewer',
    'report.reviewed',
    'Legacy audit evidence.',
    $1,
    'org_admin',
    $2,
    'report',
    $3
)`, reviewerID, legacyOrgID, strconv.FormatInt(reportID, 10)); err != nil {
		t.Fatalf("insert legacy audit evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO report_sync_attempts (
    external_id,
    report_id,
    submitted_by_user_id,
    organisation_id,
    clinic_id,
    result,
    submitted_at
)
VALUES (
    'legacy-sync-seed-compat',
    $1,
    $2,
    $3,
    'clinic-legacy-seed',
    'created',
    now()
)`, reportID, reporterID, legacyOrgID); err != nil {
		t.Fatalf("insert legacy sync evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO pilot_ingestion_runs (
    id,
    organisation_id,
    source_name,
    source_reference,
    status,
    records_received,
    records_imported
)
VALUES (
    'legacy-ingestion-seed-compat',
    $1,
    'Legacy import',
    'legacy-import-ref',
    'succeeded',
    1,
    1
)`, legacyOrgID); err != nil {
		t.Fatalf("insert legacy ingestion evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO partner_api_keys (
    organisation_id,
    name,
    environment,
    key_prefix,
    key_hash,
    scopes,
    allowed_districts
)
VALUES (
    $1,
    'Legacy API key',
    'demo',
    'cp_legacy',
    'sha256:legacy-seed-compat',
    '["clinics:read"]'::jsonb,
    '["Tshwane North Demo District"]'::jsonb
)`, legacyOrgID); err != nil {
		t.Fatalf("insert legacy API key evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO partner_webhook_subscriptions (
    organisation_id,
    name,
    target_url,
    event_types,
    secret_hash,
    status
)
VALUES (
    $1,
    'Legacy webhook',
    'https://example.test/webhook',
    '["clinic.status"]'::jsonb,
    'sha256:legacy-webhook',
    'active'
)`, legacyOrgID); err != nil {
		t.Fatalf("insert legacy webhook subscription evidence: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO partner_export_runs (
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload
)
VALUES (
    $1,
    $2,
    'json',
    '{"district":"Tshwane North Demo District"}'::jsonb,
    '{"clinics":1}'::jsonb,
    'sha256:legacy-export-seed-compat',
    '{"containsPatientData":false}'::jsonb
)`, legacyOrgID, reviewerID); err != nil {
		t.Fatalf("insert legacy export evidence: %v", err)
	}

	if currentOrgID == legacyOrgID {
		if _, err := store.pool.Exec(ctx, `
INSERT INTO integration_status_checks (organisation_id, check_name, status, summary)
VALUES ($1, 'shared-check', 'attention', 'Legacy shared check.'),
       ($1, 'legacy-only-check', 'attention', 'Legacy-only check.')`, legacyOrgID); err != nil {
			t.Fatalf("insert legacy-only integration check evidence: %v", err)
		}
	} else if _, err := store.pool.Exec(ctx, `
INSERT INTO integration_status_checks (organisation_id, check_name, status, summary)
VALUES ($1, 'shared-check', 'passing', 'Current duplicate check.'),
       ($2, 'shared-check', 'attention', 'Legacy duplicate check.'),
       ($2, 'legacy-only-check', 'attention', 'Legacy-only check.')`, currentOrgID, legacyOrgID); err != nil {
		t.Fatalf("insert legacy integration check evidence: %v", err)
	}

	var subscriptionID int64
	if err := store.pool.QueryRow(ctx, `
SELECT id
FROM partner_webhook_subscriptions
WHERE organisation_id = $1
    AND name = 'Legacy webhook'`, legacyOrgID).Scan(&subscriptionID); err != nil {
		t.Fatalf("select legacy webhook subscription: %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO partner_webhook_events (
    subscription_id,
    event_type,
    payload,
    metadata,
    status
)
VALUES (
    $1,
    'clinic.status',
    '{"clinicId":"clinic-legacy-seed"}'::jsonb,
    '{}'::jsonb,
    'delivered'
)`, subscriptionID); err != nil {
		t.Fatalf("insert legacy webhook event: %v", err)
	}

	return subscriptionID
}

func runLocalAuthSeed(t *testing.T, ctx context.Context, store Store) {
	t.Helper()

	seedSQL := readSeedFile(t, "local_phase3_auth_users.sql")
	if _, err := store.pool.Exec(ctx, seedSQL); err != nil {
		t.Fatalf("run local auth seed: %v", err)
	}
}

func assertOrgScopedCount(
	t *testing.T,
	ctx context.Context,
	store Store,
	table string,
	orgID int64,
	want int,
) {
	t.Helper()

	switch table {
	case "organisation_memberships",
		"report_reviews",
		"audit_events",
		"report_sync_attempts",
		"pilot_ingestion_runs",
		"partner_api_keys",
		"partner_webhook_subscriptions",
		"partner_export_runs",
		"integration_status_checks":
	default:
		t.Fatalf("unexpected org-scoped table %q", table)
	}

	var got int
	if err := store.pool.QueryRow(ctx, `
SELECT count(*)
FROM `+table+`
WHERE organisation_id = $1`, orgID).Scan(&got); err != nil {
		t.Fatalf("count %s rows for org %d: %v", table, orgID, err)
	}
	if got != want {
		t.Fatalf("expected %s rows for org %d = %d, got %d", table, orgID, want, got)
	}
}

func assertNoLegacyDistrictValue(
	t *testing.T,
	ctx context.Context,
	store Store,
	table string,
	columnExpression string,
) {
	t.Helper()

	switch table {
	case "organisation_memberships", "partner_api_keys", "partner_export_runs":
	default:
		t.Fatalf("unexpected legacy district table %q", table)
	}

	var got int
	if err := store.pool.QueryRow(ctx, `
SELECT count(*)
FROM `+table+`
WHERE `+columnExpression+` LIKE '%Tshwane North Demo District%'`).Scan(&got); err != nil {
		t.Fatalf("count legacy district values in %s.%s: %v", table, columnExpression, err)
	}
	if got != 0 {
		t.Fatalf("expected no legacy district values in %s.%s, got %d", table, columnExpression, got)
	}
}

func TestPilotDataIntegrityMigrationAddsIngestionRuns(t *testing.T) {
	t.Parallel()

	migrationSQL := readMigrationFile(t, "0010_pilot_data_integrity.sql")
	required := []string{
		"CREATE TABLE IF NOT EXISTS pilot_ingestion_runs",
		"organisation_id BIGINT NOT NULL REFERENCES organisations(id)",
		"source_name TEXT NOT NULL",
		"source_reference TEXT NOT NULL",
		"status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'partial'))",
		"validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb",
		"pilot_ingestion_runs_org_started_idx",
	}
	for _, value := range required {
		if !strings.Contains(migrationSQL, value) {
			t.Fatalf("expected pilot data integrity migration to contain %q", value)
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
