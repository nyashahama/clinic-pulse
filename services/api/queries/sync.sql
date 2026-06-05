-- name: InsertReportSyncAttempt :one
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
    metadata;

-- name: SyncSummarySince :one
WITH attempt_counts AS (
    SELECT
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'created'))::int AS created_count,
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'duplicate'))::int AS duplicate_count,
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'conflict'))::int AS conflict_count,
        (COUNT(*) FILTER (WHERE report_sync_attempts.result = 'validation_error'))::int AS validation_error_count
    FROM report_sync_attempts
    WHERE report_sync_attempts.received_at >= $1
),
pending_offline AS (
    SELECT COUNT(*)::int AS pending_count
    FROM reports
    WHERE reports.offline_created = true
        AND reports.review_state = 'pending'
        AND reports.received_at >= $1
),
current_status_counts AS (
    SELECT
        COUNT(*)::int AS total_count,
        (COUNT(*) FILTER (WHERE current_status.freshness = 'needs_confirmation'))::int AS needs_confirmation_count,
        (COUNT(*) FILTER (WHERE current_status.freshness = 'stale'))::int AS stale_count
    FROM current_status
),
median_status_age AS (
    SELECT
        percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (now() - COALESCE(current_status.last_reported_at, current_status.updated_at))) / 3600.0
        ) AS median_current_status_age_hours
    FROM current_status
)
SELECT
    created_count,
    duplicate_count,
    conflict_count,
    validation_error_count,
    pending_count,
    total_count,
    needs_confirmation_count,
    stale_count,
    median_current_status_age_hours
FROM attempt_counts, pending_offline, current_status_counts, median_status_age;

-- name: SyncSummarySinceForReviewScope :one
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
            ($2 = 'reporter' AND $4::bigint IS NOT NULL AND report_sync_attempts.submitted_by_user_id = $4)
            OR
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
            ($2 = 'reporter' AND $4::bigint IS NOT NULL AND reports.submitted_by_user_id = $4)
            OR ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
            OR $2 IN ('org_admin', 'system_admin')
        )
),
current_status_counts AS (
    SELECT
        COUNT(*)::int AS total_count,
        (COUNT(*) FILTER (WHERE current_status.freshness = 'needs_confirmation'))::int AS needs_confirmation_count,
        (COUNT(*) FILTER (WHERE current_status.freshness = 'stale'))::int AS stale_count
    FROM current_status
    JOIN clinics ON clinics.id = current_status.clinic_id
    WHERE (
        (
            $2 = 'reporter'
            AND $4::bigint IS NOT NULL
            AND (
                EXISTS (
                    SELECT 1
                    FROM report_sync_attempts reporter_attempts
                    WHERE reporter_attempts.submitted_by_user_id = $4
                        AND reporter_attempts.clinic_id = current_status.clinic_id
                        AND reporter_attempts.received_at >= $1
                )
                OR EXISTS (
                    SELECT 1
                    FROM reports reporter_reports
                    WHERE reporter_reports.submitted_by_user_id = $4
                        AND reporter_reports.clinic_id = current_status.clinic_id
                        AND reporter_reports.received_at >= $1
                )
            )
        )
        OR ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
        OR $2 IN ('org_admin', 'system_admin')
    )
),
median_status_age AS (
    SELECT
        percentile_cont(0.5) WITHIN GROUP (
            ORDER BY EXTRACT(EPOCH FROM (now() - COALESCE(current_status.last_reported_at, current_status.updated_at))) / 3600.0
        ) AS median_current_status_age_hours
    FROM current_status
    JOIN clinics ON clinics.id = current_status.clinic_id
    WHERE (
        (
            $2 = 'reporter'
            AND $4::bigint IS NOT NULL
            AND (
                EXISTS (
                    SELECT 1
                    FROM report_sync_attempts reporter_attempts
                    WHERE reporter_attempts.submitted_by_user_id = $4
                        AND reporter_attempts.clinic_id = current_status.clinic_id
                        AND reporter_attempts.received_at >= $1
                )
                OR EXISTS (
                    SELECT 1
                    FROM reports reporter_reports
                    WHERE reporter_reports.submitted_by_user_id = $4
                        AND reporter_reports.clinic_id = current_status.clinic_id
                        AND reporter_reports.received_at >= $1
                )
            )
        )
        OR ($2 = 'district_manager' AND $3::text IS NOT NULL AND clinics.district = $3)
        OR $2 IN ('org_admin', 'system_admin')
    )
)
SELECT
    created_count,
    duplicate_count,
    conflict_count,
    validation_error_count,
    pending_count,
    total_count,
    needs_confirmation_count,
    stale_count,
    median_current_status_age_hours
FROM attempt_counts, pending_offline, current_status_counts, median_status_age;
