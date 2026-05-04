package service

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"testing"
	"time"

	"clinicpulse/services/api/internal/store"
)

func TestPartnerSafeClinicDetailRemovesPrivateStatusFields(t *testing.T) {
	reporter := "Nomsa Dlamini"
	source := "field_worker"
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)

	payload := PartnerSafeClinicDetail(store.ClinicDetail{
		Clinic: store.Clinic{
			ID: "clinic-1", Name: "Central Clinic", District: "Tshwane North Demo District",
			Province: "Gauteng", FacilityCode: "C001", FacilityType: "clinic",
			VerificationStatus: "verified", CreatedAt: now, UpdatedAt: now,
		},
		CurrentStatus: &store.CurrentStatus{
			ClinicID: "clinic-1", Status: "degraded", Freshness: "fresh",
			ReporterName: &reporter, Source: &source, UpdatedAt: now,
		},
	})

	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal partner payload: %v", err)
	}
	body := string(encoded)
	if strings.Contains(body, "Nomsa") || strings.Contains(body, "reporterName") {
		t.Fatalf("expected reporter identity to be hidden, got %s", body)
	}
	if !strings.Contains(body, `"sourceCategory":"field_worker"`) {
		t.Fatalf("expected source category, got %s", body)
	}
}

func TestPartnerScopeAllowsClinicDistrict(t *testing.T) {
	if !PartnerScopeAllowsDistrict([]string{"Tshwane North Demo District"}, "Tshwane North Demo District") {
		t.Fatal("expected matching district to be allowed")
	}
	if PartnerScopeAllowsDistrict([]string{"Tshwane North Demo District"}, "Johannesburg") {
		t.Fatal("expected different district to be denied")
	}
	if !PartnerScopeAllowsDistrict(nil, "Johannesburg") {
		t.Fatal("expected empty district list to allow all districts for system-level keys")
	}
}

func TestPartnerSafeExportRunRemovesInternalFieldsAndPayload(t *testing.T) {
	userID := int64(42)
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)

	payload := PartnerSafeExportRun(store.PartnerExportRun{
		ID:                20,
		RequestedByUserID: &userID,
		Format:            "json",
		Scope:             map[string]any{"district": "Tshwane North Demo District", "secret": "raw-scope-secret"},
		RecordCounts:      map[string]any{"clinics": 3},
		Checksum:          "sha256:abc",
		Payload:           map[string]any{"rawSecret": "export-payload-secret"},
		CreatedAt:         now,
	})

	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal partner export payload: %v", err)
	}
	body := string(encoded)
	for _, forbidden := range []string{"requestedByUserId", "payload", "raw-scope-secret", "export-payload-secret"} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("expected partner export response to hide %q, got %s", forbidden, body)
		}
	}
	if !strings.Contains(body, `"recordCounts":{"clinics":3}`) {
		t.Fatalf("expected record counts in partner export response, got %s", body)
	}
}

func TestPartnerSafeIntegrationStatusChecksRemoveMetadataAndInternalIDs(t *testing.T) {
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)

	payload := PartnerSafeIntegrationStatusChecks([]store.IntegrationStatusCheck{{
		ID:        30,
		CheckName: "webhook_delivery",
		Status:    "passing",
		Summary:   "Webhooks are healthy",
		Metadata:  map[string]any{"rawSecret": "integration-secret-token"},
		CheckedAt: now,
	}})

	encoded, err := json.Marshal(payload)
	if err != nil {
		t.Fatalf("marshal partner integration payload: %v", err)
	}
	body := string(encoded)
	for _, forbidden := range []string{"\"id\"", "metadata", "integration-secret-token"} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("expected partner integration response to hide %q, got %s", forbidden, body)
		}
	}
	if !strings.Contains(body, `"checkName":"webhook_delivery"`) {
		t.Fatalf("expected check name in partner integration response, got %s", body)
	}
}

func TestBuildPartnerExportPayloadBuildsSafePayloadAndChecksum(t *testing.T) {
	orgID := int64(77)
	reporter := "Nomsa Dlamini"
	source := "field_worker"
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	reader := &partnerExportPayloadStore{
		clinics: []store.ClinicDetail{
			{
				Clinic: store.Clinic{
					ID:       "clinic-1",
					Name:     "Central Clinic",
					District: "Tshwane North Demo District",
				},
				CurrentStatus: &store.CurrentStatus{
					ClinicID:     "clinic-1",
					Status:       "operational",
					Freshness:    "fresh",
					ReporterName: &reporter,
					Source:       &source,
					UpdatedAt:    now,
				},
			},
			{
				Clinic: store.Clinic{
					ID:       "clinic-2",
					Name:     "Other Clinic",
					District: "Johannesburg",
				},
			},
		},
		integrationStatusChecks: []store.IntegrationStatusCheck{{
			ID:        30,
			CheckName: "webhook_delivery",
			Status:    "passing",
			Summary:   "Webhooks are healthy",
			Metadata:  map[string]any{"secret": "internal-secret"},
			CheckedAt: now,
		}},
	}

	payload, err := BuildPartnerExportPayload(context.Background(), reader, PartnerExportPayloadInput{
		OrganisationID: &orgID,
		Format:         "json",
		Scope:          map[string]any{"district": "Tshwane North Demo District"},
		GeneratedAt:    now,
	})
	if err != nil {
		t.Fatalf("BuildPartnerExportPayload returned error: %v", err)
	}

	if reader.orgID == nil || *reader.orgID != orgID {
		t.Fatalf("expected integration checks to be scoped to org %d, got %#v", orgID, reader.orgID)
	}
	if payload.RecordCounts["clinics"] != 1 || payload.RecordCounts["integrationChecks"] != 1 {
		t.Fatalf("unexpected record counts: %#v", payload.RecordCounts)
	}
	if !strings.HasPrefix(payload.Checksum, "sha256:") {
		t.Fatalf("expected sha256 checksum, got %q", payload.Checksum)
	}

	encoded, err := json.Marshal(payload.Payload)
	if err != nil {
		t.Fatalf("marshal export payload: %v", err)
	}
	body := string(encoded)
	for _, forbidden := range []string{"clinic-2", "reporterName", "Nomsa", `"source"`, "metadata", "internal-secret"} {
		if strings.Contains(body, forbidden) {
			t.Fatalf("expected export payload to hide/filter %q, got %s", forbidden, body)
		}
	}
	if !strings.Contains(body, `"sourceCategory":"field_worker"`) || !strings.Contains(body, `"checkName":"webhook_delivery"`) {
		t.Fatalf("expected safe clinic and integration fields, got %s", body)
	}
}

func TestBuildPartnerExportPayloadCountsClinicsAndStatuses(t *testing.T) {
	now := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	reader := &partnerExportPayloadStore{
		clinics: []store.ClinicDetail{
			{
				Clinic: store.Clinic{
					ID:       "clinic-1",
					Name:     "Central Clinic",
					District: "Tshwane North Demo District",
				},
				CurrentStatus: &store.CurrentStatus{
					ClinicID:  "clinic-1",
					Status:    "operational",
					Freshness: "fresh",
					UpdatedAt: now,
				},
			},
			{
				Clinic: store.Clinic{
					ID:       "clinic-2",
					Name:     "Mamelodi Clinic",
					District: "Tshwane North Demo District",
				},
			},
		},
		integrationStatusChecks: []store.IntegrationStatusCheck{
			{CheckName: "api_key_active", Status: "passing", CheckedAt: now},
			{CheckName: "export_generated", Status: "passing", CheckedAt: now},
		},
	}

	payload, err := BuildPartnerExportPayload(context.Background(), reader, PartnerExportPayloadInput{
		Format:      "json",
		GeneratedAt: now,
	})
	if err != nil {
		t.Fatalf("BuildPartnerExportPayload returned error: %v", err)
	}

	if payload.RecordCounts["clinics"] != 2 {
		t.Fatalf("expected 2 clinic records, got %#v", payload.RecordCounts)
	}
	if payload.RecordCounts["statuses"] != 1 {
		t.Fatalf("expected 1 status record, got %#v", payload.RecordCounts)
	}
	if payload.RecordCounts["integrationChecks"] != 2 {
		t.Fatalf("expected 2 integration check records, got %#v", payload.RecordCounts)
	}
	if payload.Payload["generatedAt"] != now.Format(time.RFC3339) {
		t.Fatalf("expected generatedAt %s, got %#v", now.Format(time.RFC3339), payload.Payload["generatedAt"])
	}
	if !strings.HasPrefix(payload.Checksum, "sha256:") {
		t.Fatalf("expected sha256 checksum, got %q", payload.Checksum)
	}
}

func TestBuildPartnerExportPayloadRejectsUnsupportedFormat(t *testing.T) {
	_, err := BuildPartnerExportPayload(context.Background(), &partnerExportPayloadStore{}, PartnerExportPayloadInput{
		Format:      "xml",
		GeneratedAt: time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC),
	})
	var validationErr ValidationError
	if !errors.As(err, &validationErr) {
		t.Fatalf("expected ValidationError, got %v", err)
	}
	if len(validationErr.Fields) == 0 || !strings.Contains(validationErr.Fields[0], "format") {
		t.Fatalf("expected format validation field, got %#v", validationErr.Fields)
	}
}

func TestBuildIntegrationChecksBuildsRequiredChecks(t *testing.T) {
	orgID := int64(77)
	checkedAt := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	expectedNames := []string{
		"api_key_active",
		"export_generated",
		"webhook_test_recorded",
		"offline_sync_health_available",
		"stale_status_reconciliation_available",
		"deployment_env_configured",
	}

	checks := BuildIntegrationChecks(IntegrationCheckInput{
		OrganisationID:                     &orgID,
		APIKeyActive:                       true,
		ExportGenerated:                    true,
		WebhookTestRecorded:                true,
		OfflineSyncHealthAvailable:         true,
		StaleStatusReconciliationAvailable: true,
		DeploymentEnvironment:              "live",
		APIKeyPepper:                       "test-pepper",
		WebhookDeliveryEnabled:             true,
		CheckedAt:                          checkedAt,
	})

	if len(checks) != 6 {
		t.Fatalf("expected 6 integration checks, got %#v", checks)
	}
	byName := map[string]int{}
	for _, check := range checks {
		byName[check.CheckName]++
		if check.OrganisationID == nil || *check.OrganisationID != orgID {
			t.Fatalf("expected check scoped to org %d, got %#v", orgID, check)
		}
		if check.Status != "passing" {
			t.Fatalf("expected check %s to pass, got %#v", check.CheckName, check)
		}
		if check.Summary == "" {
			t.Fatalf("expected check %s to include summary", check.CheckName)
		}
		if len(check.Metadata) != 0 {
			t.Fatalf("expected empty metadata for check %s, got %#v", check.CheckName, check.Metadata)
		}
		if !check.CheckedAt.Equal(checkedAt) {
			t.Fatalf("expected checkedAt %s, got %s", checkedAt, check.CheckedAt)
		}
	}
	for _, name := range expectedNames {
		if byName[name] != 1 {
			t.Fatalf("expected required check %q exactly once, got counts %#v", name, byName)
		}
	}
	if len(byName) != len(expectedNames) {
		t.Fatalf("expected only required check names, got counts %#v", byName)
	}
}

func TestBuildIntegrationChecksFlagsMissingPepperForLiveReadiness(t *testing.T) {
	checkedAt := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)

	checks := BuildIntegrationChecks(IntegrationCheckInput{
		APIKeyActive:                       true,
		ExportGenerated:                    true,
		WebhookTestRecorded:                true,
		OfflineSyncHealthAvailable:         true,
		StaleStatusReconciliationAvailable: true,
		DeploymentEnvironment:              "live",
		WebhookDeliveryEnabled:             true,
		CheckedAt:                          checkedAt,
	})

	byName := map[string]store.UpsertIntegrationStatusCheckInput{}
	for _, check := range checks {
		byName[check.CheckName] = check
	}
	if byName["deployment_env_configured"].Status != "attention" {
		t.Fatalf("expected missing live pepper to need attention, got %#v", byName["deployment_env_configured"])
	}
	if !strings.Contains(byName["deployment_env_configured"].Summary, "API key pepper") {
		t.Fatalf("expected deployment summary to mention API key pepper, got %#v", byName["deployment_env_configured"])
	}
	if byName["api_key_active"].Status != "passing" {
		t.Fatalf("expected unrelated passing check to remain passing, got %#v", byName["api_key_active"])
	}
	if !byName["deployment_env_configured"].CheckedAt.Equal(checkedAt) {
		t.Fatalf("expected checkedAt %s, got %s", checkedAt, byName["deployment_env_configured"].CheckedAt)
	}
}

func TestBuildIntegrationChecksMapsMissingRequirementsToAttention(t *testing.T) {
	checkedAt := time.Date(2026, 5, 4, 9, 0, 0, 0, time.UTC)
	baseInput := IntegrationCheckInput{
		APIKeyActive:                       true,
		ExportGenerated:                    true,
		WebhookTestRecorded:                true,
		OfflineSyncHealthAvailable:         true,
		StaleStatusReconciliationAvailable: true,
		DeploymentEnvironment:              "live",
		APIKeyPepper:                       "test-pepper",
		WebhookDeliveryEnabled:             true,
		CheckedAt:                          checkedAt,
	}

	tests := []struct {
		name      string
		mutate    func(*IntegrationCheckInput)
		checkName string
	}{
		{
			name: "api key active",
			mutate: func(input *IntegrationCheckInput) {
				input.APIKeyActive = false
			},
			checkName: "api_key_active",
		},
		{
			name: "export generated",
			mutate: func(input *IntegrationCheckInput) {
				input.ExportGenerated = false
			},
			checkName: "export_generated",
		},
		{
			name: "webhook test recorded",
			mutate: func(input *IntegrationCheckInput) {
				input.WebhookTestRecorded = false
			},
			checkName: "webhook_test_recorded",
		},
		{
			name: "offline sync health available",
			mutate: func(input *IntegrationCheckInput) {
				input.OfflineSyncHealthAvailable = false
			},
			checkName: "offline_sync_health_available",
		},
		{
			name: "stale status reconciliation available",
			mutate: func(input *IntegrationCheckInput) {
				input.StaleStatusReconciliationAvailable = false
			},
			checkName: "stale_status_reconciliation_available",
		},
		{
			name: "webhook delivery enabled",
			mutate: func(input *IntegrationCheckInput) {
				input.WebhookDeliveryEnabled = false
			},
			checkName: "deployment_env_configured",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			input := baseInput
			tt.mutate(&input)
			checks := BuildIntegrationChecks(input)

			byName := map[string]store.UpsertIntegrationStatusCheckInput{}
			for _, check := range checks {
				byName[check.CheckName] = check
			}

			if byName[tt.checkName].Status != "attention" {
				t.Fatalf("expected %s to need attention, got %#v", tt.checkName, byName[tt.checkName])
			}
		})
	}
}

type partnerExportPayloadStore struct {
	clinics                 []store.ClinicDetail
	integrationStatusChecks []store.IntegrationStatusCheck
	orgID                   *int64
	listErr                 error
	checksErr               error
}

func (s *partnerExportPayloadStore) ListClinics(context.Context) ([]store.ClinicDetail, error) {
	return s.clinics, s.listErr
}

func (s *partnerExportPayloadStore) ListIntegrationStatusChecks(_ context.Context, orgID *int64) ([]store.IntegrationStatusCheck, error) {
	if orgID != nil {
		value := *orgID
		s.orgID = &value
	}
	return s.integrationStatusChecks, s.checksErr
}
