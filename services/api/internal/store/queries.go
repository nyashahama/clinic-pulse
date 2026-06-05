package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"clinicpulse/services/api/internal/store/db"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
)

const (
	listClinicsSQL = `
SELECT
    id,
    name,
    facility_code,
    province,
    district,
    latitude::double precision,
    longitude::double precision,
    operating_hours,
    facility_type,
    verification_status,
    last_verified_at,
    created_at,
    updated_at
FROM clinics
ORDER BY name`

	getClinicSQL = `
SELECT
    id,
    name,
    facility_code,
    province,
    district,
    latitude::double precision,
    longitude::double precision,
    operating_hours,
    facility_type,
    verification_status,
    last_verified_at,
    created_at,
    updated_at
FROM clinics
WHERE id = $1`

	listClinicServicesSQL = `
SELECT
    clinic_id,
    service_name,
    current_availability,
    confidence_score::double precision,
    last_verified_at
FROM clinic_services
WHERE clinic_id = $1
ORDER BY service_name`

	getCurrentStatusSQL = `
SELECT
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score::double precision,
    updated_at
FROM current_status
WHERE clinic_id = $1`

	getCurrentStatusForUpdateSQL = `
SELECT
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score::double precision,
    updated_at
FROM current_status
WHERE clinic_id = $1
FOR UPDATE`

	listCurrentStatusesSQL = `
SELECT
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score::double precision,
    updated_at
FROM current_status
ORDER BY clinic_id`

	listCurrentStatusesForReviewScopeSQL = `
SELECT
    current_status.clinic_id,
    current_status.status,
    current_status.reason,
    current_status.freshness,
    current_status.last_reported_at,
    current_status.reporter_name,
    current_status.source,
    current_status.staff_pressure,
    current_status.stock_pressure,
    current_status.queue_pressure,
    current_status.confidence_score::double precision,
    current_status.updated_at
FROM current_status
JOIN clinics ON clinics.id = current_status.clinic_id
WHERE (
    ($1 = 'district_manager' AND $2::text IS NOT NULL AND clinics.district = $2)
    OR $1 IN ('org_admin', 'system_admin')
)
ORDER BY current_status.clinic_id`

	verifyClinicExistsSQL = `SELECT id FROM clinics WHERE id = $1`

	upsertCurrentStatusSQL = `
INSERT INTO current_status (
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score,
    updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
ON CONFLICT (clinic_id) DO UPDATE SET
    status = EXCLUDED.status,
    reason = EXCLUDED.reason,
    freshness = EXCLUDED.freshness,
    last_reported_at = EXCLUDED.last_reported_at,
    reporter_name = EXCLUDED.reporter_name,
    source = EXCLUDED.source,
    staff_pressure = EXCLUDED.staff_pressure,
    stock_pressure = EXCLUDED.stock_pressure,
    queue_pressure = EXCLUDED.queue_pressure,
    confidence_score = EXCLUDED.confidence_score,
    updated_at = EXCLUDED.updated_at
WHERE current_status.last_reported_at IS NULL
    OR EXCLUDED.last_reported_at >= current_status.last_reported_at
RETURNING
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score::double precision,
    updated_at`

	updateCurrentStatusFreshnessSQL = `
UPDATE current_status
SET
    freshness = $2,
    updated_at = $3
WHERE clinic_id = $1
    AND freshness <> $2
RETURNING
    clinic_id,
    status,
    reason,
    freshness,
    last_reported_at,
    reporter_name,
    source,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    confidence_score::double precision,
    updated_at`
)

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

func (s Store) Ready(ctx context.Context) error {
	if s.pool == nil {
		return errors.New("store: database pool is not configured")
	}
	return s.pool.Ping(ctx)
}

func (s Store) ListClinics(ctx context.Context) ([]ClinicDetail, error) {
	rows, err := s.pool.Query(ctx, listClinicsSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clinics, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (Clinic, error) {
		return scanClinic(row)
	})
	if err != nil {
		return nil, err
	}

	details := make([]ClinicDetail, 0, len(clinics))
	for _, clinic := range clinics {
		services, err := s.listClinicServices(ctx, clinic.ID)
		if err != nil {
			return nil, err
		}

		status, err := s.GetCurrentStatus(ctx, clinic.ID)
		if err != nil && err != pgx.ErrNoRows {
			return nil, err
		}

		detail := ClinicDetail{Clinic: clinic, Services: services}
		if err == nil {
			detail.CurrentStatus = &status
		}
		details = append(details, detail)
	}

	return details, nil
}

func (s Store) GetClinic(ctx context.Context, clinicID string) (ClinicDetail, error) {
	clinic, err := scanClinic(s.pool.QueryRow(ctx, getClinicSQL, clinicID))
	if err != nil {
		return ClinicDetail{}, err
	}

	services, err := s.listClinicServices(ctx, clinic.ID)
	if err != nil {
		return ClinicDetail{}, err
	}

	status, err := s.GetCurrentStatus(ctx, clinic.ID)
	if err != nil && err != pgx.ErrNoRows {
		return ClinicDetail{}, err
	}

	detail := ClinicDetail{Clinic: clinic, Services: services}
	if err == nil {
		detail.CurrentStatus = &status
	}

	return detail, nil
}

func (s Store) GetPartnerReadinessSnapshot(ctx context.Context, organisationID *int64) (PartnerReadinessSnapshot, error) {
	apiKeys, err := s.ListPartnerAPIKeys(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	webhookSubscriptions, err := s.ListPartnerWebhookSubscriptions(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	webhookEvents, err := s.ListPartnerWebhookEvents(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	exportRuns, err := s.listPartnerExportRuns(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}
	integrationChecks, err := s.ListIntegrationStatusChecks(ctx, organisationID)
	if err != nil {
		return PartnerReadinessSnapshot{}, err
	}

	return PartnerReadinessSnapshot{
		APIKeys:              nonNilPartnerAPIKeys(apiKeys),
		WebhookSubscriptions: nonNilPartnerWebhookSubscriptions(webhookSubscriptions),
		WebhookEvents:        nonNilPartnerWebhookEvents(webhookEvents),
		ExportRuns:           nonNilPartnerExportRuns(exportRuns),
		IntegrationChecks:    nonNilIntegrationStatusChecks(integrationChecks),
	}, nil
}

func (s Store) UpdateCurrentStatusFreshness(ctx context.Context, clinicID string, freshness string, updatedAt time.Time, audit *CreateAuditEventInput) (CurrentStatus, bool, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return CurrentStatus{}, false, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	current, err := scanCurrentStatus(tx.QueryRow(ctx, getCurrentStatusForUpdateSQL, clinicID))
	if err != nil {
		return CurrentStatus{}, false, err
	}
	if current.Freshness == freshness {
		if err := tx.Commit(ctx); err != nil {
			return CurrentStatus{}, false, err
		}
		return current, false, nil
	}

	updated, err := scanCurrentStatus(tx.QueryRow(ctx, updateCurrentStatusFreshnessSQL, clinicID, freshness, updatedAt))
	if err != nil {
		return CurrentStatus{}, false, err
	}

	if audit != nil {
		auditInput := *audit
		if auditInput.ClinicID == nil {
			auditInput.ClinicID = &clinicID
		}
		if auditInput.CreatedAt.IsZero() {
			auditInput.CreatedAt = updatedAt
		}
		normalized := normalizeCreateAuditEventInput(auditInput)
		metadataJSON, err := json.Marshal(normalized.Metadata)
		if err != nil {
			return CurrentStatus{}, false, err
		}
		_, err = q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
			ExternalID:     normalized.ExternalID,
			ClinicID:       normalized.ClinicID,
			ActorName:      normalized.ActorName,
			EventType:      normalized.EventType,
			Summary:        normalized.Summary,
			CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
			ActorUserID:    normalized.ActorUserID,
			ActorRole:      normalized.ActorRole,
			OrganisationID: normalized.OrganisationID,
			EntityType:     normalized.EntityType,
			EntityID:       normalized.EntityID,
			Column12:       metadataJSON,
		})
		if err != nil {
			return CurrentStatus{}, false, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CurrentStatus{}, false, err
	}

	return updated, true, nil
}

func (s Store) CreateReportTx(ctx context.Context, input CreateReportInput) (Report, CurrentStatus, AuditEvent, error) {
	normalized := normalizeCreateReportInput(input)
	if normalized.ReviewState != "accepted" {
		return Report{}, CurrentStatus{}, AuditEvent{}, ErrReportNotAccepted
	}
	// TODO: Port to sqlc (Task 8)
	return Report{}, CurrentStatus{}, AuditEvent{}, errors.New("store: CreateReportTx not yet migrated")
}

func (s Store) CreatePendingReportTx(ctx context.Context, input CreateReportInput) (Report, error) {
	normalized := normalizePendingCreateReportInput(input)
	if normalized.ReviewState != "pending" {
		return Report{}, ErrReportNotPending
	}
	// TODO: Port to sqlc (Task 8)
	return Report{}, errors.New("store: CreatePendingReportTx not yet migrated")
}

func (s Store) ReviewReportTx(ctx context.Context, input ReviewReportInput) (Report, *CurrentStatus, error) {
	if input.Decision != "accepted" && input.Decision != "rejected" {
		return Report{}, nil, ErrInvalidReviewDecision
	}
	// TODO: Port to sqlc (Task 8)
	return Report{}, nil, errors.New("store: ReviewReportTx not yet migrated")
}

/*
=== Original CreateReportTx/CreatePendingReportTx/ReviewReportTx implementations preserved below ===
func (s Store) CreateReportTx(ctx context.Context, input CreateReportInput) (Report, CurrentStatus, AuditEvent, error) {
	normalized := normalizeCreateReportInput(input)
	if normalized.ReviewState != "accepted" {
		return Report{}, CurrentStatus{}, AuditEvent{}, ErrReportNotAccepted
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	var clinicID string
	if err := tx.QueryRow(ctx, verifyClinicExistsSQL, normalized.ClinicID).Scan(&clinicID); err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	report, err := scanReport(tx.QueryRow(ctx, insertReportSQL,
		normalized.ExternalID,
		normalized.ClinicID,
		normalized.ReporterName,
		normalized.Source,
		normalized.OfflineCreated,
		normalized.SubmittedAt,
		normalized.ReceivedAt,
		normalized.Status,
		normalized.Reason,
		normalized.StaffPressure,
		normalized.StockPressure,
		normalized.QueuePressure,
		normalized.Notes,
		normalized.ReviewState,
		normalized.ConfidenceScore,
		nullableJSONMapArg(normalized.VisitVerification),
		normalized.SubmittedByUserID,
	))
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	status, err := scanCurrentStatus(tx.QueryRow(ctx, upsertCurrentStatusSQL,
		normalized.ClinicID,
		normalized.Status,
		normalized.Reason,
		normalized.Freshness,
		normalized.SubmittedAt,
		normalized.ReporterName,
		normalized.Source,
		normalized.StaffPressure,
		normalized.StockPressure,
		normalized.QueuePressure,
		normalized.ConfidenceScore,
		normalized.ReceivedAt,
	))
	if err == pgx.ErrNoRows {
		status, err = scanCurrentStatus(tx.QueryRow(ctx, getCurrentStatusSQL, normalized.ClinicID))
	}
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	auditInput := acceptedReportAuditEventInput(normalized)
	if normalized.AuditEvent != nil {
		auditInput = *normalized.AuditEvent
	}
	auditInput = auditEventForReport(auditInput, report, normalized.ReceivedAt)
	event, err := insertAuditEvent(ctx, tx, auditInput)
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	return report, status, event, nil
}

func (s Store) CreatePendingReportTx(ctx context.Context, input CreateReportInput) (Report, error) {
	normalized := normalizePendingCreateReportInput(input)
	if normalized.ReviewState != "pending" {
		return Report{}, ErrReportNotPending
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Report{}, err
	}
	defer tx.Rollback(ctx)

	var clinicID string
	if err := tx.QueryRow(ctx, verifyClinicExistsSQL, normalized.ClinicID).Scan(&clinicID); err != nil {
		return Report{}, err
	}

	report, err := scanReport(tx.QueryRow(ctx, insertReportSQL,
		normalized.ExternalID,
		normalized.ClinicID,
		normalized.ReporterName,
		normalized.Source,
		normalized.OfflineCreated,
		normalized.SubmittedAt,
		normalized.ReceivedAt,
		normalized.Status,
		normalized.Reason,
		normalized.StaffPressure,
		normalized.StockPressure,
		normalized.QueuePressure,
		normalized.Notes,
		normalized.ReviewState,
		normalized.ConfidenceScore,
		nullableJSONMapArg(normalized.VisitVerification),
		normalized.SubmittedByUserID,
	))
	if err != nil {
		return Report{}, err
	}

	if normalized.AuditEvent != nil {
		auditInput := auditEventForReport(*normalized.AuditEvent, report, normalized.ReceivedAt)
		if _, err := insertAuditEvent(ctx, tx, auditInput); err != nil {
			return Report{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, err
	}

	return report, nil
}

func (s Store) ReviewReportTx(ctx context.Context, input ReviewReportInput) (Report, *CurrentStatus, error) {
	if input.Decision != "accepted" && input.Decision != "rejected" {
		return Report{}, nil, ErrInvalidReviewDecision
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Report{}, nil, err
	}
	defer tx.Rollback(ctx)

	locked, err := scanReport(tx.QueryRow(ctx, getReportForReviewSQL, input.ReportID))
	if err != nil {
		return Report{}, nil, err
	}
	var district string
	if err := tx.QueryRow(ctx, `SELECT district FROM clinics WHERE id = $1`, locked.ClinicID).Scan(&district); err != nil {
		return Report{}, nil, err
	}
	if !reviewScopeCanAccessDistrict(input.Scope, district) {
		return Report{}, nil, ErrReportReviewForbidden
	}
	if locked.ReviewState != "pending" {
		return Report{}, nil, ErrReportAlreadyReviewed
	}

	reviewedAt := time.Now().UTC()
	if _, err := tx.Exec(ctx, insertReportReviewSQL,
		input.ReportID,
		input.ReviewerUserID,
		input.OrganisationID,
		input.Decision,
		input.Notes,
		reviewedAt,
	); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return Report{}, nil, ErrReportAlreadyReviewed
		}
		return Report{}, nil, err
	}

	report, err := scanReport(tx.QueryRow(ctx, updateReportReviewStateSQL,
		input.ReportID,
		input.Decision,
		input.ReviewerUserID,
		reviewedAt,
		input.Notes,
	))
	if err != nil {
		return Report{}, nil, err
	}

	var status *CurrentStatus
	if input.Decision == "accepted" {
		current, err := scanCurrentStatus(tx.QueryRow(ctx, upsertCurrentStatusSQL,
			report.ClinicID,
			report.Status,
			report.Reason,
			"fresh",
			report.SubmittedAt,
			report.ReporterName,
			report.Source,
			report.StaffPressure,
			report.StockPressure,
			report.QueuePressure,
			report.ConfidenceScore,
			reviewedAt,
		))
		if err == pgx.ErrNoRows {
			current, err = scanCurrentStatus(tx.QueryRow(ctx, getCurrentStatusSQL, report.ClinicID))
		}
		if err != nil {
			return Report{}, nil, err
		}
		status = &current
	}

	if input.AuditEvent != nil {
		auditInput := auditEventForReport(*input.AuditEvent, report, reviewedAt)
		if _, err := insertAuditEvent(ctx, tx, auditInput); err != nil {
			return Report{}, nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, nil, err
	}

	return report, status, nil
}
*/

func reviewScopeCanAccessDistrict(scope ReportReviewScope, district string) bool {
	switch scope.Role {
	case "district_manager":
		return scope.District != nil && *scope.District == district
	case "org_admin", "system_admin":
		// Temporary until clinics can be mapped to organisations; these roles
		// retain all-district review access for Task 6.
		return true
	default:
		return false
	}
}

func (s Store) listClinicServices(ctx context.Context, clinicID string) ([]ClinicService, error) {
	rows, err := s.pool.Query(ctx, listClinicServicesSQL, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (ClinicService, error) {
		var service ClinicService
		var confidence sql.NullFloat64
		var lastVerifiedAt sql.NullTime

		if err := row.Scan(
			&service.ClinicID,
			&service.ServiceName,
			&service.CurrentAvailability,
			&confidence,
			&lastVerifiedAt,
		); err != nil {
			return ClinicService{}, err
		}

		service.ConfidenceScore = nullFloat64Ptr(confidence)
		service.LastVerifiedAt = nullTimePtr(lastVerifiedAt)

		return service, nil
	})
}

func (s Store) partnerAPIKeyStateError(ctx context.Context, keyID int64, at time.Time) error {
	state, err := s.db.GetPartnerAPIKeyState(ctx, keyID)
	if err != nil {
		return err
	}
	if state.RevokedAt.Valid {
		return ErrPartnerAPIKeyRevoked
	}
	if state.ExpiresAt.Valid && !state.ExpiresAt.Time.After(at) {
		return ErrPartnerAPIKeyExpired
	}
	return pgx.ErrNoRows
}

func scanClinic(row pgx.Row) (Clinic, error) {
	var clinic Clinic
	var latitude sql.NullFloat64
	var longitude sql.NullFloat64
	var operatingHours sql.NullString
	var lastVerifiedAt sql.NullTime

	if err := row.Scan(
		&clinic.ID,
		&clinic.Name,
		&clinic.FacilityCode,
		&clinic.Province,
		&clinic.District,
		&latitude,
		&longitude,
		&operatingHours,
		&clinic.FacilityType,
		&clinic.VerificationStatus,
		&lastVerifiedAt,
		&clinic.CreatedAt,
		&clinic.UpdatedAt,
	); err != nil {
		return Clinic{}, err
	}

	clinic.Latitude = nullFloat64Ptr(latitude)
	clinic.Longitude = nullFloat64Ptr(longitude)
	clinic.OperatingHours = nullStringPtr(operatingHours)
	clinic.LastVerifiedAt = nullTimePtr(lastVerifiedAt)

	return clinic, nil
}

func scanCurrentStatus(row pgx.Row) (CurrentStatus, error) {
	var status CurrentStatus
	var reason sql.NullString
	var lastReportedAt sql.NullTime
	var reporterName sql.NullString
	var source sql.NullString
	var staffPressure sql.NullString
	var stockPressure sql.NullString
	var queuePressure sql.NullString
	var confidence sql.NullFloat64

	if err := row.Scan(
		&status.ClinicID,
		&status.Status,
		&reason,
		&status.Freshness,
		&lastReportedAt,
		&reporterName,
		&source,
		&staffPressure,
		&stockPressure,
		&queuePressure,
		&confidence,
		&status.UpdatedAt,
	); err != nil {
		return CurrentStatus{}, err
	}

	status.Reason = nullStringPtr(reason)
	status.LastReportedAt = nullTimePtr(lastReportedAt)
	status.ReporterName = nullStringPtr(reporterName)
	status.Source = nullStringPtr(source)
	status.StaffPressure = nullStringPtr(staffPressure)
	status.StockPressure = nullStringPtr(stockPressure)
	status.QueuePressure = nullStringPtr(queuePressure)
	status.ConfidenceScore = nullFloat64Ptr(confidence)

	return status, nil
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

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}

	return &value.String
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

func nullFloat64Ptr(value sql.NullFloat64) *float64 {
	if !value.Valid {
		return nil
	}

	return &value.Float64
}

func nullTimePtr(value sql.NullTime) *time.Time {
	if !value.Valid {
		return nil
	}

	return &value.Time
}

func nullInt64Ptr(value sql.NullInt64) *int64 {
	if !value.Valid {
		return nil
	}

	return &value.Int64
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
