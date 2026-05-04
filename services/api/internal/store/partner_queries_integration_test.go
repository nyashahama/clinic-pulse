package store

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

func TestPartnerReadinessStoreIntegration(t *testing.T) {
	databaseURL := getenvIntegrationDatabaseURL(t)
	ctx := context.Background()
	store := newIntegrationStore(t, ctx, databaseURL)

	orgID := insertIntegrationOrganisation(t, ctx, store, "Partner District", "partner-district")
	userID := insertIntegrationUser(t, ctx, store, "partner-admin@example.test", "Partner Admin", nil, nil)
	expiresAt := time.Date(2026, 6, 4, 0, 0, 0, 0, time.UTC)
	createdAt := time.Date(2026, 5, 4, 8, 0, 0, 0, time.UTC)

	apiKey, err := store.CreatePartnerAPIKey(ctx, CreatePartnerAPIKeyInput{
		OrganisationID:   &orgID,
		Name:             "HealthBridge demo",
		Environment:      "demo",
		KeyPrefix:        "cp_demo_ab12",
		KeyHash:          "hash-healthbridge-demo",
		Scopes:           []string{"clinics:read", "status:read"},
		AllowedDistricts: []string{"Tshwane North Demo District"},
		ExpiresAt:        &expiresAt,
		CreatedByUserID:  &userID,
		CreatedAt:        createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerAPIKey returned error: %v", err)
	}
	if apiKey.ID == 0 || apiKey.KeyHash != "hash-healthbridge-demo" || apiKey.Scopes[0] != "clinics:read" {
		t.Fatalf("unexpected API key: %+v", apiKey)
	}

	loaded, err := store.GetPartnerAPIKeyByHash(ctx, "hash-healthbridge-demo")
	if err != nil {
		t.Fatalf("GetPartnerAPIKeyByHash returned error: %v", err)
	}
	if loaded.ID != apiKey.ID || loaded.AllowedDistricts[0] != "Tshwane North Demo District" {
		t.Fatalf("unexpected loaded key: %+v", loaded)
	}

	if err := store.TouchPartnerAPIKey(ctx, apiKey.ID, "127.0.0.1", createdAt.Add(time.Minute)); err != nil {
		t.Fatalf("TouchPartnerAPIKey returned error: %v", err)
	}
	touched, err := store.GetPartnerAPIKeyByHash(ctx, "hash-healthbridge-demo")
	if err != nil {
		t.Fatalf("GetPartnerAPIKeyByHash touched returned error: %v", err)
	}
	if touched.LastUsedAt == nil || !touched.LastUsedAt.Equal(createdAt.Add(time.Minute)) {
		t.Fatalf("expected last used timestamp, got %+v", touched.LastUsedAt)
	}
	if err := store.TouchPartnerAPIKey(ctx, 999999, "127.0.0.1", createdAt.Add(time.Minute)); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected missing key touch to return pgx.ErrNoRows, got %v", err)
	}

	if err := store.RevokePartnerAPIKey(ctx, apiKey.ID, createdAt.Add(2*time.Minute)); err != nil {
		t.Fatalf("RevokePartnerAPIKey returned error: %v", err)
	}
	revoked, err := store.GetPartnerAPIKeyByHash(ctx, "hash-healthbridge-demo")
	if err != nil {
		t.Fatalf("GetPartnerAPIKeyByHash revoked returned error: %v", err)
	}
	if revoked.RevokedAt == nil {
		t.Fatalf("expected revoked timestamp, got %+v", revoked)
	}
	if err := store.TouchPartnerAPIKey(ctx, apiKey.ID, "127.0.0.1", createdAt.Add(3*time.Minute)); !errors.Is(err, ErrPartnerAPIKeyRevoked) {
		t.Fatalf("expected revoked key touch to return ErrPartnerAPIKeyRevoked, got %v", err)
	}
	if err := store.RevokePartnerAPIKey(ctx, apiKey.ID, createdAt.Add(3*time.Minute)); !errors.Is(err, ErrPartnerAPIKeyRevoked) {
		t.Fatalf("expected revoked key revoke to return ErrPartnerAPIKeyRevoked, got %v", err)
	}
	if err := store.RevokePartnerAPIKey(ctx, 999999, createdAt.Add(3*time.Minute)); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected missing key revoke to return pgx.ErrNoRows, got %v", err)
	}

	expiredAt := createdAt.Add(time.Hour)
	expiredKey, err := store.CreatePartnerAPIKey(ctx, CreatePartnerAPIKeyInput{
		OrganisationID:  &orgID,
		Name:            "Expired partner key",
		Environment:     "demo",
		KeyPrefix:       "cp_demo_expired",
		KeyHash:         "hash-expired-demo",
		Scopes:          []string{"clinics:read"},
		ExpiresAt:       &expiredAt,
		CreatedByUserID: &userID,
		CreatedAt:       createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerAPIKey expired returned error: %v", err)
	}
	if err := store.TouchPartnerAPIKey(ctx, expiredKey.ID, "", expiredAt.Add(time.Minute)); !errors.Is(err, ErrPartnerAPIKeyExpired) {
		t.Fatalf("expected expired key touch to return ErrPartnerAPIKeyExpired, got %v", err)
	}

	trimmedKey, err := store.CreatePartnerAPIKey(ctx, CreatePartnerAPIKeyInput{
		OrganisationID:  &orgID,
		Name:            "Trimmed scopes key",
		Environment:     "demo",
		KeyPrefix:       "cp_demo_trim",
		KeyHash:         "hash-trimmed-demo",
		Scopes:          []string{" clinics:read ", "exports:read"},
		CreatedByUserID: &userID,
		CreatedAt:       createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerAPIKey trimmed scopes returned error: %v", err)
	}
	if trimmedKey.Scopes[0] != "clinics:read" {
		t.Fatalf("expected trimmed scope, got %+v", trimmedKey.Scopes)
	}
	if _, err := store.CreatePartnerAPIKey(ctx, CreatePartnerAPIKeyInput{
		OrganisationID: &orgID,
		Name:           "Unknown scope key",
		Environment:    "demo",
		KeyPrefix:      "cp_demo_unknown",
		KeyHash:        "hash-unknown-scope-demo",
		Scopes:         []string{"unknown:read"},
		CreatedAt:      createdAt,
	}); !errors.Is(err, ErrInvalidPartnerScope) {
		t.Fatalf("expected unknown scope to return ErrInvalidPartnerScope, got %v", err)
	}

	subscription, err := store.CreatePartnerWebhookSubscription(ctx, CreatePartnerWebhookSubscriptionInput{
		OrganisationID:  &orgID,
		Name:            "Status webhook",
		TargetURL:       "https://partner.example.test/webhooks/clinicpulse",
		EventTypes:      []string{"clinic.status_changed"},
		SecretHash:      "webhook-secret-hash",
		Status:          "active",
		CreatedByUserID: &userID,
		CreatedAt:       createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerWebhookSubscription returned error: %v", err)
	}
	event, err := store.CreatePartnerWebhookEvent(ctx, CreatePartnerWebhookEventInput{
		SubscriptionID: subscription.ID,
		EventType:      "clinic.status_changed",
		Payload:        map[string]any{"clinicId": "clinic-mamelodi-east"},
		Status:         "preview_only",
		CreatedAt:      createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerWebhookEvent returned error: %v", err)
	}
	if event.SubscriptionID != subscription.ID || event.Payload["clinicId"] != "clinic-mamelodi-east" {
		t.Fatalf("unexpected webhook event: %+v", event)
	}
	nilMapEvent, err := store.CreatePartnerWebhookEvent(ctx, CreatePartnerWebhookEventInput{
		SubscriptionID: subscription.ID,
		EventType:      "clinic.status_changed",
		Status:         "preview_only",
		CreatedAt:      createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerWebhookEvent nil maps returned error: %v", err)
	}
	if nilMapEvent.Payload == nil || len(nilMapEvent.Payload) != 0 || nilMapEvent.Metadata == nil || len(nilMapEvent.Metadata) != 0 {
		t.Fatalf("expected webhook event nil maps to default empty, got %+v", nilMapEvent)
	}

	exportRun, err := store.CreatePartnerExportRun(ctx, CreatePartnerExportRunInput{
		OrganisationID:    &orgID,
		RequestedByUserID: &userID,
		Format:            "json",
		Scope:             map[string]any{"district": "Tshwane North Demo District"},
		RecordCounts:      map[string]any{"clinics": float64(1)},
		Checksum:          "sha256:abc123",
		Payload:           map[string]any{"generatedAt": createdAt.Format(time.RFC3339)},
		CreatedAt:         createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerExportRun returned error: %v", err)
	}
	if exportRun.ID == 0 || exportRun.RecordCounts["clinics"] != float64(1) {
		t.Fatalf("unexpected export run: %+v", exportRun)
	}
	nilMapExportRun, err := store.CreatePartnerExportRun(ctx, CreatePartnerExportRunInput{
		OrganisationID: &orgID,
		Format:         "csv",
		Checksum:       "sha256:def456",
		CreatedAt:      createdAt,
	})
	if err != nil {
		t.Fatalf("CreatePartnerExportRun nil maps returned error: %v", err)
	}
	if nilMapExportRun.Scope == nil || len(nilMapExportRun.Scope) != 0 ||
		nilMapExportRun.RecordCounts == nil || len(nilMapExportRun.RecordCounts) != 0 ||
		nilMapExportRun.Payload == nil || len(nilMapExportRun.Payload) != 0 {
		t.Fatalf("expected export nil maps to default empty, got %+v", nilMapExportRun)
	}
	otherOrgID := insertIntegrationOrganisation(t, ctx, store, "Other Partner District", "other-partner-district")
	if _, err := store.GetPartnerExportRunForOrganisation(ctx, &otherOrgID, exportRun.ID); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected wrong-org export lookup to return pgx.ErrNoRows, got %v", err)
	}
	if scopedExportRun, err := store.GetPartnerExportRunForOrganisation(ctx, &orgID, exportRun.ID); err != nil || scopedExportRun.ID != exportRun.ID {
		t.Fatalf("expected scoped export lookup to return export %d, got %+v err %v", exportRun.ID, scopedExportRun, err)
	}

	check, err := store.UpsertIntegrationStatusCheck(ctx, UpsertIntegrationStatusCheckInput{
		OrganisationID: &orgID,
		CheckName:      "api_key_active",
		Status:         "passing",
		Summary:        "A demo partner key is active.",
		Metadata:       map[string]any{"keyPrefix": "cp_demo_ab12"},
		CheckedAt:      createdAt,
	})
	if err != nil {
		t.Fatalf("UpsertIntegrationStatusCheck returned error: %v", err)
	}
	if check.CheckName != "api_key_active" || check.Status != "passing" {
		t.Fatalf("unexpected status check: %+v", check)
	}

	snapshot, err := store.GetPartnerReadinessSnapshot(ctx, &orgID)
	if err != nil {
		t.Fatalf("GetPartnerReadinessSnapshot returned error: %v", err)
	}
	if len(snapshot.APIKeys) != 3 ||
		len(snapshot.WebhookSubscriptions) != 1 ||
		len(snapshot.WebhookEvents) != 2 ||
		len(snapshot.ExportRuns) != 2 ||
		len(snapshot.IntegrationChecks) != 1 {
		t.Fatalf("unexpected readiness snapshot: %+v", snapshot)
	}

	emptyOrgID := insertIntegrationOrganisation(t, ctx, store, "Empty Partner District", "empty-partner-district")
	emptySnapshot, err := store.GetPartnerReadinessSnapshot(ctx, &emptyOrgID)
	if err != nil {
		t.Fatalf("GetPartnerReadinessSnapshot empty returned error: %v", err)
	}
	if emptySnapshot.APIKeys == nil ||
		emptySnapshot.WebhookSubscriptions == nil ||
		emptySnapshot.WebhookEvents == nil ||
		emptySnapshot.ExportRuns == nil ||
		emptySnapshot.IntegrationChecks == nil {
		t.Fatalf("expected empty readiness snapshot slices to be non-nil, got %+v", emptySnapshot)
	}
}

func getenvIntegrationDatabaseURL(t *testing.T) string {
	t.Helper()

	databaseURL := os.Getenv("AUTH_STORE_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set AUTH_STORE_TEST_DATABASE_URL to run partner readiness store integration tests")
	}
	return databaseURL
}
