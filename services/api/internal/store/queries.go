package store

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
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
    confidence_score::double precision
FROM reports
WHERE clinic_id = $1
ORDER BY received_at DESC, id DESC`

	listClinicAuditEventsSQL = `
SELECT
    id,
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
    created_at
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
    confidence_score
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
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
    confidence_score::double precision`

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
    created_at
)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING
    id,
    external_id,
    clinic_id,
    actor_name,
    event_type,
    summary,
    created_at`
)

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

	event, err := scanAuditEvent(tx.QueryRow(ctx, insertAuditEventSQL,
		normalized.AuditExternalID,
		normalized.ClinicID,
		normalized.ReporterName,
		normalized.AuditEventType,
		normalized.AuditSummary,
		normalized.ReceivedAt,
	))
	if err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Report{}, CurrentStatus{}, AuditEvent{}, err
	}

	return report, status, event, nil
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

	return report, nil
}

func scanAuditEvent(row pgx.Row) (AuditEvent, error) {
	var event AuditEvent
	var externalID sql.NullString
	var actorName sql.NullString

	if err := row.Scan(
		&event.ID,
		&externalID,
		&event.ClinicID,
		&actorName,
		&event.EventType,
		&event.Summary,
		&event.CreatedAt,
	); err != nil {
		return AuditEvent{}, err
	}

	event.ExternalID = nullStringPtr(externalID)
	event.ActorName = nullStringPtr(actorName)

	return event, nil
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

func float64Ptr(value float64) *float64 {
	return &value
}
