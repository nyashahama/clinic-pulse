package service

import (
	"encoding/json"
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
