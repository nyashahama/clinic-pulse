package store

import (
	"context"
	"os"
	"testing"
	"time"
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
	if len(snapshot.APIKeys) != 1 ||
		len(snapshot.WebhookSubscriptions) != 1 ||
		len(snapshot.WebhookEvents) != 1 ||
		len(snapshot.ExportRuns) != 1 ||
		len(snapshot.IntegrationChecks) != 1 {
		t.Fatalf("unexpected readiness snapshot: %+v", snapshot)
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
