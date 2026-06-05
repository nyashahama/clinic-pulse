-- name: InsertPartnerAPIKey :one
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
    host(last_used_ip) AS last_used_ip,
    created_by_user_id,
    created_at,
    updated_at;

-- name: GetPartnerAPIKeyByHash :one
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
    host(last_used_ip) AS last_used_ip,
    created_by_user_id,
    created_at,
    updated_at
FROM partner_api_keys
WHERE key_hash = $1;

-- name: ListPartnerAPIKeys :many
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
    host(last_used_ip) AS last_used_ip,
    created_by_user_id,
    created_at,
    updated_at
FROM partner_api_keys
WHERE sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY created_at DESC, id DESC;

-- name: TouchPartnerAPIKey :execrows
UPDATE partner_api_keys
SET
    last_used_at = $3,
    last_used_ip = NULLIF($2, '')::inet,
    updated_at = $3
WHERE id = $1
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > $3);

-- name: RevokePartnerAPIKey :execrows
UPDATE partner_api_keys
SET
    revoked_at = $2,
    updated_at = $2
WHERE id = $1
    AND revoked_at IS NULL;

-- name: GetPartnerAPIKeyState :one
SELECT
    revoked_at,
    expires_at
FROM partner_api_keys
WHERE id = $1;

-- name: InsertPartnerWebhookSubscription :one
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
    updated_at;

-- name: ListPartnerWebhookSubscriptions :many
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
WHERE sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY created_at DESC, id DESC;

-- name: InsertPartnerWebhookEvent :one
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
    delivered_at;

-- name: ListPartnerWebhookEvents :many
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
WHERE sqlc.narg('organisation_id') IS NULL OR partner_webhook_subscriptions.organisation_id = sqlc.narg('organisation_id')
ORDER BY partner_webhook_events.created_at DESC, partner_webhook_events.id DESC;

-- name: InsertPartnerExportRun :one
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
    created_at;

-- name: GetPartnerExportRun :one
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
WHERE id = $1;

-- name: GetPartnerExportRunForOrganisation :one
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
WHERE id = $1
    AND (sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id'));

-- name: GetLatestPartnerExportRun :one
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
WHERE sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY created_at DESC, id DESC
LIMIT 1;

-- name: ListPartnerExportRuns :many
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
WHERE sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY created_at DESC, id DESC;

-- name: UpsertIntegrationStatusCheck :one
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
    checked_at;

-- name: ListIntegrationStatusChecks :many
SELECT
    id,
    organisation_id,
    check_name,
    status,
    summary,
    metadata,
    checked_at
FROM integration_status_checks
WHERE sqlc.narg('organisation_id') IS NULL OR organisation_id = sqlc.narg('organisation_id')
ORDER BY checked_at DESC, id DESC;
