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

type IntegrationCheckInput struct {
	OrganisationID                     *int64
	APIKeyActive                       bool
	ExportGenerated                    bool
	WebhookTestRecorded                bool
	OfflineSyncHealthAvailable         bool
	StaleStatusReconciliationAvailable bool
	DeploymentEnvironment              string
	APIKeyPepper                       string
	WebhookDeliveryEnabled             bool
	CheckedAt                          time.Time
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
	statusCount := 0
	for _, clinic := range clinics {
		if clinic.CurrentStatus != nil {
			statusCount++
		}
		safeClinics = append(safeClinics, PartnerSafeClinicDetail(clinic))
	}

	checks, err := reader.ListIntegrationStatusChecks(ctx, input.OrganisationID)
	if err != nil {
		return PartnerExportPayload{}, err
	}
	safeChecks := PartnerSafeIntegrationStatusChecks(checks)

	recordCounts := map[string]any{
		"clinics":           len(safeClinics),
		"statuses":          statusCount,
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

func BuildIntegrationChecks(input IntegrationCheckInput) []store.UpsertIntegrationStatusCheckInput {
	return []store.UpsertIntegrationStatusCheckInput{
		integrationCheck(input, "api_key_active", input.APIKeyActive,
			"At least one active partner API key is available.",
			"Create or activate a partner API key."),
		integrationCheck(input, "export_generated", input.ExportGenerated,
			"A partner export has been generated.",
			"Generate a partner export."),
		integrationCheck(input, "webhook_test_recorded", input.WebhookTestRecorded,
			"A webhook test event has been recorded.",
			"Record a webhook test event."),
		integrationCheck(input, "offline_sync_health_available", input.OfflineSyncHealthAvailable,
			"Offline sync health data is available.",
			"Make offline sync health data available."),
		integrationCheck(input, "stale_status_reconciliation_available", input.StaleStatusReconciliationAvailable,
			"Stale status reconciliation is available.",
			"Make stale status reconciliation available."),
		deploymentEnvCheck(input),
	}
}

func integrationCheck(input IntegrationCheckInput, name string, passing bool, passingSummary string, attentionSummary string) store.UpsertIntegrationStatusCheckInput {
	status := "passing"
	summary := passingSummary
	if !passing {
		status = "attention"
		summary = attentionSummary
	}
	return store.UpsertIntegrationStatusCheckInput{
		OrganisationID: input.OrganisationID,
		CheckName:      name,
		Status:         status,
		Summary:        summary,
		Metadata:       map[string]any{},
		CheckedAt:      input.CheckedAt,
	}
}

func deploymentEnvCheck(input IntegrationCheckInput) store.UpsertIntegrationStatusCheckInput {
	environment := strings.TrimSpace(strings.ToLower(input.DeploymentEnvironment))
	missing := []string{}
	if environment == "" {
		missing = append(missing, "deployment environment")
	}
	if environment == "live" && strings.TrimSpace(input.APIKeyPepper) == "" {
		missing = append(missing, "API key pepper")
	}
	if environment == "live" && !input.WebhookDeliveryEnabled {
		missing = append(missing, "webhook delivery")
	}

	if len(missing) == 0 {
		return integrationCheck(input, "deployment_env_configured", true,
			"Deployment environment is configured.",
			"")
	}
	return integrationCheck(input, "deployment_env_configured", false,
		"",
		"Missing readiness configuration: "+strings.Join(missing, ", ")+".")
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

func LatestPartnerExportForAllowedDistricts(exportRuns []store.PartnerExportRun, allowedDistricts []string) (store.PartnerExportRun, bool) {
	for _, exportRun := range exportRuns {
		if PartnerExportAllowsDistricts(exportRun, allowedDistricts) {
			return exportRun, true
		}
	}
	return store.PartnerExportRun{}, false
}

func PartnerExportAllowsDistricts(exportRun store.PartnerExportRun, allowedDistricts []string) bool {
	if len(allowedDistricts) == 0 {
		return true
	}
	district, _ := exportRun.Scope["district"].(string)
	district = strings.TrimSpace(district)
	if district == "" {
		return false
	}
	return PartnerScopeAllowsDistrict(allowedDistricts, district)
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
