-- name: GetReportByExternalID :one
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
    visit_verification,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes
FROM reports
WHERE external_id = $1;

-- name: GetPendingReportByPayload :one
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
    visit_verification,
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
    AND submitted_by_user_id IS NOT DISTINCT FROM $8::bigint
ORDER BY received_at DESC, id DESC
LIMIT 1;

-- name: GetRecentReportByPayload :one
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
    visit_verification,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes
FROM reports
WHERE received_at >= $9
    AND clinic_id = $1
    AND source = $2
    AND status = $3
    AND reason IS NOT DISTINCT FROM $4::text
    AND staff_pressure IS NOT DISTINCT FROM $5::text
    AND stock_pressure IS NOT DISTINCT FROM $6::text
    AND queue_pressure IS NOT DISTINCT FROM $7::text
    AND submitted_by_user_id IS NOT DISTINCT FROM $8::bigint
ORDER BY received_at DESC, id DESC
LIMIT 1;

-- name: ListClinicReports :many
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
    visit_verification,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes
FROM reports
WHERE clinic_id = $1
ORDER BY received_at DESC, id DESC;

-- name: ListPendingReports :many
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
    reports.visit_verification,
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
ORDER BY reports.received_at DESC, reports.id DESC;

-- name: InsertReport :one
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
    visit_verification,
    submitted_by_user_id
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
    visit_verification,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes;

-- name: GetReportForReview :one
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
    visit_verification,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes
FROM reports
WHERE id = $1
FOR UPDATE;

-- name: InsertReportReview :exec
INSERT INTO report_reviews (
    report_id,
    reviewer_user_id,
    organisation_id,
    decision,
    notes,
    metadata,
    created_at
)
VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, $6);

-- name: UpdateReportReviewState :one
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
    visit_verification,
    submitted_by_user_id,
    reviewed_by_user_id,
    reviewed_at,
    review_notes;
