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
