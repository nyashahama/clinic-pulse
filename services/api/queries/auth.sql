-- name: GetUserByEmail :one
SELECT
    id,
    email,
    display_name,
    password_hash,
    disabled_at,
    password_changed_at,
    password_reset_required,
    created_at,
    updated_at
FROM users
WHERE lower(email) = lower($1);

-- name: CreateUser :one
INSERT INTO users (email, display_name, password_hash, password_reset_required, password_changed_at)
VALUES ($1, $2, $3, $4, CASE WHEN $3::text IS NULL THEN NULL ELSE now() END)
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at;

-- name: CreateSession :one
INSERT INTO sessions (
    user_id,
    token_hash,
    expires_at,
    user_agent,
    ip_address
)
VALUES ($1, $2, $3, $4, $5)
RETURNING
    id,
    user_id,
    token_hash,
    created_at,
    expires_at,
    revoked_at,
    last_seen_at,
    user_agent,
    ip_address::text;

-- name: GetSessionByTokenHash :one
WITH active_session (
    session_id,
    session_user_id,
    session_token_hash,
    session_created_at,
    session_expires_at,
    session_revoked_at,
    session_last_seen_at,
    session_user_agent,
    session_ip_address,
    user_id,
    user_email,
    user_display_name,
    user_password_hash,
    user_disabled_at,
    user_password_changed_at,
    user_password_reset_required,
    user_created_at,
    user_updated_at
) AS (
    UPDATE sessions AS s
    SET last_seen_at = now()
    FROM users AS u
    WHERE s.user_id = u.id
        AND s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
        AND u.disabled_at IS NULL
    RETURNING
        s.id,
        s.user_id,
        s.token_hash,
        s.created_at,
        s.expires_at,
        s.revoked_at,
        s.last_seen_at,
        s.user_agent,
        s.ip_address::text,
        u.id,
        u.email,
        u.display_name,
        u.password_hash,
        u.disabled_at,
        u.password_changed_at,
        u.password_reset_required,
        u.created_at,
        u.updated_at
)
SELECT
    session_id,
    session_user_id,
    session_token_hash,
    session_created_at,
    session_expires_at,
    session_revoked_at,
    session_last_seen_at,
    session_user_agent,
    session_ip_address,
    user_id,
    user_email,
    user_display_name,
    user_password_hash,
    user_disabled_at,
    user_password_changed_at,
    user_password_reset_required,
    user_created_at,
    user_updated_at
FROM active_session;

-- name: DisableUser :execrows
UPDATE users SET disabled_at = $2, updated_at = now() WHERE id = $1 AND disabled_at IS NULL;

-- name: EnableUser :execrows
UPDATE users SET disabled_at = NULL, updated_at = now() WHERE id = $1;

-- name: RevokeSession :exec
UPDATE sessions
SET revoked_at = now()
WHERE token_hash = $1
    AND revoked_at IS NULL
    AND expires_at > now();

-- name: RevokeActiveSessionsForUser :execrows
UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now();

-- name: GetUserByID :one
SELECT id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at
FROM users
WHERE id = $1;

-- name: GetAdminUserAccessByUserID :one
SELECT user_id, email, display_name, disabled_at, created_at, role, organisation_id, district, last_seen_at
FROM admin_user_access
WHERE user_id = $1
ORDER BY
    CASE role
        WHEN 'system_admin' THEN 4
        WHEN 'org_admin' THEN 3
        WHEN 'district_manager' THEN 2
        WHEN 'reporter' THEN 1
        ELSE 0
    END DESC,
    organisation_id NULLS FIRST,
    district NULLS FIRST,
    membership_id
LIMIT 1;

-- name: UpdateUserLifecycle :one
UPDATE users
SET
    display_name = COALESCE(NULLIF($2, ''), display_name),
    disabled_at = CASE WHEN $3::boolean THEN COALESCE(disabled_at, $4) ELSE NULL END,
    updated_at = $4
WHERE id = $1
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at;

-- name: UpdateUserLifecycleName :one
UPDATE users
SET
    display_name = COALESCE(NULLIF($2, ''), display_name),
    updated_at = $3
WHERE id = $1
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at;

-- name: UpdateUserPassword :one
UPDATE users
SET password_hash = $2,
    password_changed_at = now(),
    password_reset_required = false,
    updated_at = now()
WHERE id = $1
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at;

-- name: LockUserForMembershipReplacement :one
SELECT id
FROM users
WHERE id = $1
FOR UPDATE;

-- name: DeleteOrganisationMembershipsForUser :exec
DELETE FROM organisation_memberships
WHERE user_id = $1;

-- name: InsertOrganisationMembership :one
INSERT INTO organisation_memberships (user_id, organisation_id, role, district)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, organisation_id, role, district, created_at;

-- name: ListMembershipsForUser :many
SELECT
    id,
    user_id,
    organisation_id,
    role,
    district,
    created_at
FROM organisation_memberships
WHERE user_id = $1
ORDER BY role, organisation_id NULLS FIRST, district NULLS FIRST, id;

-- name: ListAdminUserAccess :many
SELECT
    users.id,
    users.email,
    users.display_name,
    users.disabled_at,
    users.created_at,
    organisation_memberships.role,
    organisation_memberships.organisation_id,
    organisation_memberships.district,
    max(sessions.last_seen_at) AS last_seen_at
FROM users
JOIN organisation_memberships ON organisation_memberships.user_id = users.id
LEFT JOIN sessions ON sessions.user_id = users.id AND sessions.revoked_at IS NULL AND sessions.expires_at > now()
WHERE sqlc.narg('organisation_id')::bigint IS NULL OR organisation_memberships.organisation_id = sqlc.narg('organisation_id')
GROUP BY users.id, organisation_memberships.id
ORDER BY organisation_memberships.role, users.display_name, users.id;
