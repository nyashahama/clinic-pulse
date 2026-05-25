-- name: GetUserByEmail :one
SELECT * FROM users
WHERE lower(email) = lower(sqlc.arg(email));

-- name: CreateUser :one
INSERT INTO users (email, display_name, password_hash, password_reset_required, password_changed_at)
VALUES (
    sqlc.arg(email),
    sqlc.arg(display_name),
    sqlc.narg(password_hash),
    sqlc.arg(password_reset_required),
    CASE WHEN sqlc.narg(password_hash)::text IS NULL THEN NULL ELSE now() END
)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = sqlc.arg(id);

-- name: UpdateUserLifecycle :one
UPDATE users
SET
    display_name = COALESCE(sqlc.narg(display_name), display_name),
    disabled_at = CASE
        WHEN sqlc.narg(disabled)::boolean IS NULL THEN disabled_at
        WHEN sqlc.narg(disabled)::boolean THEN COALESCE(disabled_at, sqlc.arg(updated_at))
        ELSE NULL
    END,
    updated_at = sqlc.arg(updated_at)
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: UpdateUserPassword :one
UPDATE users
SET password_hash = sqlc.arg(password_hash),
    password_changed_at = now(),
    password_reset_required = false,
    updated_at = now()
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: DisableUser :execrows
UPDATE users SET disabled_at = sqlc.arg(disabled_at), updated_at = now() WHERE id = sqlc.arg(id) AND disabled_at IS NULL;

-- name: EnableUser :execrows
UPDATE users SET disabled_at = NULL, updated_at = now() WHERE id = sqlc.arg(id);

-- name: RevokeSession :execrows
UPDATE sessions
SET revoked_at = now()
WHERE token_hash = sqlc.arg(token_hash)
    AND revoked_at IS NULL
    AND expires_at > now();

-- name: RevokeActiveSessionsForUser :execrows
UPDATE sessions SET revoked_at = now() WHERE user_id = sqlc.arg(user_id) AND revoked_at IS NULL AND expires_at > now();
