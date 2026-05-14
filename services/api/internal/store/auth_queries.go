package store

import (
	"context"
	"database/sql"
	"errors"
	"net/netip"
	"strconv"
	"strings"
	"time"

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
    password_changed_at,
    password_reset_required,
    created_at,
    updated_at
FROM users
WHERE lower(email) = lower($1)`

	createUserSQL = `
INSERT INTO users (email, display_name, password_hash, password_reset_required, password_changed_at)
VALUES ($1, $2, $3, $4, CASE WHEN $3::text IS NULL THEN NULL ELSE now() END)
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at`

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
        host(s.ip_address),
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
FROM active_session`

	disableUserSQL = `
UPDATE users SET disabled_at = $2, updated_at = now() WHERE id = $1 AND disabled_at IS NULL`

	enableUserSQL = `
UPDATE users SET disabled_at = NULL, updated_at = now() WHERE id = $1`

	revokeSessionSQL = `
UPDATE sessions
SET revoked_at = now()
WHERE token_hash = $1
    AND revoked_at IS NULL
    AND expires_at > now()`

	revokeActiveSessionsForUserSQL = `
UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()`

	getUserByIDSQL = `
SELECT id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at
FROM users
WHERE id = $1`

	getAdminUserAccessByUserIDSQL = `
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
LIMIT 1`

	updateUserLifecycleSQL = `
UPDATE users
SET
    display_name = COALESCE($2, display_name),
    disabled_at = CASE WHEN $3::boolean IS NULL THEN disabled_at WHEN $3 THEN COALESCE(disabled_at, $4) ELSE NULL END,
    updated_at = $4
WHERE id = $1
RETURNING id, email, display_name, password_hash, disabled_at, password_changed_at, password_reset_required, created_at, updated_at`

	lockUserForMembershipReplacementSQL = `
SELECT id
FROM users
WHERE id = $1
FOR UPDATE`

	deleteOrganisationMembershipsForUserSQL = `
DELETE FROM organisation_memberships
WHERE user_id = $1`

	insertOrganisationMembershipSQL = `
INSERT INTO organisation_memberships (user_id, organisation_id, role, district)
VALUES ($1, $2, $3, $4)
RETURNING id, user_id, organisation_id, role, district, created_at`

	listMembershipsForUserSQL = `
SELECT
    id,
    user_id,
    organisation_id,
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

func (s Store) CreateUser(ctx context.Context, input CreateUserInput) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, createUserSQL,
		strings.ToLower(strings.TrimSpace(input.Email)),
		strings.TrimSpace(input.DisplayName),
		input.PasswordHash,
		input.PasswordResetRequired,
	))
}

func (s Store) CreateAdminUserWithAccessTx(ctx context.Context, input CreateAdminUserWithAccessInput) (User, OrganisationMembership, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	user, err := scanUser(tx.QueryRow(ctx, createUserSQL,
		strings.ToLower(strings.TrimSpace(input.User.Email)),
		strings.TrimSpace(input.User.DisplayName),
		input.User.PasswordHash,
		input.User.PasswordResetRequired,
	))
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	access := input.Access
	access.UserID = user.ID
	membership, err := scanOrganisationMembership(tx.QueryRow(ctx, insertOrganisationMembershipSQL,
		access.UserID,
		access.OrganisationID,
		access.Role,
		access.District,
	))
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	auditInput := adminUserCreatedAuditEvent(input.AuditEvent, user)
	auditEvent, err := insertAuditEvent(ctx, tx, auditInput)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	return user, membership, auditEvent, nil
}

func (s Store) GetUserByID(ctx context.Context, userID int64) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, getUserByIDSQL, userID))
}

func (s Store) UpdateUserLifecycle(ctx context.Context, input UpdateUserLifecycleInput) (User, error) {
	return scanUser(s.pool.QueryRow(ctx, updateUserLifecycleSQL,
		input.UserID,
		input.DisplayName,
		input.Disabled,
		input.UpdatedAt,
	))
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

func (s Store) DisableUser(ctx context.Context, userID int64, disabledAt time.Time) error {
	tag, err := s.pool.Exec(ctx, disableUserSQL, userID, disabledAt)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s Store) EnableUser(ctx context.Context, userID int64) error {
	tag, err := s.pool.Exec(ctx, enableUserSQL, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (s Store) RevokeActiveSessionsForUser(ctx context.Context, userID int64) (int64, error) {
	tag, err := s.pool.Exec(ctx, revokeActiveSessionsForUserSQL, userID)
	return tag.RowsAffected(), err
}

func (s Store) GetAdminUserAccessByUserID(ctx context.Context, userID int64) (AdminUserAccessRow, error) {
	return scanAdminUserAccessRow(s.pool.QueryRow(ctx, getAdminUserAccessByUserIDSQL, userID))
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

func (s Store) UpsertOrganisationMembership(ctx context.Context, input UpsertMembershipInput) (OrganisationMembership, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return OrganisationMembership{}, err
	}
	defer tx.Rollback(ctx)

	var lockedUserID int64
	if err := tx.QueryRow(ctx, lockUserForMembershipReplacementSQL, input.UserID).Scan(&lockedUserID); err != nil {
		return OrganisationMembership{}, err
	}

	if _, err := tx.Exec(ctx, deleteOrganisationMembershipsForUserSQL, input.UserID); err != nil {
		return OrganisationMembership{}, err
	}

	membership, err := scanOrganisationMembership(tx.QueryRow(ctx, insertOrganisationMembershipSQL,
		input.UserID,
		input.OrganisationID,
		input.Role,
		input.District,
	))
	if err != nil {
		return OrganisationMembership{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return OrganisationMembership{}, err
	}

	return membership, nil
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
	var passwordChangedAt sql.NullTime

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
		&passwordChangedAt,
		&user.PasswordResetRequired,
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
	user.PasswordChangedAt = nullTimePtr(passwordChangedAt)

	return session, user, nil
}

func scanUser(row pgx.Row) (User, error) {
	var user User
	var passwordHash sql.NullString
	var disabledAt sql.NullTime
	var passwordChangedAt sql.NullTime

	if err := row.Scan(
		&user.ID,
		&user.Email,
		&user.DisplayName,
		&passwordHash,
		&disabledAt,
		&passwordChangedAt,
		&user.PasswordResetRequired,
		&user.CreatedAt,
		&user.UpdatedAt,
	); err != nil {
		return User{}, err
	}

	user.PasswordHash = nullStringPtr(passwordHash)
	user.DisabledAt = nullTimePtr(disabledAt)
	user.PasswordChangedAt = nullTimePtr(passwordChangedAt)

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
		&membership.UserID,
		&organisationID,
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

func scanAdminUserAccessRow(row pgx.Row) (AdminUserAccessRow, error) {
	var access AdminUserAccessRow
	var disabledAt sql.NullTime
	var organisationID sql.NullInt64
	var district sql.NullString
	var lastSeenAt sql.NullTime

	if err := row.Scan(
		&access.UserID,
		&access.Email,
		&access.DisplayName,
		&disabledAt,
		&access.CreatedAt,
		&access.Role,
		&organisationID,
		&district,
		&lastSeenAt,
	); err != nil {
		return AdminUserAccessRow{}, err
	}

	access.DisabledAt = nullTimePtr(disabledAt)
	access.OrganisationID = nullInt64Ptr(organisationID)
	access.District = nullStringPtr(district)
	access.LastSeenAt = nullTimePtr(lastSeenAt)

	return access, nil
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

func adminUserCreatedAuditEvent(input CreateAuditEventInput, user User) CreateAuditEventInput {
	if input.EntityType == nil {
		entityType := "user"
		input.EntityType = &entityType
	}
	if input.EntityID == nil {
		entityID := strconv.FormatInt(user.ID, 10)
		input.EntityID = &entityID
	}
	if input.CreatedAt.IsZero() {
		input.CreatedAt = user.CreatedAt
	}
	input.Metadata = cloneMetadata(input.Metadata)
	return input
}

func cloneMetadata(metadata map[string]any) map[string]any {
	cloned := make(map[string]any, len(metadata)+1)
	for key, value := range metadata {
		cloned[key] = value
	}
	return cloned
}
