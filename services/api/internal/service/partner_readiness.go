package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store"
)

type PartnerSafeClinicDetailResponse struct {
	Clinic        store.Clinic               `json:"clinic"`
	Services      []store.ClinicService      `json:"services"`
	CurrentStatus *PartnerSafeStatusResponse `json:"currentStatus,omitempty"`
}

type PartnerSafeStatusResponse struct {
	ClinicID        string     `json:"clinicId"`
	Status          string     `json:"status"`
	Reason          *string    `json:"reason,omitempty"`
	Freshness       string     `json:"freshness"`
	LastReportedAt  *time.Time `json:"lastReportedAt,omitempty"`
	SourceCategory  *string    `json:"sourceCategory,omitempty"`
	StaffPressure   *string    `json:"staffPressure,omitempty"`
	StockPressure   *string    `json:"stockPressure,omitempty"`
	QueuePressure   *string    `json:"queuePressure,omitempty"`
	ConfidenceScore *float64   `json:"confidenceScore,omitempty"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

type PartnerSafeExportRunResponse struct {
	ID             int64          `json:"id"`
	OrganisationID *int64         `json:"organisationId,omitempty"`
	Format         string         `json:"format"`
	RecordCounts   map[string]any `json:"recordCounts"`
	Checksum       string         `json:"checksum"`
	CreatedAt      time.Time      `json:"createdAt"`
}

type PartnerSafeIntegrationStatusCheckResponse struct {
	CheckName string    `json:"checkName"`
	Status    string    `json:"status"`
	Summary   string    `json:"summary"`
	CheckedAt time.Time `json:"checkedAt"`
}

type PartnerExportPayloadInput struct {
	OrganisationID *int64
	Format         string
	Scope          map[string]any
	GeneratedAt    time.Time
}

type PartnerExportPayload struct {
	Payload      map[string]any
	RecordCounts map[string]any
	Checksum     string
}

type PartnerExportPayloadReader interface {
	ListClinics(ctx context.Context) ([]store.ClinicDetail, error)
	ListIntegrationStatusChecks(ctx context.Context, organisationID *int64) ([]store.IntegrationStatusCheck, error)
}

func PartnerSafeClinicDetail(input store.ClinicDetail) PartnerSafeClinicDetailResponse {
	var status *PartnerSafeStatusResponse
	if input.CurrentStatus != nil {
		status = PartnerSafeStatus(input.CurrentStatus)
	}
	return PartnerSafeClinicDetailResponse{
		Clinic:        input.Clinic,
		Services:      input.Services,
		CurrentStatus: status,
	}
}

func PartnerSafeStatus(input *store.CurrentStatus) *PartnerSafeStatusResponse {
	if input == nil {
		return nil
	}
	return &PartnerSafeStatusResponse{
		ClinicID:        input.ClinicID,
		Status:          input.Status,
		Reason:          input.Reason,
		Freshness:       input.Freshness,
		LastReportedAt:  input.LastReportedAt,
		SourceCategory:  sourceCategory(input.Source),
		StaffPressure:   input.StaffPressure,
		StockPressure:   input.StockPressure,
		QueuePressure:   input.QueuePressure,
		ConfidenceScore: input.ConfidenceScore,
		UpdatedAt:       input.UpdatedAt,
	}
}

func PartnerSafeExportRun(input store.PartnerExportRun) PartnerSafeExportRunResponse {
	return PartnerSafeExportRunResponse{
		ID:             input.ID,
		OrganisationID: input.OrganisationID,
		Format:         input.Format,
		RecordCounts:   input.RecordCounts,
		Checksum:       input.Checksum,
		CreatedAt:      input.CreatedAt,
	}
}

func PartnerSafeIntegrationStatusChecks(input []store.IntegrationStatusCheck) []PartnerSafeIntegrationStatusCheckResponse {
	if input == nil {
		return []PartnerSafeIntegrationStatusCheckResponse{}
	}
	result := make([]PartnerSafeIntegrationStatusCheckResponse, 0, len(input))
	for _, check := range input {
		result = append(result, PartnerSafeIntegrationStatusCheck(check))
	}
	return result
}

func BuildPartnerExportPayload(ctx context.Context, reader PartnerExportPayloadReader, input PartnerExportPayloadInput) (PartnerExportPayload, error) {
	format := strings.TrimSpace(strings.ToLower(input.Format))
	if format != "json" && format != "csv" {
		return PartnerExportPayload{}, ValidationError{Fields: []string{fieldMessage("format", "format must be one of: json, csv")}}
	}
	generatedAt := input.GeneratedAt.UTC()
	if generatedAt.IsZero() {
		generatedAt = time.Now().UTC()
	}
	scope := copyPartnerExportScope(input.Scope)

	clinics, err := reader.ListClinics(ctx)
	if err != nil {
		return PartnerExportPayload{}, err
	}
	clinics = filterPartnerExportClinics(clinics, scope)
	safeClinics := make([]PartnerSafeClinicDetailResponse, 0, len(clinics))
	for _, clinic := range clinics {
		safeClinics = append(safeClinics, PartnerSafeClinicDetail(clinic))
	}

	checks, err := reader.ListIntegrationStatusChecks(ctx, input.OrganisationID)
	if err != nil {
		return PartnerExportPayload{}, err
	}
	safeChecks := PartnerSafeIntegrationStatusChecks(checks)

	recordCounts := map[string]any{
		"clinics":           len(safeClinics),
		"integrationChecks": len(safeChecks),
	}
	payload := map[string]any{
		"format":            format,
		"scope":             scope,
		"generatedAt":       generatedAt.Format(time.RFC3339),
		"clinics":           safeClinics,
		"integrationChecks": safeChecks,
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		return PartnerExportPayload{}, err
	}
	checksum := sha256.Sum256(encoded)

	return PartnerExportPayload{
		Payload:      payload,
		RecordCounts: recordCounts,
		Checksum:     "sha256:" + hex.EncodeToString(checksum[:]),
	}, nil
}

func PartnerSafeIntegrationStatusCheck(input store.IntegrationStatusCheck) PartnerSafeIntegrationStatusCheckResponse {
	return PartnerSafeIntegrationStatusCheckResponse{
		CheckName: input.CheckName,
		Status:    input.Status,
		Summary:   input.Summary,
		CheckedAt: input.CheckedAt,
	}
}

func PartnerScopeAllowsDistrict(allowedDistricts []string, district string) bool {
	if len(allowedDistricts) == 0 {
		return true
	}
	for _, allowed := range allowedDistricts {
		if allowed == district {
			return true
		}
	}
	return false
}

func copyPartnerExportScope(scope map[string]any) map[string]any {
	if scope == nil {
		return map[string]any{}
	}
	copied := make(map[string]any, len(scope))
	for key, value := range scope {
		copied[key] = value
	}
	return copied
}

func filterPartnerExportClinics(clinics []store.ClinicDetail, scope map[string]any) []store.ClinicDetail {
	district, _ := scope["district"].(string)
	district = strings.TrimSpace(district)
	if district == "" {
		return clinics
	}
	filtered := make([]store.ClinicDetail, 0, len(clinics))
	for _, clinic := range clinics {
		if clinic.Clinic.District == district {
			filtered = append(filtered, clinic)
		}
	}
	return filtered
}

func sourceCategory(source *string) *string {
	if source == nil {
		return nil
	}
	category := *source
	switch category {
	case "field_worker", "offline_sync", "district_review", "seed", "demo_control", "clinic_coordinator":
	default:
		category = "operational_signal"
	}
	return &category
}
