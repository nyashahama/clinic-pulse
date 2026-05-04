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

	getPendingReportByPayloadSQL = `
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
WHERE review_state = 'pending'
    AND clinic_id = $1
    AND source = $2
    AND status = $3
    AND reason IS NOT DISTINCT FROM $4::text
    AND staff_pressure IS NOT DISTINCT FROM $5::text
    AND stock_pressure IS NOT DISTINCT FROM $6::text
    AND queue_pressure IS NOT DISTINCT FROM $7::text
    AND notes IS NOT DISTINCT FROM $8::text
    AND submitted_by_user_id IS NOT DISTINCT FROM $9::bigint
ORDER BY received_at DESC, id DESC
LIMIT 1`

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

	insertPartnerAPIKeySQL = `
INSERT INTO partner_api_keys (
    organisation_id,
    name,
    environment,
    key_prefix,
    key_hash,
    scopes,
    allowed_districts,
    expires_at,
    created_by_user_id,
    created_at,
    updated_at
)
VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $10)
RETURNING
    id,
    organisation_id,
    name,
    environment,
    key_prefix,
    key_hash,
    scopes,
    allowed_districts,
    expires_at,
    revoked_at,
    last_used_at,
    host(last_used_ip),
    created_by_user_id,
    created_at,
    updated_at`

	getPartnerAPIKeyByHashSQL = `
SELECT
    id,
    organisation_id,
    name,
    environment,
    key_prefix,
    key_hash,
    scopes,
    allowed_districts,
    expires_at,
    revoked_at,
    last_used_at,
    host(last_used_ip),
    created_by_user_id,
    created_at,
    updated_at
FROM partner_api_keys
WHERE key_hash = $1`

	listPartnerAPIKeysSQL = `
SELECT
    id,
    organisation_id,
    name,
    environment,
    key_prefix,
    key_hash,
    scopes,
    allowed_districts,
    expires_at,
    revoked_at,
    last_used_at,
    host(last_used_ip),
    created_by_user_id,
    created_at,
    updated_at
FROM partner_api_keys
WHERE $1::bigint IS NULL OR organisation_id = $1
ORDER BY created_at DESC, id DESC`

	touchPartnerAPIKeySQL = `
UPDATE partner_api_keys
SET
    last_used_at = $3,
    last_used_ip = NULLIF($2, '')::inet,
    updated_at = $3
WHERE id = $1
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > $3)`

	revokePartnerAPIKeySQL = `
UPDATE partner_api_keys
SET
    revoked_at = $2,
    updated_at = $2
WHERE id = $1
    AND revoked_at IS NULL`

	getPartnerAPIKeyStateSQL = `
SELECT
    revoked_at,
    expires_at
FROM partner_api_keys
WHERE id = $1`

	insertPartnerWebhookSubscriptionSQL = `
INSERT INTO partner_webhook_subscriptions (
    organisation_id,
    name,
    target_url,
    event_types,
    secret_hash,
    status,
    last_test_metadata,
    created_by_user_id,
    created_at,
    updated_at
)
VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7::jsonb, $8, $9, $9)
RETURNING
    id,
    organisation_id,
    name,
    target_url,
    event_types,
    secret_hash,
    status,
    last_tested_at,
    last_test_status,
    last_test_metadata,
    last_error,
    created_by_user_id,
    created_at,
    updated_at`

	listPartnerWebhookSubscriptionsSQL = `
SELECT
    id,
    organisation_id,
    name,
    target_url,
    event_types,
    secret_hash,
    status,
    last_tested_at,
    last_test_status,
    last_test_metadata,
    last_error,
    created_by_user_id,
    created_at,
    updated_at
FROM partner_webhook_subscriptions
WHERE $1::bigint IS NULL OR organisation_id = $1
ORDER BY created_at DESC, id DESC`

	insertPartnerWebhookEventSQL = `
INSERT INTO partner_webhook_events (
    subscription_id,
    event_type,
    payload,
    metadata,
    status,
    attempt_count,
    last_error,
    created_at,
    delivered_at
)
VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, $7, $8, $9)
RETURNING
    id,
    subscription_id,
    event_type,
    payload,
    metadata,
    status,
    attempt_count,
    last_error,
    created_at,
    delivered_at`

	listPartnerWebhookEventsSQL = `
SELECT
    partner_webhook_events.id,
    partner_webhook_events.subscription_id,
    partner_webhook_events.event_type,
    partner_webhook_events.payload,
    partner_webhook_events.metadata,
    partner_webhook_events.status,
    partner_webhook_events.attempt_count,
    partner_webhook_events.last_error,
    partner_webhook_events.created_at,
    partner_webhook_events.delivered_at
FROM partner_webhook_events
JOIN partner_webhook_subscriptions ON partner_webhook_subscriptions.id = partner_webhook_events.subscription_id
WHERE $1::bigint IS NULL OR partner_webhook_subscriptions.organisation_id = $1
ORDER BY partner_webhook_events.created_at DESC, partner_webhook_events.id DESC`

	insertPartnerExportRunSQL = `
INSERT INTO partner_export_runs (
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at
)
VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb, $8)
RETURNING
    id,
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at`

	getPartnerExportRunSQL = `
SELECT
    id,
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at
FROM partner_export_runs
WHERE id = $1`

	getPartnerExportRunForOrganisationSQL = `
SELECT
    id,
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at
FROM partner_export_runs
WHERE id = $2
    AND ($1::bigint IS NULL OR organisation_id = $1)`

	getLatestPartnerExportRunSQL = `
SELECT
    id,
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at
FROM partner_export_runs
WHERE $1::bigint IS NULL OR organisation_id = $1
ORDER BY created_at DESC, id DESC
LIMIT 1`

	listPartnerExportRunsSQL = `
SELECT
    id,
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at
FROM partner_export_runs
WHERE $1::bigint IS NULL OR organisation_id = $1
ORDER BY created_at DESC, id DESC`

	upsertIntegrationStatusCheckSQL = `
INSERT INTO integration_status_checks (
    organisation_id,
    check_name,
    status,
    summary,
    metadata,
    checked_at
)
VALUES ($1, $2, $3, $4, $5::jsonb, $6)
ON CONFLICT ((COALESCE(organisation_id, 0)), check_name) DO UPDATE SET
    status = EXCLUDED.status,
    summary = EXCLUDED.summary,
    metadata = EXCLUDED.metadata,
    checked_at = EXCLUDED.checked_at
RETURNING
    id,
    organisation_id,
    check_name,
    status,
    summary,
    metadata,
    checked_at`

	listIntegrationStatusChecksSQL = `
SELECT
    id,
    organisation_id,
    check_name,
    status,
    summary,
    metadata,
    checked_at
FROM integration_status_checks
WHERE $1::bigint IS NULL OR organisation_id = $1
ORDER BY checked_at DESC, id DESC`

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
        AND received_at >= $1
),
current_status_counts AS (
    SELECT
        (COUNT(*) FILTER (WHERE freshness = 'needs_confirmation'))::int AS needs_confirmation_count,
        (COUNT(*) FILTER (WHERE freshness = 'stale'))::int AS stale_count
    FROM current_status
),
median_status_age AS (
    SELECT
        percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (now() - COALESCE(last_reported_at, updated_at))) / 3600.0
        )::double precision AS median_current_status_age_hours
    FROM current_status
)
SELECT
    created_count,
    duplicate_count,
    conflict_count,
    validation_error_count,
    pending_count,
    needs_confirmation_count,
    stale_count,
    median_current_status_age_hours
FROM attempt_counts, pending_offline, current_status_counts, median_status_age`

	syncSummarySinceForReviewScopeSQL = `
WITH attempt_counts AS (
    SELECT
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'created'))::int AS created_count,
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'duplicate'))::int AS duplicate_count,
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'conflict'))::int AS conflict_count,
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'validation_error'))::int AS validation_error_count
    FROM report_sync_attempts
    LEFT JOIN clinics ON clinics.id = report_sync_attempts.clinic_id
    WHERE report_sync_attempts.received_at >= $1
        AND (
            (
                report_sync_attempts.clinic_id IS NOT NULL
                AND ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
            )
            OR $2 IN ('org_admin', 'system_admin')
        )
),
pending_offline AS (
    SELECT COUNT(*)::int AS pending_count
    FROM reports
    JOIN clinics ON clinics.id = reports.clinic_id
    WHERE reports.offline_created = true
        AND reports.review_state = 'pending'
        AND reports.received_at >= $1
        AND (
            ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
            OR $2 IN ('org_admin', 'system_admin')
        )
),
current_status_counts AS (
    SELECT
        (COUNT(*) FILTER (WHERE current_status.freshness = 'needs_confirmation'))::int AS needs_confirmation_count,
        (COUNT(*) FILTER (WHERE current_status.freshness = 'stale'))::int AS stale_count
    FROM current_status
    JOIN clinics ON clinics.id = current_status.clinic_id
    WHERE (
        ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
        OR $2 IN ('org_admin', 'system_admin')
    )
),
median_status_age AS (
    SELECT
        percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (now() - COALESCE(current_status.last_reported_at, current_status.updated_at))) / 3600.0
        )::double precision AS median_current_status_age_hours
    FROM current_status
    JOIN clinics ON clinics.id = current_status.clinic_id
    WHERE (
        ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
        OR $2 IN ('org_admin', 'system_admin')
    )
)
SELECT
    created_count,
    duplicate_count,
    conflict_count,
    validation_error_count,
    pending_count,
    needs_confirmation_count,
    stale_count,
    median_current_status_age_hours
FROM attempt_counts, pending_offline, current_status_counts, median_status_age`

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

func (s Store) GetPendingReportByPayload(ctx context.Context, input CreateReportInput) (Report, error) {
	normalized := normalizePendingCreateReportInput(input)
	return scanReport(s.pool.QueryRow(ctx, getPendingReportByPayloadSQL,
		normalized.ClinicID,
		normalized.Source,
		normalized.Status,
		normalized.Reason,
		normalized.StaffPressure,
		normalized.StockPressure,
		normalized.QueuePressure,
		normalized.Notes,
		normalized.SubmittedByUserID,
	))
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
		nullableTrimmedStringArg(normalized.ClinicID),
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

func (s Store) CreatePartnerAPIKey(ctx context.Context, input CreatePartnerAPIKeyInput) (PartnerAPIKey, error) {
	normalized, err := normalizeCreatePartnerAPIKeyInput(input)
	if err != nil {
		return PartnerAPIKey{}, err
	}

	scopesJSON, err := json.Marshal(normalized.Scopes)
	if err != nil {
		return PartnerAPIKey{}, err
	}
	allowedDistrictsJSON, err := json.Marshal(normalized.AllowedDistricts)
	if err != nil {
		return PartnerAPIKey{}, err
	}

	return scanPartnerAPIKey(s.pool.QueryRow(ctx, insertPartnerAPIKeySQL,
		normalized.OrganisationID,
		normalized.Name,
		normalized.Environment,
		normalized.KeyPrefix,
		normalized.KeyHash,
		string(scopesJSON),
		string(allowedDistrictsJSON),
		normalized.ExpiresAt,
		normalized.CreatedByUserID,
		normalized.CreatedAt,
	))
}

func (s Store) GetPartnerAPIKeyByHash(ctx context.Context, keyHash string) (PartnerAPIKey, error) {
	return scanPartnerAPIKey(s.pool.QueryRow(ctx, getPartnerAPIKeyByHashSQL, keyHash))
}

func (s Store) ListPartnerAPIKeys(ctx context.Context, organisationID *int64) ([]PartnerAPIKey, error) {
	rows, err := s.pool.Query(ctx, listPartnerAPIKeysSQL, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (PartnerAPIKey, error) {
		return scanPartnerAPIKey(row)
	})
}

func (s Store) TouchPartnerAPIKey(ctx context.Context, keyID int64, ipAddress string, usedAt time.Time) error {
	tag, err := s.pool.Exec(ctx, touchPartnerAPIKeySQL, keyID, ipAddress, usedAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() > 0 {
		return nil
	}

	return s.partnerAPIKeyStateError(ctx, keyID, usedAt)
}

func (s Store) RevokePartnerAPIKey(ctx context.Context, keyID int64, revokedAt time.Time) error {
	tag, err := s.pool.Exec(ctx, revokePartnerAPIKeySQL, keyID, revokedAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() > 0 {
		return nil
	}

	return s.partnerAPIKeyStateError(ctx, keyID, revokedAt)
}

func (s Store) CreatePartnerWebhookSubscription(ctx context.Context, input CreatePartnerWebhookSubscriptionInput) (PartnerWebhookSubscription, error) {
	normalized, err := normalizeCreatePartnerWebhookSubscriptionInput(input)
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}

	eventTypesJSON, err := json.Marshal(normalized.EventTypes)
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}
	lastTestMetadataJSON, err := json.Marshal(normalized.LastTestMetadata)
	if err != nil {
		return PartnerWebhookSubscription{}, err
	}

	return scanPartnerWebhookSubscription(s.pool.QueryRow(ctx, insertPartnerWebhookSubscriptionSQL,
		normalized.OrganisationID,
		normalized.Name,
		normalized.TargetURL,
		string(eventTypesJSON),
		normalized.SecretHash,
		normalized.Status,
		string(lastTestMetadataJSON),
		normalized.CreatedByUserID,
		normalized.CreatedAt,
	))
}

func (s Store) ListPartnerWebhookSubscriptions(ctx context.Context, organisationID *int64) ([]PartnerWebhookSubscription, error) {
	rows, err := s.pool.Query(ctx, listPartnerWebhookSubscriptionsSQL, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (PartnerWebhookSubscription, error) {
		return scanPartnerWebhookSubscription(row)
	})
}

func (s Store) CreatePartnerWebhookEvent(ctx context.Context, input CreatePartnerWebhookEventInput) (PartnerWebhookEvent, error) {
	normalized, err := normalizeCreatePartnerWebhookEventInput(input)
	if err != nil {
		return PartnerWebhookEvent{}, err
	}

	payloadJSON, err := json.Marshal(normalized.Payload)
	if err != nil {
		return PartnerWebhookEvent{}, err
	}
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return PartnerWebhookEvent{}, err
	}

	return scanPartnerWebhookEvent(s.pool.QueryRow(ctx, insertPartnerWebhookEventSQL,
		normalized.SubscriptionID,
		normalized.EventType,
		string(payloadJSON),
		string(metadataJSON),
		normalized.Status,
		normalized.AttemptCount,
		normalized.LastError,
		normalized.CreatedAt,
		normalized.DeliveredAt,
	))
}

func (s Store) ListPartnerWebhookEvents(ctx context.Context, organisationID *int64) ([]PartnerWebhookEvent, error) {
	rows, err := s.pool.Query(ctx, listPartnerWebhookEventsSQL, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (PartnerWebhookEvent, error) {
		return scanPartnerWebhookEvent(row)
	})
}

func (s Store) CreatePartnerExportRun(ctx context.Context, input CreatePartnerExportRunInput) (PartnerExportRun, error) {
	normalized, err := normalizeCreatePartnerExportRunInput(input)
	if err != nil {
		return PartnerExportRun{}, err
	}

	scopeJSON, err := json.Marshal(normalized.Scope)
	if err != nil {
		return PartnerExportRun{}, err
	}
	recordCountsJSON, err := json.Marshal(normalized.RecordCounts)
	if err != nil {
		return PartnerExportRun{}, err
	}
	payloadJSON, err := json.Marshal(normalized.Payload)
	if err != nil {
		return PartnerExportRun{}, err
	}

	return scanPartnerExportRun(s.pool.QueryRow(ctx, insertPartnerExportRunSQL,
		normalized.OrganisationID,
		normalized.RequestedByUserID,
		normalized.Format,
		string(scopeJSON),
		string(recordCountsJSON),
		normalized.Checksum,
		string(payloadJSON),
		normalized.CreatedAt,
	))
}

func (s Store) GetPartnerExportRun(ctx context.Context, exportID int64) (PartnerExportRun, error) {
	return scanPartnerExportRun(s.pool.QueryRow(ctx, getPartnerExportRunSQL, exportID))
}

func (s Store) GetPartnerExportRunForOrganisation(ctx context.Context, organisationID *int64, exportID int64) (PartnerExportRun, error) {
	return scanPartnerExportRun(s.pool.QueryRow(ctx, getPartnerExportRunForOrganisationSQL, organisationID, exportID))
}

func (s Store) GetLatestPartnerExportRun(ctx context.Context, organisationID *int64) (PartnerExportRun, error) {
	return scanPartnerExportRun(s.pool.QueryRow(ctx, getLatestPartnerExportRunSQL, organisationID))
}

func (s Store) UpsertIntegrationStatusCheck(ctx context.Context, input UpsertIntegrationStatusCheckInput) (IntegrationStatusCheck, error) {
	normalized, err := normalizeUpsertIntegrationStatusCheckInput(input)
	if err != nil {
		return IntegrationStatusCheck{}, err
	}

	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return IntegrationStatusCheck{}, err
	}

	return scanIntegrationStatusCheck(s.pool.QueryRow(ctx, upsertIntegrationStatusCheckSQL,
		normalized.OrganisationID,
		normalized.CheckName,
		normalized.Status,
		normalized.Summary,
		string(metadataJSON),
		normalized.CheckedAt,
	))
}

func (s Store) ListIntegrationStatusChecks(ctx context.Context, organisationID *int64) ([]IntegrationStatusCheck, error) {
	rows, err := s.pool.Query(ctx, listIntegrationStatusChecksSQL, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (IntegrationStatusCheck, error) {
		return scanIntegrationStatusCheck(row)
	})
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

func (s Store) GetSyncSummarySince(ctx context.Context, since time.Time) (SyncSummary, error) {
	var summary SyncSummary
	var medianAge sql.NullFloat64
	summary.WindowStartedAt = since

	if err := s.pool.QueryRow(ctx, syncSummarySinceSQL, since).Scan(
		&summary.OfflineReportsReceived,
		&summary.DuplicateSyncsHandled,
		&summary.ConflictsNeedingAttention,
		&summary.ValidationFailures,
		&summary.PendingOfflineReports,
		&summary.NeedsConfirmationClinics,
		&summary.StaleClinics,
		&medianAge,
	); err != nil {
		return SyncSummary{}, err
	}
	summary.MedianCurrentStatusAgeHours = nullFloat64Ptr(medianAge)

	return summary, nil
}

func (s Store) GetSyncSummarySinceForReviewScope(ctx context.Context, since time.Time, scope ReportReviewScope) (SyncSummary, error) {
	var summary SyncSummary
	var medianAge sql.NullFloat64
	summary.WindowStartedAt = since

	if err := s.pool.QueryRow(ctx, syncSummarySinceForReviewScopeSQL, since, scope.Role, scope.District).Scan(
		&summary.OfflineReportsReceived,
		&summary.DuplicateSyncsHandled,
		&summary.ConflictsNeedingAttention,
		&summary.ValidationFailures,
		&summary.PendingOfflineReports,
		&summary.NeedsConfirmationClinics,
		&summary.StaleClinics,
		&medianAge,
	); err != nil {
		return SyncSummary{}, err
	}
	summary.MedianCurrentStatusAgeHours = nullFloat64Ptr(medianAge)

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

func (s Store) ListCurrentStatusesForReviewScope(ctx context.Context, scope ReportReviewScope) ([]CurrentStatus, error) {
	rows, err := s.pool.Query(ctx, listCurrentStatusesForReviewScopeSQL, scope.Role, scope.District)
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

func (s Store) listPartnerExportRuns(ctx context.Context, organisationID *int64) ([]PartnerExportRun, error) {
	rows, err := s.pool.Query(ctx, listPartnerExportRunsSQL, organisationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (PartnerExportRun, error) {
		return scanPartnerExportRun(row)
	})
}

func (s Store) partnerAPIKeyStateError(ctx context.Context, keyID int64, at time.Time) error {
	var revokedAt sql.NullTime
	var expiresAt sql.NullTime
	if err := s.pool.QueryRow(ctx, getPartnerAPIKeyStateSQL, keyID).Scan(&revokedAt, &expiresAt); err != nil {
		return err
	}
	if revokedAt.Valid {
		return ErrPartnerAPIKeyRevoked
	}
	if expiresAt.Valid && !expiresAt.Time.After(at) {
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
	var clinicID sql.NullString
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
		&clinicID,
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
	if clinicID.Valid {
		attempt.ClinicID = clinicID.String
	}
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

func scanPartnerAPIKey(row pgx.Row) (PartnerAPIKey, error) {
	var apiKey PartnerAPIKey
	var organisationID sql.NullInt64
	var expiresAt sql.NullTime
	var revokedAt sql.NullTime
	var lastUsedAt sql.NullTime
	var lastUsedIP sql.NullString
	var createdByUserID sql.NullInt64
	var scopesJSON []byte
	var allowedDistrictsJSON []byte

	if err := row.Scan(
		&apiKey.ID,
		&organisationID,
		&apiKey.Name,
		&apiKey.Environment,
		&apiKey.KeyPrefix,
		&apiKey.KeyHash,
		&scopesJSON,
		&allowedDistrictsJSON,
		&expiresAt,
		&revokedAt,
		&lastUsedAt,
		&lastUsedIP,
		&createdByUserID,
		&apiKey.CreatedAt,
		&apiKey.UpdatedAt,
	); err != nil {
		return PartnerAPIKey{}, err
	}

	apiKey.OrganisationID = nullInt64Ptr(organisationID)
	apiKey.ExpiresAt = nullTimePtr(expiresAt)
	apiKey.RevokedAt = nullTimePtr(revokedAt)
	apiKey.LastUsedAt = nullTimePtr(lastUsedAt)
	apiKey.LastUsedIP = nullStringPtr(lastUsedIP)
	apiKey.CreatedByUserID = nullInt64Ptr(createdByUserID)
	if err := unmarshalStringSlice(scopesJSON, &apiKey.Scopes); err != nil {
		return PartnerAPIKey{}, err
	}
	if err := unmarshalStringSlice(allowedDistrictsJSON, &apiKey.AllowedDistricts); err != nil {
		return PartnerAPIKey{}, err
	}

	return apiKey, nil
}

func scanPartnerWebhookSubscription(row pgx.Row) (PartnerWebhookSubscription, error) {
	var subscription PartnerWebhookSubscription
	var organisationID sql.NullInt64
	var lastTestedAt sql.NullTime
	var lastTestStatus sql.NullString
	var lastError sql.NullString
	var createdByUserID sql.NullInt64
	var eventTypesJSON []byte
	var lastTestMetadataJSON []byte

	if err := row.Scan(
		&subscription.ID,
		&organisationID,
		&subscription.Name,
		&subscription.TargetURL,
		&eventTypesJSON,
		&subscription.SecretHash,
		&subscription.Status,
		&lastTestedAt,
		&lastTestStatus,
		&lastTestMetadataJSON,
		&lastError,
		&createdByUserID,
		&subscription.CreatedAt,
		&subscription.UpdatedAt,
	); err != nil {
		return PartnerWebhookSubscription{}, err
	}

	subscription.OrganisationID = nullInt64Ptr(organisationID)
	subscription.LastTestedAt = nullTimePtr(lastTestedAt)
	subscription.LastTestStatus = nullStringPtr(lastTestStatus)
	subscription.LastError = nullStringPtr(lastError)
	subscription.CreatedByUserID = nullInt64Ptr(createdByUserID)
	if err := unmarshalStringSlice(eventTypesJSON, &subscription.EventTypes); err != nil {
		return PartnerWebhookSubscription{}, err
	}
	if err := unmarshalMap(lastTestMetadataJSON, &subscription.LastTestMetadata); err != nil {
		return PartnerWebhookSubscription{}, err
	}

	return subscription, nil
}

func scanPartnerWebhookEvent(row pgx.Row) (PartnerWebhookEvent, error) {
	var event PartnerWebhookEvent
	var lastError sql.NullString
	var deliveredAt sql.NullTime
	var payloadJSON []byte
	var metadataJSON []byte

	if err := row.Scan(
		&event.ID,
		&event.SubscriptionID,
		&event.EventType,
		&payloadJSON,
		&metadataJSON,
		&event.Status,
		&event.AttemptCount,
		&lastError,
		&event.CreatedAt,
		&deliveredAt,
	); err != nil {
		return PartnerWebhookEvent{}, err
	}

	event.LastError = nullStringPtr(lastError)
	event.DeliveredAt = nullTimePtr(deliveredAt)
	if err := unmarshalMap(payloadJSON, &event.Payload); err != nil {
		return PartnerWebhookEvent{}, err
	}
	if err := unmarshalMap(metadataJSON, &event.Metadata); err != nil {
		return PartnerWebhookEvent{}, err
	}

	return event, nil
}

func scanPartnerExportRun(row pgx.Row) (PartnerExportRun, error) {
	var exportRun PartnerExportRun
	var organisationID sql.NullInt64
	var requestedByUserID sql.NullInt64
	var scopeJSON []byte
	var recordCountsJSON []byte
	var payloadJSON []byte

	if err := row.Scan(
		&exportRun.ID,
		&organisationID,
		&requestedByUserID,
		&exportRun.Format,
		&scopeJSON,
		&recordCountsJSON,
		&exportRun.Checksum,
		&payloadJSON,
		&exportRun.CreatedAt,
	); err != nil {
		return PartnerExportRun{}, err
	}

	exportRun.OrganisationID = nullInt64Ptr(organisationID)
	exportRun.RequestedByUserID = nullInt64Ptr(requestedByUserID)
	if err := unmarshalMap(scopeJSON, &exportRun.Scope); err != nil {
		return PartnerExportRun{}, err
	}
	if err := unmarshalMap(recordCountsJSON, &exportRun.RecordCounts); err != nil {
		return PartnerExportRun{}, err
	}
	if err := unmarshalMap(payloadJSON, &exportRun.Payload); err != nil {
		return PartnerExportRun{}, err
	}

	return exportRun, nil
}

func scanIntegrationStatusCheck(row pgx.Row) (IntegrationStatusCheck, error) {
	var check IntegrationStatusCheck
	var organisationID sql.NullInt64
	var metadataJSON []byte

	if err := row.Scan(
		&check.ID,
		&organisationID,
		&check.CheckName,
		&check.Status,
		&check.Summary,
		&metadataJSON,
		&check.CheckedAt,
	); err != nil {
		return IntegrationStatusCheck{}, err
	}

	check.OrganisationID = nullInt64Ptr(organisationID)
	if err := unmarshalMap(metadataJSON, &check.Metadata); err != nil {
		return IntegrationStatusCheck{}, err
	}

	return check, nil
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
