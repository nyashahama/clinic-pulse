package store

import (
	"context"
	"encoding/json"
	"errors"
	"net/netip"
	"strconv"
	"strings"

	"clinicpulse/services/api/internal/store/db"

	"github.com/jackc/pgx/v5/pgtype"
)

var ErrInvalidSessionIPAddress = errors.New("invalid session IP address")

func (s Store) CreateAdminUserWithAccessTx(ctx context.Context, input CreateAdminUserWithAccessInput) (User, OrganisationMembership, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	userRow, err := q.CreateUser(ctx, &db.CreateUserParams{
		Email:                 strings.ToLower(strings.TrimSpace(input.User.Email)),
		DisplayName:           strings.TrimSpace(input.User.DisplayName),
		PasswordHash:          input.User.PasswordHash,
		PasswordResetRequired: input.User.PasswordResetRequired,
	})
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	user := userFromRow(userRow.ID, userRow.Email, userRow.DisplayName, userRow.PasswordHash, userRow.DisabledAt, userRow.PasswordChangedAt, userRow.PasswordResetRequired, userRow.CreatedAt, userRow.UpdatedAt)

	access := input.Access
	membershipRow, err := q.InsertOrganisationMembership(ctx, &db.InsertOrganisationMembershipParams{
		UserID:         user.ID,
		OrganisationID: access.OrganisationID,
		Role:           access.Role,
		District:       access.District,
	})
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	membership := membershipFromCreatedRow(membershipRow)

	auditInput := adminUserCreatedAuditEvent(input.AuditEvent, user)
	normalized := normalizeCreateAuditEventInput(auditInput)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, OrganisationMembership{}, AuditEvent{}, err
	}

	return user, membership, auditEvent, nil
}

func (s Store) UpdateUserLifecycleWithAuditTx(ctx context.Context, input UpdateUserLifecycleWithAuditInput) (User, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return User{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	userRow, err := q.UpdateUserLifecycle(ctx, &db.UpdateUserLifecycleParams{
		ID:          input.User.UserID,
		DisplayName: strOrZero(input.User.DisplayName),
		Column3:     boolOrFalse(input.User.Disabled),
		UpdatedAt:   pgtype.Timestamptz{Time: input.User.UpdatedAt, Valid: true},
	})
	if err != nil {
		return User{}, AuditEvent{}, err
	}

	user := userFromRow(userRow.ID, userRow.Email, userRow.DisplayName, userRow.PasswordHash, userRow.DisabledAt, userRow.PasswordChangedAt, userRow.PasswordResetRequired, userRow.CreatedAt, userRow.UpdatedAt)

	normalized := normalizeCreateAuditEventInput(input.AuditEvent)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return User{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return User{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return User{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, AuditEvent{}, err
	}

	return user, auditEvent, nil
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

	q := s.db.WithTx(tx)

	row, err := q.CreateSession(ctx, &db.CreateSessionParams{
		UserID:    normalizedSession.UserID,
		TokenHash: normalizedSession.TokenHash,
		ExpiresAt: pgtype.Timestamptz{Time: normalizedSession.ExpiresAt, Valid: true},
		UserAgent: normalizedSession.UserAgent,
		IpAddress: normalizedSession.IPAddress,
	})
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	session := sessionFromCreateRow(row)

	auditInput := auditEventForSession(input.AuditEvent, session)
	normalized := normalizeCreateAuditEventInput(auditInput)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return Session{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return Session{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return Session{}, AuditEvent{}, err
	}

	return session, auditEvent, nil
}

func (s Store) RevokeActiveSessionsForUserWithAuditTx(ctx context.Context, input RevokeActiveSessionsWithAuditInput) (int64, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return 0, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	revokedSessions, err := q.RevokeActiveSessionsForUser(ctx, input.UserID)
	if err != nil {
		return 0, AuditEvent{}, err
	}

	input.AuditEvent.Metadata = cloneMetadata(input.AuditEvent.Metadata)
	input.AuditEvent.Metadata["revokedSessions"] = revokedSessions

	normalized := normalizeCreateAuditEventInput(input.AuditEvent)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return 0, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return 0, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return 0, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, AuditEvent{}, err
	}

	return revokedSessions, auditEvent, nil
}

func (s Store) UpsertOrganisationMembership(ctx context.Context, input UpsertMembershipInput) (OrganisationMembership, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return OrganisationMembership{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)

	if _, err := q.LockUserForMembershipReplacement(ctx, input.UserID); err != nil {
		return OrganisationMembership{}, err
	}

	if err := q.DeleteOrganisationMembershipsForUser(ctx, input.UserID); err != nil {
		return OrganisationMembership{}, err
	}

	row, err := q.InsertOrganisationMembership(ctx, &db.InsertOrganisationMembershipParams{
		UserID:         input.UserID,
		OrganisationID: input.OrganisationID,
		Role:           input.Role,
		District:       input.District,
	})
	if err != nil {
		return OrganisationMembership{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return OrganisationMembership{}, err
	}

	return membershipFromCreatedRow(row), nil
}

func (s Store) UpsertOrganisationMembershipWithAuditTx(ctx context.Context, input UpsertMembershipWithAuditInput) (OrganisationMembership, AuditEvent, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}
	defer tx.Rollback(ctx)

	q := s.db.WithTx(tx)
	membershipInput := input.Membership

	if _, err := q.LockUserForMembershipReplacement(ctx, membershipInput.UserID); err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	if err := q.DeleteOrganisationMembershipsForUser(ctx, membershipInput.UserID); err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	row, err := q.InsertOrganisationMembership(ctx, &db.InsertOrganisationMembershipParams{
		UserID:         membershipInput.UserID,
		OrganisationID: membershipInput.OrganisationID,
		Role:           membershipInput.Role,
		District:       membershipInput.District,
	})
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	membership := membershipFromCreatedRow(row)

	normalized := normalizeCreateAuditEventInput(input.AuditEvent)
	metadataJSON, err := json.Marshal(normalized.Metadata)
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}
	aeRow, err := q.InsertAuditEvent(ctx, &db.InsertAuditEventParams{
		ExternalID:     normalized.ExternalID,
		ClinicID:       normalized.ClinicID,
		ActorName:      normalized.ActorName,
		EventType:      normalized.EventType,
		Summary:        normalized.Summary,
		CreatedAt:      pgtype.Timestamptz{Time: normalized.CreatedAt, Valid: true},
		ActorUserID:    normalized.ActorUserID,
		ActorRole:      normalized.ActorRole,
		OrganisationID: normalized.OrganisationID,
		EntityType:     normalized.EntityType,
		EntityID:       normalized.EntityID,
		Column12:       metadataJSON,
	})
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}
	auditEvent, err := toAuditEvent(aeRow)
	if err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return OrganisationMembership{}, AuditEvent{}, err
	}

	return membership, auditEvent, nil
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

func boolOrFalse(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}

func cloneMetadata(metadata map[string]any) map[string]any {
	cloned := make(map[string]any, len(metadata)+1)
	for key, value := range metadata {
		cloned[key] = value
	}
	return cloned
}


