package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
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

	getReportByExternalIDSQL = `
SELECT
    id,
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    notes,
    review_state,
    confidence_score::double precision,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes
FROM reports
WHERE external_id = $1`

	listClinicReportsSQL = `
SELECT
    id,
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
	notes,
	review_state,
	confidence_score::double precision,
	submitted_by_user_id,
	reviewed_by_user_id,
	reviewed_at,
	review_notes
FROM reports
WHERE clinic_id = $1
ORDER BY received_at DESC, id DESC`

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

	listPendingReportsSQL = `
SELECT
    reports.id,
    reports.external_id,
    reports.clinic_id,
    reports.reporter_name,
    reports.source,
    reports.offline_created,
    reports.submitted_at,
    reports.received_at,
    reports.status,
    reports.reason,
    reports.staff_pressure,
    reports.stock_pressure,
    reports.queue_pressure,
    reports.notes,
    reports.review_state,
    reports.confidence_score::double precision,
    reports.submitted_by_user_id,
    reports.reviewed_by_user_id,
    reports.reviewed_at,
    reports.review_notes
FROM reports
JOIN clinics ON clinics.id = reports.clinic_id
WHERE reports.review_state = 'pending'
    AND (
        ($1 = 'district_manager' AND $2::text IS NOT NULL AND clinics.district = $2)
        OR $1 IN ('org_admin', 'system_admin')
    )
ORDER BY reports.received_at DESC, reports.id DESC`

	listClinicAuditEventsSQL = `
SELECT
    id,
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
    created_at,
    actor_user_id,
    actor_role,
    organisation_id,
    entity_type,
    entity_id,
    metadata
FROM audit_events
WHERE clinic_id = $1
ORDER BY created_at DESC, id DESC`

	verifyClinicExistsSQL = `SELECT id FROM clinics WHERE id = $1`

	insertReportSQL = `
INSERT INTO reports (
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
	notes,
	review_state,
	confidence_score,
	submitted_by_user_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING
    id,
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    notes,
    review_state,
    confidence_score::double precision,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes`

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

	insertAuditEventSQL = `
INSERT INTO audit_events (
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
    created_at,
    actor_user_id,
    actor_role,
    organisation_id,
    entity_type,
    entity_id,
    metadata
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
RETURNING
    id,
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
	created_at,
	actor_user_id,
	actor_role,
	organisation_id,
	entity_type,
	entity_id,
	metadata`

	insertReportSyncAttemptSQL = `
INSERT INTO report_sync_attempts (
    external_id,
    report_id,
    submitted_by_user_id,
    organisation_id,
    clinic_id,
    result,
    client_attempt_count,
    queued_at,
    submitted_at,
    received_at,
    error_code,
    error_message,
    metadata
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb)
RETURNING
    id,
    external_id,
    report_id,
    submitted_by_user_id,
    organisation_id,
    clinic_id,
    result,
    client_attempt_count,
    queued_at,
    submitted_at,
    received_at,
    error_code,
    error_message,
    metadata`

	syncSummarySinceSQL = `
WITH attempt_counts AS (
    SELECT
        (COUNT(*) FILTER (WHERE result = 'created'))::int AS created_count,
        (COUNT(*) FILTER (WHERE result = 'duplicate'))::int AS duplicate_count,
        (COUNT(*) FILTER (WHERE result = 'conflict'))::int AS conflict_count,
        (COUNT(*) FILTER (WHERE result = 'validation_error'))::int AS validation_error_count
    FROM report_sync_attempts
    WHERE received_at >= $1
),
pending_offline AS (
    SELECT COUNT(*)::int AS pending_count
    FROM reports
    WHERE offline_created = true
        AND review_state = 'pending'
),
current_status_counts AS (
    SELECT
        (COUNT(*) FILTER (WHERE freshness = 'needs_confirmation'))::int AS needs_confirmation_count,
        (COUNT(*) FILTER (WHERE freshness = 'stale'))::int AS stale_count
    FROM current_status
)
SELECT
    created_count,
    duplicate_count,
    conflict_count,
    validation_error_count,
    pending_count,
    needs_confirmation_count,
    stale_count
FROM attempt_counts, pending_offline, current_status_counts`

	getReportForReviewSQL = `
SELECT
    id,
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    notes,
    review_state,
    confidence_score::double precision,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes
FROM reports
WHERE id = $1
FOR UPDATE`

	insertReportReviewSQL = `
INSERT INTO report_reviews (
    report_id,
    reviewer_user_id,
    organisation_id,
    decision,
    notes,
    metadata,
    created_at
)
VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, $6)`

	updateReportReviewStateSQL = `
UPDATE reports
SET
    review_state = $2,
    reviewed_by_user_id = $3,
    reviewed_at = $4,
    review_notes = $5
WHERE id = $1
RETURNING
    id,
    external_id,
    clinic_id,
    reporter_name,
    source,
    offline_created,
    submitted_at,
    received_at,
    status,
    reason,
    staff_pressure,
    stock_pressure,
    queue_pressure,
    notes,
    review_state,
    confidence_score::double precision,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes`

	updateCurrentStatusFreshnessSQL = `
UPDATE current_status
SET
    freshness = $2,
    updated_at = $3
WHERE clinic_id = $1
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

func (s Store) GetCurrentStatus(ctx context.Context, clinicID string) (CurrentStatus, error) {
	return scanCurrentStatus(s.pool.QueryRow(ctx, getCurrentStatusSQL, clinicID))
}

func (s Store) GetReportByExternalID(ctx context.Context, externalID string) (Report, error) {
	return scanReport(s.pool.QueryRow(ctx, getReportByExternalIDSQL, externalID))
}

func (s Store) CreateReportSyncAttempt(ctx context.Context, input CreateReportSyncAttemptInput) (ReportSyncAttempt, error) {
	normalized, err := normalizeCreateReportSyncAttemptInput(input)
	if err != nil {
		return ReportSyncAttempt{}, err
	}

	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return ReportSyncAttempt{}, err
	}

	return scanReportSyncAttempt(s.pool.QueryRow(ctx, insertReportSyncAttemptSQL,
		normalized.ExternalID,
		normalized.ReportID,
		normalized.SubmittedByUserID,
		normalized.OrganisationID,
		normalized.ClinicID,
		normalized.Result,
		normalized.ClientAttemptCount,
		normalized.QueuedAt,
		normalized.SubmittedAt,
		normalized.ReceivedAt,
		normalized.ErrorCode,
		normalized.ErrorMessage,
		string(metadataJSON),
	))
}

func (s Store) GetSyncSummarySince(ctx context.Context, since time.Time) (SyncSummary, error) {
	var summary SyncSummary
	summary.WindowStartedAt = since

	if err := s.pool.QueryRow(ctx, syncSummarySinceSQL, since).Scan(
		&summary.OfflineReportsReceived,
		&summary.DuplicateSyncsHandled,
		&summary.ConflictsNeedingAttention,
		&summary.ValidationFailures,
		&summary.PendingOfflineReports,
		&summary.NeedsConfirmationClinics,
		&summary.StaleClinics,
	); err != nil {
		return SyncSummary{}, err
	}

	return summary, nil
}

func (s Store) ListCurrentStatuses(ctx context.Context) ([]CurrentStatus, error) {
	rows, err := s.pool.Query(ctx, listCurrentStatusesSQL)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (CurrentStatus, error) {
		return scanCurrentStatus(row)
	})
}

func (s Store) UpdateCurrentStatusFreshness(ctx context.Context, clinicID string, freshness string, updatedAt time.Time, audit *CreateAuditEventInput) (CurrentStatus, bool, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return CurrentStatus{}, false, err
	}
	defer tx.Rollback(ctx)

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
		if _, err := insertAuditEvent(ctx, tx, auditInput); err != nil {
			return CurrentStatus{}, false, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return CurrentStatus{}, false, err
	}

	return updated, true, nil
}

func (s Store) ListClinicReports(ctx context.Context, clinicID string) ([]Report, error) {
	rows, err := s.pool.Query(ctx, listClinicReportsSQL, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (Report, error) {
		return scanReport(row)
	})
}

func (s Store) ListPendingReports(ctx context.Context, scope ReportReviewScope) ([]Report, error) {
	rows, err := s.pool.Query(ctx, listPendingReportsSQL, scope.Role, scope.District)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (Report, error) {
		return scanReport(row)
	})
}

func (s Store) ListClinicAuditEvents(ctx context.Context, clinicID string) ([]AuditEvent, error) {
	rows, err := s.pool.Query(ctx, listClinicAuditEventsSQL, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (AuditEvent, error) {
		return scanAuditEvent(row)
	})
}

func (s Store) CreateAuditEvent(ctx context.Context, input CreateAuditEventInput) (AuditEvent, error) {
	return insertAuditEvent(ctx, s.pool, input)
}

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

func scanReport(row pgx.Row) (Report, error) {
	var report Report
	var externalID sql.NullString
	var reporterName sql.NullString
	var reason sql.NullString
	var staffPressure sql.NullString
	var stockPressure sql.NullString
	var queuePressure sql.NullString
	var notes sql.NullString
	var confidence sql.NullFloat64
	var submittedByUserID sql.NullInt64
	var reviewedByUserID sql.NullInt64
	var reviewedAt sql.NullTime
	var reviewNotes sql.NullString

	if err := row.Scan(
		&report.ID,
		&externalID,
		&report.ClinicID,
		&reporterName,
		&report.Source,
		&report.OfflineCreated,
		&report.SubmittedAt,
		&report.ReceivedAt,
		&report.Status,
		&reason,
		&staffPressure,
		&stockPressure,
		&queuePressure,
		&notes,
		&report.ReviewState,
		&confidence,
		&submittedByUserID,
		&reviewedByUserID,
		&reviewedAt,
		&reviewNotes,
	); err != nil {
		return Report{}, err
	}

	report.ExternalID = nullStringPtr(externalID)
	report.ReporterName = nullStringPtr(reporterName)
	report.Reason = nullStringPtr(reason)
	report.StaffPressure = nullStringPtr(staffPressure)
	report.StockPressure = nullStringPtr(stockPressure)
	report.QueuePressure = nullStringPtr(queuePressure)
	report.Notes = nullStringPtr(notes)
	report.ConfidenceScore = nullFloat64Ptr(confidence)
	report.SubmittedByUserID = nullInt64Ptr(submittedByUserID)
	report.ReviewedByUserID = nullInt64Ptr(reviewedByUserID)
	report.ReviewedAt = nullTimePtr(reviewedAt)
	report.ReviewNotes = nullStringPtr(reviewNotes)

	return report, nil
}

func scanReportSyncAttempt(row pgx.Row) (ReportSyncAttempt, error) {
	var attempt ReportSyncAttempt
	var reportID sql.NullInt64
	var submittedByUserID sql.NullInt64
	var organisationID sql.NullInt64
	var queuedAt sql.NullTime
	var submittedAt sql.NullTime
	var errorCode sql.NullString
	var errorMessage sql.NullString
	var metadataJSON []byte

	if err := row.Scan(
		&attempt.ID,
		&attempt.ExternalID,
		&reportID,
		&submittedByUserID,
		&organisationID,
		&attempt.ClinicID,
		&attempt.Result,
		&attempt.ClientAttemptCount,
		&queuedAt,
		&submittedAt,
		&attempt.ReceivedAt,
		&errorCode,
		&errorMessage,
		&metadataJSON,
	); err != nil {
		return ReportSyncAttempt{}, err
	}

	attempt.ReportID = nullInt64Ptr(reportID)
	attempt.SubmittedByUserID = nullInt64Ptr(submittedByUserID)
	attempt.OrganisationID = nullInt64Ptr(organisationID)
	attempt.QueuedAt = nullTimePtr(queuedAt)
	attempt.SubmittedAt = nullTimePtr(submittedAt)
	attempt.ErrorCode = nullStringPtr(errorCode)
	attempt.ErrorMessage = nullStringPtr(errorMessage)
	if len(metadataJSON) == 0 {
		metadataJSON = []byte("{}")
	}
	if err := json.Unmarshal(metadataJSON, &attempt.Metadata); err != nil {
		return ReportSyncAttempt{}, err
	}

	return attempt, nil
}

func scanAuditEvent(row pgx.Row) (AuditEvent, error) {
	var event AuditEvent
	var externalID sql.NullString
	var clinicID sql.NullString
	var actorName sql.NullString
	var actorUserID sql.NullInt64
	var actorRole sql.NullString
	var organisationID sql.NullInt64
	var entityType sql.NullString
	var entityID sql.NullString
	var metadataJSON []byte

	if err := row.Scan(
		&event.ID,
		&externalID,
		&clinicID,
		&actorName,
		&event.EventType,
		&event.Summary,
		&event.CreatedAt,
		&actorUserID,
		&actorRole,
		&organisationID,
		&entityType,
		&entityID,
		&metadataJSON,
	); err != nil {
		return AuditEvent{}, err
	}

	event.ExternalID = nullStringPtr(externalID)
	if clinicID.Valid {
		event.ClinicID = clinicID.String
	}
	event.ActorName = nullStringPtr(actorName)
	event.ActorUserID = nullInt64Ptr(actorUserID)
	event.ActorRole = nullStringPtr(actorRole)
	event.OrganisationID = nullInt64Ptr(organisationID)
	event.EntityType = nullStringPtr(entityType)
	event.EntityID = nullStringPtr(entityID)
	if len(metadataJSON) == 0 {
		metadataJSON = []byte("{}")
	}
	if err := json.Unmarshal(metadataJSON, &event.Metadata); err != nil {
		return AuditEvent{}, err
	}

	return event, nil
}

type auditEventInserter interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func insertAuditEvent(ctx context.Context, queryer auditEventInserter, input CreateAuditEventInput) (AuditEvent, error) {
	normalized := normalizeCreateAuditEventInput(input)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return AuditEvent{}, err
	}

	return scanAuditEvent(queryer.QueryRow(ctx, insertAuditEventSQL,
		normalized.ExternalID,
		normalized.ClinicID,
		normalized.ActorName,
		normalized.EventType,
		normalized.Summary,
		normalized.CreatedAt,
		normalized.ActorUserID,
		normalized.ActorRole,
		normalized.OrganisationID,
		normalized.EntityType,
		normalized.EntityID,
		string(metadataJSON),
	))
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
	if input.ClientAttemptCount == 0 {
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

func float64Ptr(value float64) *float64 {
	return &value
}
