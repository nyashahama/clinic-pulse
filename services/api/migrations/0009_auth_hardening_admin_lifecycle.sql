ALTER TABLE users
    ADD COLUMN password_changed_at TIMESTAMPTZ,
    ADD COLUMN password_reset_required BOOLEAN NOT NULL DEFAULT false;

UPDATE users
SET password_changed_at = updated_at
WHERE password_hash IS NOT NULL
    AND password_changed_at IS NULL;

CREATE INDEX users_disabled_at_idx ON users (disabled_at)
    WHERE disabled_at IS NOT NULL;

CREATE INDEX users_password_reset_required_idx ON users (password_reset_required)
    WHERE password_reset_required = true;

CREATE VIEW admin_user_access AS
SELECT
    users.id AS user_id,
    users.email,
    users.display_name,
    users.disabled_at,
    users.created_at,
    organisation_memberships.id AS membership_id,
    organisation_memberships.role,
    organisation_memberships.organisation_id,
    organisation_memberships.district,
    max(sessions.last_seen_at) AS last_seen_at
FROM users
JOIN organisation_memberships ON organisation_memberships.user_id = users.id
LEFT JOIN sessions ON sessions.user_id = users.id
    AND sessions.revoked_at IS NULL
    AND sessions.expires_at > now()
GROUP BY users.id, organisation_memberships.id;
