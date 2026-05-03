package service_test

import (
	"encoding/json"
	"strings"
	"testing"

	"clinicpulse/services/api/internal/service"
	"clinicpulse/services/api/internal/store"
)

func TestRankAlternativesFiltersSourceAndRequestedService(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "operational", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		source,
		clinicDetail("has-service", "Has Service Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care"),
		clinicDetail("wrong-service", "Wrong Service Clinic", -25.7420, 28.1320, "operational", "fresh", "Pharmacy"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	if len(got) != 1 || got[0].Clinic.Clinic.ID != "has-service" {
		t.Fatalf("expected only candidate with requested service, got %v", gotIDs(got))
	}
}

func TestRankAlternativesRanksOperationalFreshBeforeDegraded(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		clinicDetail("near-degraded", "Near Degraded Clinic", -25.7405, 28.1305, "degraded", "fresh", "Primary care"),
		clinicDetail("far-operational", "Far Operational Clinic", -25.7900, 28.1800, "operational", "fresh", "Primary care"),
		clinicDetail("operational-needs-confirmation", "Needs Confirmation Clinic", -25.7410, 28.1310, "operational", "needs_confirmation", "Primary care"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"far-operational", "operational-needs-confirmation", "near-degraded"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected ids %v, got %v", want, ids)
	}
}

func TestRankAlternativesBreaksRankTiesByDistance(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		clinicDetail("far", "Far Clinic", -25.7900, 28.1800, "operational", "fresh", "Primary care"),
		clinicDetail("near", "Near Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"near", "far"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected ids %v, got %v", want, ids)
	}
	if got[0].DistanceKm == nil || got[1].DistanceKm == nil {
		t.Fatalf("expected known distances, got %v then %v", got[0].DistanceKm, got[1].DistanceKm)
	}
	if !(*got[0].DistanceKm < *got[1].DistanceKm) {
		t.Fatalf("expected distance tie-breaker to sort ascending, got %.3f then %.3f", *got[0].DistanceKm, *got[1].DistanceKm)
	}
}

func TestRankAlternativesExcludesUnsafeClinicsWhenSaferClinicsExist(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		clinicDetail("unknown", "Unknown Clinic", -25.7405, 28.1305, "unknown", "fresh", "Primary care"),
		clinicDetail("non-functional", "Non Functional Clinic", -25.7410, 28.1310, "non_functional", "fresh", "Primary care"),
		clinicDetail("safe", "Safe Clinic", -25.7900, 28.1800, "degraded", "fresh", "Primary care"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"safe"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected ids %v, got %v", want, ids)
	}
}

func TestRankAlternativesPrefersAvailableRequestedService(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		clinicDetailWithAvailability("unknown-service", "Unknown Service Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary   care", "unknown"),
		clinicDetailWithAvailability("unavailable-service", "Unavailable Service Clinic", -25.7420, 28.1320, "operational", "fresh", "Primary care", "unavailable"),
		clinicDetailWithAvailability("available-service", "Available Service Clinic", -25.7900, 28.1800, "degraded", "fresh", "Primary care", "available"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"available-service"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected only available service candidate %v, got %v", want, ids)
	}
	if got[0].MatchedService != "Primary care" {
		t.Fatalf("expected matched service Primary care, got %q", got[0].MatchedService)
	}
	if got[0].ReasonCode == "service_availability_fallback" {
		t.Fatalf("expected available service not to use fallback reason code, got %q", got[0].ReasonCode)
	}
}

func TestRankAlternativesFallsBackToUnavailableRequestedServiceWhenNoAvailableServiceExists(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		clinicDetailWithAvailability("unknown-service", "Unknown Service Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care", "unknown"),
		clinicDetailWithAvailability("unavailable-service", "Unavailable Service Clinic", -25.7500, 28.1400, "operational", "fresh", "Primary care", "unavailable"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"unknown-service", "unavailable-service"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected service availability fallback ids %v, got %v", want, ids)
	}
	for _, alternative := range got {
		if alternative.ReasonCode != "service_availability_fallback" {
			t.Fatalf("expected service availability fallback reason code, got %q", alternative.ReasonCode)
		}
		if strings.Contains(strings.ToLower(alternative.RankReason), "available") {
			t.Fatalf("expected fallback reason not to claim availability, got %q", alternative.RankReason)
		}
	}
}

func TestRankAlternativesPrioritizesSaferClinicOverUnsafeAvailableService(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	candidates := []store.ClinicDetail{
		clinicDetailWithAvailability("unsafe-available", "Unsafe Available Clinic", -25.7410, 28.1310, "non_functional", "fresh", "Primary care", "available"),
		clinicDetailWithAvailability("safe-unknown", "Safe Unknown Clinic", -25.7900, 28.1800, "operational", "fresh", "Primary care", "unknown"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"safe-unknown"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected safer service-availability fallback before unsafe available service %v, got %v", want, ids)
	}
	if got[0].ReasonCode != "service_availability_fallback" {
		t.Fatalf("expected service availability fallback reason code, got %q", got[0].ReasonCode)
	}
}

func TestRankAlternativesReturnsUnsafeFallbacksWhenNoSaferClinicsExist(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	missingStatus := clinicDetail("missing-status", "Missing Status Clinic", -25.7900, 28.1800, "operational", "fresh", "Primary care")
	missingStatus.CurrentStatus = nil
	candidates := []store.ClinicDetail{
		source,
		missingStatus,
		clinicDetail("non-functional", "Non Functional Clinic", -25.7600, 28.1600, "non_functional", "fresh", "Primary care"),
		clinicDetail("unknown", "Unknown Clinic", -25.7410, 28.1310, "unknown", "fresh", "Primary care"),
		clinicDetail("wrong-service", "Wrong Service Clinic", -25.7405, 28.1305, "unknown", "fresh", "Pharmacy"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"unknown", "non-functional", "missing-status"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected unsafe fallback ids %v, got %v", want, ids)
	}
}

func TestRankAlternativesDoesNotExposeHugeFakeDistanceForMissingCoordinates(t *testing.T) {
	source := clinicDetail("source", "Source Clinic", -25.7400, 28.1300, "non_functional", "fresh", "Primary care")
	missingDistance := clinicDetail("missing-distance", "Missing Distance Clinic", -25.7410, 28.1310, "operational", "fresh", "Primary care")
	missingDistance.Clinic.Latitude = nil
	candidates := []store.ClinicDetail{
		missingDistance,
		clinicDetail("known-distance", "Known Distance Clinic", -25.7900, 28.1800, "operational", "fresh", "Primary care"),
	}

	got := service.RankAlternatives(source, candidates, "Primary care")

	want := []string{"known-distance", "missing-distance"}
	if ids := gotIDs(got); !sameIDs(ids, want) {
		t.Fatalf("expected known distances before missing distances %v, got %v", want, ids)
	}
	if got[1].DistanceKm != nil {
		t.Fatalf("expected missing coordinate distance to be nil, got %v", *got[1].DistanceKm)
	}
	encoded, err := json.Marshal(got)
	if err != nil {
		t.Fatalf("failed to marshal alternatives: %v", err)
	}
	if strings.Contains(string(encoded), "999999") {
		t.Fatalf("expected missing coordinates not to expose fake huge distance, got %s", string(encoded))
	}
}

func clinicDetail(id, name string, latitude, longitude float64, status, freshness string, services ...string) store.ClinicDetail {
	return clinicDetailWithAvailability(id, name, latitude, longitude, status, freshness, services[0], "available", services[1:]...)
}

func clinicDetailWithAvailability(id, name string, latitude, longitude float64, status, freshness, serviceName, availability string, services ...string) store.ClinicDetail {
	detail := store.ClinicDetail{
		Clinic: store.Clinic{
			ID:                 id,
			Name:               name,
			Latitude:           &latitude,
			Longitude:          &longitude,
			FacilityType:       "clinic",
			VerificationStatus: "verified",
		},
		CurrentStatus: &store.CurrentStatus{
			ClinicID:  id,
			Status:    status,
			Freshness: freshness,
		},
	}

	allServices := append([]string{serviceName}, services...)
	for _, serviceName := range allServices {
		detail.Services = append(detail.Services, store.ClinicService{
			ClinicID:            id,
			ServiceName:         serviceName,
			CurrentAvailability: availability,
		})
	}

	return detail
}

func gotIDs(alternatives []service.Alternative) []string {
	ids := make([]string, len(alternatives))
	for i, alternative := range alternatives {
		ids[i] = alternative.Clinic.Clinic.ID
	}
	return ids
}

func sameIDs(got, want []string) bool {
	if len(got) != len(want) {
		return false
	}
	for i := range got {
		if got[i] != want[i] {
			return false
		}
	}
	return true
}
