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
