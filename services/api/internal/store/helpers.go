package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/netip"
	"strconv"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store/db"

	"github.com/jackc/pgx/v5/pgtype"
)

var ErrInvalidSessionIPAddress = errors.New("invalid session IP address")

var allowedSyncAttemptResults = map[string]bool{
	"created":          true,
	"duplicate":        true,
	"conflict":         true,
	"validation_error": true,
	"forbidden":        true,
	"server_error":     true,
}

var allowedPartnerScopes = map[string]bool{
	"clinics:read":      true,
	"status:read":       true,
	"alternatives:read": true,
	"exports:read":      true,
}

var allowedPartnerWebhookStatuses = map[string]bool{
	"active":   true,
	"disabled": true,
}

var allowedPartnerWebhookEventStatuses = map[string]bool{
	"queued":       true,
	"delivered":    true,
	"failed":       true,
	"preview_only": true,
}

var allowedPartnerExportFormats = map[string]bool{
	"json": true,
	"csv":  true,
}

var allowedIntegrationStatuses = map[string]bool{
	"passing":   true,
	"attention": true,
	"failing":   true,
}

func reviewScopeCanAccessDistrict(scope ReportReviewScope, district string) bool {
	switch scope.Role {
	case "district_manager":
		return scope.District != nil && *scope.District == district
	case "org_admin", "system_admin":
		return true
	default:
		return false
	}
}

func normalizeCreateAuditEventInput(input CreateAuditEventInput) CreateAuditEventInput {
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	if input.Metadata == nil {
		input.Metadata = map[string]any{}
	}
	return input
}

func normalizeCreateReportSyncAttemptInput(input CreateReportSyncAttemptInput) (CreateReportSyncAttemptInput, error) {
	if !allowedSyncAttemptResults[input.Result] {
		return CreateReportSyncAttemptInput{}, ErrInvalidSyncAttemptResult
	}
	if input.ClientAttemptCount <= 0 {
		input.ClientAttemptCount = 1
	}
	if input.ReceivedAt.IsZero() {
		input.ReceivedAt = time.Now().UTC()
	}
	if input.Metadata == nil {
		input.Metadata = map[string]any{}
	}
	return input, nil
}

func normalizeCreatePartnerAPIKeyInput(input CreatePartnerAPIKeyInput) (CreatePartnerAPIKeyInput, error) {
	if input.Scopes == nil {
		input.Scopes = []string{}
	}
	for index, scope := range input.Scopes {
		trimmed := strings.TrimSpace(scope)
		if trimmed == "" || !allowedPartnerScopes[trimmed] {
			return CreatePartnerAPIKeyInput{}, ErrInvalidPartnerScope
		}
		input.Scopes[index] = trimmed
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	if input.AllowedDistricts == nil {
		input.AllowedDistricts = []string{}
	}
	return input, nil
}

func normalizeCreatePartnerWebhookSubscriptionInput(input CreatePartnerWebhookSubscriptionInput) (CreatePartnerWebhookSubscriptionInput, error) {
	if input.Status == "" {
		input.Status = "active"
	}
	if !allowedPartnerWebhookStatuses[input.Status] {
		return CreatePartnerWebhookSubscriptionInput{}, ErrInvalidPartnerWebhookStatus
	}
	if input.EventTypes == nil {
		input.EventTypes = []string{}
	}
	if input.LastTestMetadata == nil {
		input.LastTestMetadata = map[string]any{}
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	return input, nil
}

func normalizeCreatePartnerWebhookEventInput(input CreatePartnerWebhookEventInput) (CreatePartnerWebhookEventInput, error) {
	if !allowedPartnerWebhookEventStatuses[input.Status] {
		return CreatePartnerWebhookEventInput{}, ErrInvalidPartnerWebhookEventStatus
	}
	if input.Payload == nil {
		input.Payload = map[string]any{}
	}
	if input.Metadata == nil {
		input.Metadata = map[string]any{}
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	return input, nil
}

func normalizeCreatePartnerExportRunInput(input CreatePartnerExportRunInput) (CreatePartnerExportRunInput, error) {
	if !allowedPartnerExportFormats[input.Format] {
		return CreatePartnerExportRunInput{}, ErrInvalidPartnerExportFormat
	}
	if input.Scope == nil {
		input.Scope = map[string]any{}
	}
	if input.RecordCounts == nil {
		input.RecordCounts = map[string]any{}
	}
	if input.Payload == nil {
		input.Payload = map[string]any{}
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = time.Now().UTC()
	}
	return input, nil
}

func normalizeUpsertIntegrationStatusCheckInput(input UpsertIntegrationStatusCheckInput) (UpsertIntegrationStatusCheckInput, error) {
	if !allowedIntegrationStatuses[input.Status] {
		return UpsertIntegrationStatusCheckInput{}, ErrInvalidIntegrationStatus
	}
	if input.Metadata == nil {
		input.Metadata = map[string]any{}
	}
	if input.CheckedAt.IsZero() {
		input.CheckedAt = time.Now().UTC()
	}
	return input, nil
}

func normalizeCreateReportInput(input CreateReportInput) CreateReportInput {
	now := time.Now().UTC()

	if input.SubmittedAt.IsZero() {
		input.SubmittedAt = now
	}
	if input.ReceivedAt.IsZero() {
		input.ReceivedAt = now
	}
	if input.ReviewState == "" {
		input.ReviewState = "accepted"
	}
	if input.ConfidenceScore == nil {
		input.ConfidenceScore = float64Ptr(0.75)
	}
	if input.Freshness == "" {
		input.Freshness = "fresh"
	}
	if input.AuditEventType == "" {
		input.AuditEventType = "report.submitted"
	}
	if input.AuditSummary == "" {
		input.AuditSummary = fmt.Sprintf("Report submitted with %s status.", input.Status)
	}

	return input
}

func normalizePendingCreateReportInput(input CreateReportInput) CreateReportInput {
	if input.ReviewState != "" && input.ReviewState != "pending" {
		return input
	}
	if input.ReviewState == "" {
		input.ReviewState = "pending"
	}
	input = normalizeCreateReportInput(input)
	input.ReviewState = "pending"
	return input
}

func acceptedReportAuditEventInput(input CreateReportInput) CreateAuditEventInput {
	clinicID := input.ClinicID
	return CreateAuditEventInput{
		ExternalID: input.AuditExternalID,
		ClinicID:   &clinicID,
		ActorName:  input.ReporterName,
		EventType:  input.AuditEventType,
		Summary:    input.AuditSummary,
		CreatedAt:  input.ReceivedAt,
	}
}

func auditEventForReport(input CreateAuditEventInput, report Report, createdAt time.Time) CreateAuditEventInput {
	if input.ClinicID == nil && report.ClinicID != "" {
		input.ClinicID = &report.ClinicID
	}
	if input.EntityType != nil && *input.EntityType == "report" && input.EntityID == nil {
		entityID := strconv.FormatInt(report.ID, 10)
		input.EntityID = &entityID
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = createdAt
	}
	return input
}

func normalizeCreateSessionInput(input CreateSessionInput) (CreateSessionInput, error) {
	if input.IPAddress == nil {
		return input, nil
	}

	ip, err := netip.ParseAddr(*input.IPAddress)
	if err != nil {
		return CreateSessionInput{}, ErrInvalidSessionIPAddress
	}
	normalized := ip.String()
	input.IPAddress = &normalized

	return input, nil
}

func auditEventForSession(input CreateAuditEventInput, session Session) CreateAuditEventInput {
	entityType := "session"
	input.EntityType = &entityType
	entityID := strconv.FormatInt(session.ID, 10)
	input.EntityID = &entityID
	if input.CreatedAt.IsZero() {
		input.CreatedAt = session.CreatedAt
	}

	input.Metadata = cloneMetadata(input.Metadata)
	input.Metadata["sessionId"] = session.ID
	return input
}

func adminUserCreatedAuditEvent(input CreateAuditEventInput, user User) CreateAuditEventInput {
	if input.EntityType == nil {
		entityType := "user"
		input.EntityType = &entityType
	}
	if input.EntityID == nil {
		entityID := strconv.FormatInt(user.ID, 10)
		input.EntityID = &entityID
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = user.CreatedAt
	}
	input.Metadata = cloneMetadata(input.Metadata)
	return input
}

func cloneMetadata(metadata map[string]any) map[string]any {
	cloned := make(map[string]any, len(metadata)+1)
	for key, value := range metadata {
		cloned[key] = value
	}
	return cloned
}

func nullableTrimmedStringArg(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func nullableJSONMapArg(value map[string]any) *string {
	if value == nil {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		empty := "{}"
		return &empty
	}
	encoded := string(data)
	return &encoded
}

func unmarshalStringSlice(data []byte, target *[]string) error {
	if len(data) == 0 {
		data = []byte("[]")
	}
	if err := json.Unmarshal(data, target); err != nil {
		return err
	}
	if *target == nil {
		*target = []string{}
	}
	return nil
}

func unmarshalMap(data []byte, target *map[string]any) error {
	if len(data) == 0 {
		data = []byte("{}")
	}
	if err := json.Unmarshal(data, target); err != nil {
		return err
	}
	if *target == nil {
		*target = map[string]any{}
	}
	return nil
}

func nonNilPartnerAPIKeys(values []PartnerAPIKey) []PartnerAPIKey {
	if values == nil {
		return []PartnerAPIKey{}
	}
	return values
}

func nonNilPartnerWebhookSubscriptions(values []PartnerWebhookSubscription) []PartnerWebhookSubscription {
	if values == nil {
		return []PartnerWebhookSubscription{}
	}
	return values
}

func nonNilPartnerWebhookEvents(values []PartnerWebhookEvent) []PartnerWebhookEvent {
	if values == nil {
		return []PartnerWebhookEvent{}
	}
	return values
}

func nonNilPartnerExportRuns(values []PartnerExportRun) []PartnerExportRun {
	if values == nil {
		return []PartnerExportRun{}
	}
	return values
}

func nonNilIntegrationStatusChecks(values []IntegrationStatusCheck) []IntegrationStatusCheck {
	if values == nil {
		return []IntegrationStatusCheck{}
	}
	return values
}

func float64Ptr(value float64) *float64 {
	return &value
}

func float64PtrToNumeric(v *float64) pgtype.Numeric {
	if v == nil {
		return pgtype.Numeric{Valid: false}
	}
	var n pgtype.Numeric
	if err := n.Scan(*v); err != nil {
		return pgtype.Numeric{Valid: false}
	}
	return n
}

func clinicFromRow(r *db.GetClinicRow) Clinic {
	lat := r.Latitude
	lon := r.Longitude
	return Clinic{
		ID:                 r.ID,
		Name:               r.Name,
		FacilityCode:       r.FacilityCode,
		Province:           r.Province,
		District:           r.District,
		Latitude:           &lat,
		Longitude:          &lon,
		OperatingHours:     r.OperatingHours,
		FacilityType:       r.FacilityType,
		VerificationStatus: r.VerificationStatus,
		LastVerifiedAt:     timestamptzPtr(r.LastVerifiedAt),
		CreatedAt:          timestamptzTime(r.CreatedAt),
		UpdatedAt:          timestamptzTime(r.UpdatedAt),
	}
}

func clinicFromListRow(r *db.ListClinicsRow) Clinic {
	lat := r.Latitude
	lon := r.Longitude
	return Clinic{
		ID:                 r.ID,
		Name:               r.Name,
		FacilityCode:       r.FacilityCode,
		Province:           r.Province,
		District:           r.District,
		Latitude:           &lat,
		Longitude:          &lon,
		OperatingHours:     r.OperatingHours,
		FacilityType:       r.FacilityType,
		VerificationStatus: r.VerificationStatus,
		LastVerifiedAt:     timestamptzPtr(r.LastVerifiedAt),
		CreatedAt:          timestamptzTime(r.CreatedAt),
		UpdatedAt:          timestamptzTime(r.UpdatedAt),
	}
}

func clinicServiceFromRow(r *db.ListClinicServicesRow) ClinicService {
	confidence := r.ConfidenceScore
	return ClinicService{
		ClinicID:            r.ClinicID,
		ServiceName:         r.ServiceName,
		CurrentAvailability: r.CurrentAvailability,
		ConfidenceScore:     &confidence,
		LastVerifiedAt:      timestamptzPtr(r.LastVerifiedAt),
	}
}

func currentStatusFromTxRow(r *db.GetCurrentStatusForUpdateRow) CurrentStatus {
	return CurrentStatus{
		ClinicID:        r.ClinicID,
		Status:          r.Status,
		Reason:          r.Reason,
		Freshness:       r.Freshness,
		LastReportedAt:  timestamptzPtr(r.LastReportedAt),
		ReporterName:    r.ReporterName,
		Source:          r.Source,
		StaffPressure:   r.StaffPressure,
		StockPressure:   r.StockPressure,
		QueuePressure:   r.QueuePressure,
		ConfidenceScore: &r.ConfidenceScore,
		UpdatedAt:       timestamptzTime(r.UpdatedAt),
	}
}

func currentStatusFromUpsertRow(r *db.UpsertCurrentStatusRow) CurrentStatus {
	return CurrentStatus{
		ClinicID:        r.ClinicID,
		Status:          r.Status,
		Reason:          r.Reason,
		Freshness:       r.Freshness,
		LastReportedAt:  timestamptzPtr(r.LastReportedAt),
		ReporterName:    r.ReporterName,
		Source:          r.Source,
		StaffPressure:   r.StaffPressure,
		StockPressure:   r.StockPressure,
		QueuePressure:   r.QueuePressure,
		ConfidenceScore: &r.ConfidenceScore,
		UpdatedAt:       timestamptzTime(r.UpdatedAt),
	}
}

func currentStatusFromFreshnessRow(r *db.UpdateCurrentStatusFreshnessRow) CurrentStatus {
	return CurrentStatus{
		ClinicID:        r.ClinicID,
		Status:          r.Status,
		Reason:          r.Reason,
		Freshness:       r.Freshness,
		LastReportedAt:  timestamptzPtr(r.LastReportedAt),
		ReporterName:    r.ReporterName,
		Source:          r.Source,
		StaffPressure:   r.StaffPressure,
		StockPressure:   r.StockPressure,
		QueuePressure:   r.QueuePressure,
		ConfidenceScore: &r.ConfidenceScore,
		UpdatedAt:       timestamptzTime(r.UpdatedAt),
	}
}

func marshalMapOrEmpty(v map[string]any) []byte {
	if v == nil {
		return []byte("{}")
	}
	data, err := json.Marshal(v)
	if err != nil {
		return []byte("{}")
	}
	return data
}
