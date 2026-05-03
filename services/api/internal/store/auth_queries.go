package store

import (
	"context"
	"database/sql"
	"errors"
	"net/netip"
	"strconv"

	"github.com/jackc/pgx/v5"
)

var ErrInvalidSessionIPAddress = errors.New("invalid session IP address")

const (
	getUserByEmailSQL = `
SELECT
    id,
    email,
    display_name,
    password_hash,
    disabled_at,
    created_at,
    updated_at
FROM users
WHERE lower(email) = lower($1)`

	createSessionSQL = `
INSERT INTO sessions (
    user_id,
    token_hash,
    expires_at,
    user_agent,
    ip_address
)
VALUES ($1, $2, $3, $4, $5::inet)
RETURNING
    id,
    user_id,
    token_hash,
    created_at,
    expires_at,
    revoked_at,
    last_seen_at,
    user_agent,
    host(ip_address)`

	getSessionByTokenHashSQL = `
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
        host(s.ip_address),
        u.id,
        u.email,
        u.display_name,
        u.password_hash,
        u.disabled_at,
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
    user_created_at,
    user_updated_at
FROM active_session`

	revokeSessionSQL = `
UPDATE sessions
SET revoked_at = now()
WHERE token_hash = $1
    AND revoked_at IS NULL
    AND expires_at > now()`

	listMembershipsForUserSQL = `
SELECT
    id,
    organisation_id,
    user_id,
    role,
    district,
    created_at
FROM organisation_memberships
WHERE user_id = $1
ORDER BY role, organisation_id NULLS FIRST, district NULLS FIRST, id`
)

func (s Store) GetUserByEmail(ctx context.Context, email string) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, getUserByEmailSQL, email))
}

func (s Store) CreateSession(ctx context.Context, input CreateSessionInput) (Session, error) {
	normalized, err := normalizeCreateSessionInput(input)
	if err != nil {
		return Session{}, err
	}

	return scanSession(s.pool.QueryRow(ctx, createSessionSQL,
		normalized.UserID,
		normalized.TokenHash,
		normalized.ExpiresAt,
		normalized.UserAgent,
		normalized.IPAddress,
	))
}

func (s Store) CreateSessionWithAuditTx(ctx context.Context, input CreateSessionWithAuditInput) (Session, AuditEvent, error) {
	normalizedSession, err := normalizeCreateSessionInput(input.Session)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	session, err := scanSession(tx.QueryRow(ctx, createSessionSQL,
		normalizedSession.UserID,
		normalizedSession.TokenHash,
		normalizedSession.ExpiresAt,
		normalizedSession.UserAgent,
		normalizedSession.IPAddress,
	))
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	auditEvent, err := insertAuditEvent(ctx, tx, auditEventForSession(input.AuditEvent, session))
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Session{}, AuditEvent{}, err
	}

	return session, auditEvent, nil
}

func (s Store) GetSessionByTokenHash(ctx context.Context, tokenHash string) (Session, User, error) {
	return scanSessionWithUser(s.pool.QueryRow(ctx, getSessionByTokenHashSQL, tokenHash))
}

func (s Store) RevokeSession(ctx context.Context, tokenHash string) error {
	_, err := s.pool.Exec(ctx, revokeSessionSQL, tokenHash)
	return err
}

func (s Store) ListMembershipsForUser(ctx context.Context, userID int64) ([]OrganisationMembership, error) {
	rows, err := s.pool.Query(ctx, listMembershipsForUserSQL, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (OrganisationMembership, error) {
		return scanOrganisationMembership(row)
	})
}

func scanSessionWithUser(row pgx.Row) (Session, User, error) {
	var session Session
	var user User
	var revokedAt sql.NullTime
	var lastSeenAt sql.NullTime
	var userAgent sql.NullString
	var ipAddress sql.NullString
	var passwordHash sql.NullString
	var disabledAt sql.NullTime

	if err := row.Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.CreatedAt,
		&session.ExpiresAt,
		&revokedAt,
		&lastSeenAt,
		&userAgent,
		&ipAddress,
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&passwordHash,
		&disabledAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return Session{}, User{}, err
	}

	session.RevokedAt = nullTimePtr(revokedAt)
	session.LastSeenAt = nullTimePtr(lastSeenAt)
	session.UserAgent = nullStringPtr(userAgent)
	session.IPAddress = nullStringPtr(ipAddress)
	user.PasswordHash = nullStringPtr(passwordHash)
	user.DisabledAt = nullTimePtr(disabledAt)

	return session, user, nil
}

func scanUser(row pgx.Row) (User, error) {
	var user User
	var passwordHash sql.NullString
	var disabledAt sql.NullTime

	if err := row.Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&passwordHash,
		&disabledAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return User{}, err
	}

	user.PasswordHash = nullStringPtr(passwordHash)
	user.DisabledAt = nullTimePtr(disabledAt)

	return user, nil
}

func scanSession(row pgx.Row) (Session, error) {
	var session Session
	var revokedAt sql.NullTime
	var lastSeenAt sql.NullTime
	var userAgent sql.NullString
	var ipAddress sql.NullString

	if err := row.Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.CreatedAt,
		&session.ExpiresAt,
		&revokedAt,
		&lastSeenAt,
		&userAgent,
		&ipAddress,
	); err != nil {
		return Session{}, err
	}

	session.RevokedAt = nullTimePtr(revokedAt)
	session.LastSeenAt = nullTimePtr(lastSeenAt)
	session.UserAgent = nullStringPtr(userAgent)
	session.IPAddress = nullStringPtr(ipAddress)

	return session, nil
}

func scanOrganisationMembership(row pgx.Row) (OrganisationMembership, error) {
	var membership OrganisationMembership
	var organisationID sql.NullInt64
	var district sql.NullString

	if err := row.Scan(
		&membership.ID,
		&organisationID,
		&membership.UserID,
		&membership.Role,
		&district,
		&membership.CreatedAt,
	); err != nil {
		return OrganisationMembership{}, err
	}

	if organisationID.Valid {
		membership.OrganisationID = &organisationID.Int64
	}
	membership.District = nullStringPtr(district)

	return membership, nil
}

func normalizeCreateSessionInput(input CreateSessionInput) (CreateSessionInput, error) {
	if input.IPAddress == nil {
		return input, nil
	}

	ip, err := netip.ParseAddr(*input.IPAddress)
	if err != nil {
		return CreateSessionInput{}, ErrInvalidSessionIPAddress
	}
	normalized := ip.String()
	input.IPAddress = &normalized

	return input, nil
}

func auditEventForSession(input CreateAuditEventInput, session Session) CreateAuditEventInput {
	entityType := "session"
	input.EntityType = &entityType
	entityID := strconv.FormatInt(session.ID, 10)
	input.EntityID = &entityID
	if input.CreatedAt.IsZero() {
		input.CreatedAt = session.CreatedAt
	}

	input.Metadata = cloneMetadata(input.Metadata)
	input.Metadata["sessionId"] = session.ID
	return input
}

func cloneMetadata(metadata map[string]any) map[string]any {
	cloned := make(map[string]any, len(metadata)+1)
	for key, value := range metadata {
		cloned[key] = value
	}
	return cloned
}
