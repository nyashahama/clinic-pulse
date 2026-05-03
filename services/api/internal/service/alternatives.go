package service

import (
	"math"
	"sort"
	"strings"

	"clinicpulse/services/api/internal/store"
)

type Alternative struct {
	Clinic         store.ClinicDetail `json:"clinic"`
	DistanceKm     *float64           `json:"distanceKm"`
	ReasonCode     string             `json:"reasonCode"`
	RankReason     string             `json:"rankReason"`
	MatchedService string             `json:"matchedService"`
}

func RankAlternatives(source store.ClinicDetail, candidates []store.ClinicDetail, serviceName string) []Alternative {
	requestedService := normalizeServiceName(serviceName)
	if requestedService == "" {
		return []Alternative{}
	}

	safeAvailable := make([]Alternative, 0, len(candidates))
	safeFallbackAvailability := make([]Alternative, 0, len(candidates))
	unsafeAlternatives := make([]Alternative, 0, len(candidates))
	for _, candidate := range candidates {
		if candidate.Clinic.ID == source.Clinic.ID {
			continue
		}
		matchedService, ok := matchingService(candidate, requestedService)
		if !ok {
			continue
		}

		alternative := Alternative{
			Clinic:         candidate,
			DistanceKm:     distanceKm(source.Clinic, candidate.Clinic),
			ReasonCode:     alternativeReasonCode(candidate, matchedService),
			RankReason:     alternativeRankReason(candidate, matchedService),
			MatchedService: matchedService.ServiceName,
		}
		if isUnsafeStatus(statusOf(candidate)) {
			unsafeAlternatives = append(unsafeAlternatives, alternative)
			continue
		}
		if isFallbackServiceAvailability(matchedService.CurrentAvailability) {
			safeFallbackAvailability = append(safeFallbackAvailability, alternative)
			continue
		}
		safeAvailable = append(safeAvailable, alternative)
	}

	alternatives := safeAvailable
	if len(alternatives) == 0 {
		alternatives = safeFallbackAvailability
	}
	if len(alternatives) == 0 {
		alternatives = unsafeAlternatives
	}

	sort.SliceStable(alternatives, func(i, j int) bool {
		left := alternatives[i]
		right := alternatives[j]

		if rankDelta := alternativeRank(left.Clinic) - alternativeRank(right.Clinic); rankDelta != 0 {
			return rankDelta < 0
		}
		if distanceDelta := compareDistance(left.DistanceKm, right.DistanceKm); distanceDelta != 0 {
			return distanceDelta < 0
		}
		if left.Clinic.Clinic.Name != right.Clinic.Clinic.Name {
			return left.Clinic.Clinic.Name < right.Clinic.Clinic.Name
		}
		return left.Clinic.Clinic.ID < right.Clinic.Clinic.ID
	})

	if len(alternatives) > 4 {
		return alternatives[:4]
	}

	return alternatives
}

func matchingService(clinic store.ClinicDetail, requestedService string) (store.ClinicService, bool) {
	for _, service := range clinic.Services {
		if normalizeServiceName(service.ServiceName) == requestedService {
			return service, true
		}
	}
	return store.ClinicService{}, false
}

func normalizeServiceName(serviceName string) string {
	return strings.ToLower(strings.Join(strings.Fields(serviceName), " "))
}

func statusOf(clinic store.ClinicDetail) string {
	if clinic.CurrentStatus == nil {
		return "unknown"
	}
	return clinic.CurrentStatus.Status
}

func freshnessOf(clinic store.ClinicDetail) string {
	if clinic.CurrentStatus == nil {
		return "unknown"
	}
	return clinic.CurrentStatus.Freshness
}

func isUnsafeStatus(status string) bool {
	return status == "non_functional" || status == "unknown" || status == ""
}

func isFallbackServiceAvailability(availability string) bool {
	normalized := strings.ToLower(strings.TrimSpace(availability))
	return normalized == "" || normalized == "unavailable" || normalized == "unknown"
}

func alternativeRank(clinic store.ClinicDetail) int {
	status := statusOf(clinic)
	freshness := freshnessOf(clinic)

	if status == "operational" && freshness == "fresh" {
		return 0
	}
	if status == "operational" {
		return 1
	}
	if status == "degraded" && freshness != "stale" {
		return 2
	}
	return 3
}

func alternativeReasonCode(clinic store.ClinicDetail, matchedService store.ClinicService) string {
	if isFallbackServiceAvailability(matchedService.CurrentAvailability) {
		return "service_availability_fallback"
	}

	status := statusOf(clinic)
	freshness := freshnessOf(clinic)
	if status == "operational" && freshness == "fresh" {
		return "operational_fresh"
	}
	if status == "operational" {
		return "operational"
	}
	if status == "degraded" && freshness != "stale" {
		return "degraded"
	}
	return "clinic_status_fallback"
}

func alternativeRankReason(clinic store.ClinicDetail, matchedService store.ClinicService) string {
	if isFallbackServiceAvailability(matchedService.CurrentAvailability) {
		return "Requested service availability needs verification before routing"
	}

	status := statusOf(clinic)
	freshness := freshnessOf(clinic)

	if status == "operational" && freshness == "fresh" {
		return "Operational and fresh with requested service"
	}
	if status == "operational" {
		return "Operational with requested service; freshness needs confirmation"
	}
	if status == "degraded" && freshness != "stale" {
		return "Degraded but fresh enough with requested service"
	}
	return "Fallback with requested service"
}

func distanceKm(source, candidate store.Clinic) *float64 {
	if source.Latitude == nil || source.Longitude == nil || candidate.Latitude == nil || candidate.Longitude == nil {
		return nil
	}

	const earthRadiusKm = 6371
	sourceLat := degreesToRadians(*source.Latitude)
	sourceLng := degreesToRadians(*source.Longitude)
	candidateLat := degreesToRadians(*candidate.Latitude)
	candidateLng := degreesToRadians(*candidate.Longitude)

	dLat := candidateLat - sourceLat
	dLng := candidateLng - sourceLng
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(sourceLat)*math.Cos(candidateLat)*math.Sin(dLng/2)*math.Sin(dLng/2)

	distance := math.Max(0.3, 2*earthRadiusKm*math.Asin(math.Sqrt(a)))
	return &distance
}

func compareDistance(left, right *float64) int {
	if left == nil && right == nil {
		return 0
	}
	if left == nil {
		return 1
	}
	if right == nil {
		return -1
	}
	if *left < *right {
		return -1
	}
	if *left > *right {
		return 1
	}
	return 0
}

func degreesToRadians(degrees float64) float64 {
	return degrees * math.Pi / 180
}
