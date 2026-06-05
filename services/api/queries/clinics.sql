-- clinics

-- name: ListClinics :many
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
ORDER BY name;

-- name: GetClinic :one
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
WHERE id = $1;

-- name: GetClinicDistrict :one
SELECT district FROM clinics WHERE id = $1;

-- name: ListClinicServices :many
SELECT
    clinic_id,
    service_name,
    current_availability,
    confidence_score::double precision,
    last_verified_at
FROM clinic_services
WHERE clinic_id = $1
ORDER BY service_name;

-- name: GetCurrentStatus :one
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
WHERE clinic_id = $1;

-- name: GetCurrentStatusForUpdate :one
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
FOR UPDATE;

-- name: UpsertCurrentStatus :one
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
    updated_at;

-- name: ListCurrentStatuses :many
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
ORDER BY clinic_id;

-- name: ListCurrentStatusesForReviewScope :many
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
ORDER BY current_status.clinic_id;

-- name: UpdateCurrentStatusFreshness :one
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
    updated_at;

-- name: VerifyClinicExists :one
SELECT id FROM clinics WHERE id = $1;
