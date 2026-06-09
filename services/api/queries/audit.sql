-- name: InsertAuditEvent :one
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
    metadata;

-- name: ListClinicAuditEvents :many
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
ORDER BY created_at DESC, id DESC;

-- name: ListAdminAuditEvents :many
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
WHERE sqlc.narg('organisation_id')::bigint IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY created_at DESC, id DESC
LIMIT sqlc.arg('limit');
