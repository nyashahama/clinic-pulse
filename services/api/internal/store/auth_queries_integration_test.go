package store

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestAuthStoreQueriesIntegration(t *testing.T) {
	databaseURL := os.Getenv("AUTH_STORE_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set AUTH_STORE_TEST_DATABASE_URL to run auth store integration tests")
	}

	ctx := context.Background()
	store := newIntegrationStore(t, ctx, databaseURL)

	passwordHash := "hash"
	activeUserID := insertIntegrationUser(t, ctx, store, "active@example.test", "Active User", &passwordHash, nil)
	disabledAt := time.Now().UTC()
	disabledUserID := insertIntegrationUser(t, ctx, store, "disabled@example.test", "Disabled User", &passwordHash, &disabledAt)
	orgID := insertIntegrationOrganisation(t, ctx, store, "District Health", "district-health")

	user, err := store.GetUserByEmail(ctx, "ACTIVE@EXAMPLE.TEST")
	if err != nil {
		t.Fatalf("GetUserByEmail returned error: %v", err)
	}
	if user.ID != activeUserID || user.PasswordHash == nil || *user.PasswordHash != passwordHash {
		t.Fatalf("unexpected user: %+v", user)
	}

	userAgent := "ClinicPulse Test"
	ipAddress := "192.0.2.10"
	active := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    activeUserID,
		TokenHash: strings.Repeat("a", 64),
		ExpiresAt: time.Now().Add(time.Hour),
		UserAgent: &userAgent,
		IPAddress: &ipAddress,
	})
	if active.UserAgent == nil || *active.UserAgent != userAgent {
		t.Fatalf("expected user agent %q, got %+v", userAgent, active.UserAgent)
	}
	if active.IPAddress == nil || *active.IPAddress != ipAddress {
		t.Fatalf("expected host IP %q, got %+v", ipAddress, active.IPAddress)
	}

	nullOptional := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    activeUserID,
		TokenHash: strings.Repeat("b", 64),
		ExpiresAt: time.Now().Add(time.Hour),
	})
	if nullOptional.UserAgent != nil || nullOptional.IPAddress != nil {
		t.Fatalf("expected nullable session fields to remain nil, got %+v", nullOptional)
	}

	loginAuditRole := "org_admin"
	sessionWithAudit, loginAudit, err := store.CreateSessionWithAuditTx(ctx, CreateSessionWithAuditInput{
		Session: CreateSessionInput{
			UserID:    activeUserID,
			TokenHash: strings.Repeat("f", 64),
			ExpiresAt: time.Now().Add(time.Hour),
			UserAgent: &userAgent,
			IPAddress: &ipAddress,
		},
		AuditEvent: CreateAuditEventInput{
			ActorUserID: &activeUserID,
			ActorRole:   &loginAuditRole,
			EventType:   "auth.login.succeeded",
			Summary:     "User signed in.",
			EntityType:  stringPtr("session"),
			Metadata: map[string]any{
				"userAgent": userAgent,
			},
		},
	})
	if err != nil {
		t.Fatalf("CreateSessionWithAuditTx returned error: %v", err)
	}
	if loginAudit.EntityID == nil || *loginAudit.EntityID != fmt.Sprintf("%d", sessionWithAudit.ID) {
		t.Fatalf("expected login audit session entity id %d, got %+v", sessionWithAudit.ID, loginAudit.EntityID)
	}
	if loginAudit.Metadata["sessionId"] != float64(sessionWithAudit.ID) {
		t.Fatalf("expected login audit session id metadata %d, got %#v", sessionWithAudit.ID, loginAudit.Metadata)
	}

	invalidRole := "not_a_role"
	rolledBackTokenHash := strings.Repeat("g", 64)
	if _, _, err := store.CreateSessionWithAuditTx(ctx, CreateSessionWithAuditInput{
		Session: CreateSessionInput{
			UserID:    activeUserID,
			TokenHash: rolledBackTokenHash,
			ExpiresAt: time.Now().Add(time.Hour),
		},
		AuditEvent: CreateAuditEventInput{
			ActorUserID: &activeUserID,
			ActorRole:   &invalidRole,
			EventType:   "auth.login.succeeded",
			Summary:     "User signed in.",
			EntityType:  stringPtr("session"),
		},
	}); err == nil {
		t.Fatal("expected invalid audit row to fail session audit transaction")
	}
	if _, _, err := store.GetSessionByTokenHash(ctx, rolledBackTokenHash); err != pgx.ErrNoRows {
		t.Fatalf("expected failed session audit transaction to roll back session, got %v", err)
	}

	session, sessionUser, err := store.GetSessionByTokenHash(ctx, active.TokenHash)
	if err != nil {
		t.Fatalf("GetSessionByTokenHash active returned error: %v", err)
	}
	if session.ID != active.ID || sessionUser.ID != activeUserID {
		t.Fatalf("unexpected active session/user: %+v %+v", session, sessionUser)
	}
	if session.LastSeenAt == nil {
		t.Fatal("expected last_seen_at to be set")
	}
	if session.IPAddress == nil || *session.IPAddress != ipAddress {
		t.Fatalf("expected active session host IP %q, got %+v", ipAddress, session.IPAddress)
	}

	disabled := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    disabledUserID,
		TokenHash: strings.Repeat("c", 64),
		ExpiresAt: time.Now().Add(time.Hour),
	})
	if _, _, err := store.GetSessionByTokenHash(ctx, disabled.TokenHash); err != pgx.ErrNoRows {
		t.Fatalf("expected disabled user session to return pgx.ErrNoRows, got %v", err)
	}

	revoked := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    activeUserID,
		TokenHash: strings.Repeat("d", 64),
		ExpiresAt: time.Now().Add(time.Hour),
	})
	if err := store.RevokeSession(ctx, revoked.TokenHash); err != nil {
		t.Fatalf("RevokeSession returned error: %v", err)
	}
	if err := store.RevokeSession(ctx, revoked.TokenHash); err != nil {
		t.Fatalf("second RevokeSession returned error: %v", err)
	}
	if _, _, err := store.GetSessionByTokenHash(ctx, revoked.TokenHash); err != pgx.ErrNoRows {
		t.Fatalf("expected revoked session to return pgx.ErrNoRows, got %v", err)
	}

	expired := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    activeUserID,
		TokenHash: strings.Repeat("e", 64),
		ExpiresAt: time.Now().Add(time.Hour),
	})
	if _, err := store.pool.Exec(ctx, `UPDATE sessions SET created_at = now() - interval '2 hours', expires_at = now() - interval '1 hour' WHERE id = $1`, expired.ID); err != nil {
		t.Fatalf("expire session: %v", err)
	}
	if _, _, err := store.GetSessionByTokenHash(ctx, expired.TokenHash); err != pgx.ErrNoRows {
		t.Fatalf("expected expired session to return pgx.ErrNoRows, got %v", err)
	}

	if _, err := store.pool.Exec(ctx, `
INSERT INTO organisation_memberships (organisation_id, user_id, role, district)
VALUES ($1, $2, 'district_manager', 'Zulu District'),
       ($1, $2, 'reporter', NULL),
       (NULL, $2, 'system_admin', NULL)`, orgID, activeUserID); err != nil {
		t.Fatalf("insert memberships: %v", err)
	}

	memberships, err := store.ListMembershipsForUser(ctx, activeUserID)
	if err != nil {
		t.Fatalf("ListMembershipsForUser returned error: %v", err)
	}
	gotRoles := make([]string, 0, len(memberships))
	for _, membership := range memberships {
		gotRoles = append(gotRoles, membership.Role)
	}
	if strings.Join(gotRoles, ",") != "district_manager,reporter,system_admin" {
		t.Fatalf("unexpected membership order: %v", gotRoles)
	}
}

func TestAdminLifecycleQueriesCreateDisableAndRevokeSessions(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:                 "pilot@example.test",
		DisplayName:           "Pilot User",
		PasswordHash:          &passwordHash,
		PasswordResetRequired: true,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	if user.ID == 0 || !user.PasswordResetRequired {
		t.Fatalf("expected created user with password reset required, got %+v", user)
	}

	session := createIntegrationSession(t, ctx, store, CreateSessionInput{
		UserID:    user.ID,
		TokenHash: "token-hash-pilot",
		ExpiresAt: time.Now().UTC().Add(time.Hour),
	})

	if err := store.DisableUser(ctx, user.ID, time.Now().UTC()); err != nil {
		t.Fatalf("DisableUser returned error: %v", err)
	}
	if count, err := store.RevokeActiveSessionsForUser(ctx, user.ID); err != nil || count != 1 {
		t.Fatalf("expected one revoked session, count=%d err=%v", count, err)
	}
	if _, _, err := store.GetSessionByTokenHash(ctx, session.TokenHash); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected revoked session to be unusable, got %v", err)
	}
}

func TestAdminLifecycleQueriesCreateAdminUserWithAccessTxCommitsUserMembershipAndAudit(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	orgID := insertIntegrationOrganisation(t, ctx, store, "Atomic Admin Create", "atomic-admin-create")
	passwordHash := "hash"
	actorRole := "org_admin"

	user, membership, auditEvent, err := store.CreateAdminUserWithAccessTx(ctx, CreateAdminUserWithAccessInput{
		User: CreateUserInput{
			Email:                 "atomic-admin@example.test",
			DisplayName:           "Atomic Admin",
			PasswordHash:          &passwordHash,
			PasswordResetRequired: true,
		},
		Access: UpsertMembershipInput{
			OrganisationID: &orgID,
			Role:           "reporter",
		},
		AuditEvent: CreateAuditEventInput{
			ActorRole:      &actorRole,
			OrganisationID: &orgID,
			EventType:      "admin.user_created",
			Summary:        "Admin user created.",
			Metadata:       map[string]any{"role": "reporter"},
		},
	})
	if err != nil {
		t.Fatalf("CreateAdminUserWithAccessTx returned error: %v", err)
	}
	if user.ID == 0 || !user.PasswordResetRequired {
		t.Fatalf("expected created user with password reset required, got %+v", user)
	}
	if membership.UserID != user.ID || membership.OrganisationID == nil || *membership.OrganisationID != orgID {
		t.Fatalf("expected membership for created user and org %d, got %+v", orgID, membership)
	}
	if auditEvent.EntityType == nil || *auditEvent.EntityType != "user" {
		t.Fatalf("expected audit entity type user, got %+v", auditEvent.EntityType)
	}
	if auditEvent.EntityID == nil || *auditEvent.EntityID != fmt.Sprintf("%d", user.ID) {
		t.Fatalf("expected audit entity id %d, got %+v", user.ID, auditEvent.EntityID)
	}
}

func TestAdminLifecycleQueriesCreateAdminUserWithAccessTxRollsBackMissingOrganisation(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"
	missingOrgID := int64(999_999)

	_, _, _, err := store.CreateAdminUserWithAccessTx(ctx, CreateAdminUserWithAccessInput{
		User: CreateUserInput{
			Email:        "missing-org-admin@example.test",
			DisplayName:  "Missing Org Admin",
			PasswordHash: &passwordHash,
		},
		Access: UpsertMembershipInput{
			OrganisationID: &missingOrgID,
			Role:           "reporter",
		},
		AuditEvent: CreateAuditEventInput{
			EventType: "admin.user_created",
			Summary:   "Admin user created.",
		},
	})
	if err == nil {
		t.Fatal("expected missing organisation to fail transaction")
	}
	if _, err := store.GetUserByEmail(ctx, "missing-org-admin@example.test"); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected user insert to roll back after membership failure, got %v", err)
	}
}

func TestAdminLifecycleQueriesCreateAdminUserWithAccessTxRollsBackAuditFailure(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	orgID := insertIntegrationOrganisation(t, ctx, store, "Atomic Audit Failure", "atomic-audit-failure")
	passwordHash := "hash"
	invalidRole := "not_a_role"

	_, _, _, err := store.CreateAdminUserWithAccessTx(ctx, CreateAdminUserWithAccessInput{
		User: CreateUserInput{
			Email:        "audit-failure-admin@example.test",
			DisplayName:  "Audit Failure Admin",
			PasswordHash: &passwordHash,
		},
		Access: UpsertMembershipInput{
			OrganisationID: &orgID,
			Role:           "reporter",
		},
		AuditEvent: CreateAuditEventInput{
			ActorRole: &invalidRole,
			EventType: "admin.user_created",
			Summary:   "Admin user created.",
		},
	})
	if err == nil {
		t.Fatal("expected invalid audit event to fail transaction")
	}
	if _, err := store.GetUserByEmail(ctx, "audit-failure-admin@example.test"); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected user insert to roll back after audit failure, got %v", err)
	}
}

func TestAdminLifecycleQueriesGetAdminUserAccessByUserID(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:        "manager@example.test",
		DisplayName:  "Manager User",
		PasswordHash: &passwordHash,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	orgID := insertIntegrationOrganisation(t, ctx, store, "District Access", "district-access")
	membership, err := store.UpsertOrganisationMembership(ctx, UpsertMembershipInput{
		UserID:         user.ID,
		OrganisationID: &orgID,
		Role:           "org_admin",
	})
	if err != nil {
		t.Fatalf("UpsertOrganisationMembership returned error: %v", err)
	}
	if membership.UserID != user.ID || membership.OrganisationID == nil || *membership.OrganisationID != orgID {
		t.Fatalf("unexpected membership: %+v", membership)
	}

	access, err := store.GetAdminUserAccessByUserID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetAdminUserAccessByUserID returned error: %v", err)
	}
	if access.UserID != user.ID || access.Role != "org_admin" || access.OrganisationID == nil || *access.OrganisationID != orgID {
		t.Fatalf("unexpected admin user access: %+v", access)
	}
}

func TestAdminLifecycleQueriesReplaceOrganisationMembership(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:        "access-change@example.test",
		DisplayName:  "Access Change",
		PasswordHash: &passwordHash,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	orgID := insertIntegrationOrganisation(t, ctx, store, "Access District", "access-district")
	if _, err := store.UpsertOrganisationMembership(ctx, UpsertMembershipInput{
		UserID:         user.ID,
		OrganisationID: &orgID,
		Role:           "reporter",
	}); err != nil {
		t.Fatalf("initial UpsertOrganisationMembership returned error: %v", err)
	}
	if _, err := store.UpsertOrganisationMembership(ctx, UpsertMembershipInput{
		UserID:         user.ID,
		OrganisationID: &orgID,
		Role:           "org_admin",
	}); err != nil {
		t.Fatalf("replacement UpsertOrganisationMembership returned error: %v", err)
	}

	memberships, err := store.ListMembershipsForUser(ctx, user.ID)
	if err != nil {
		t.Fatalf("ListMembershipsForUser returned error: %v", err)
	}
	if len(memberships) != 1 || memberships[0].Role != "org_admin" {
		t.Fatalf("expected replacement to leave only org_admin membership, got %+v", memberships)
	}
}

func TestAdminLifecycleQueriesUpsertOrganisationMembershipMissingUserReturnsNoRows(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	orgID := insertIntegrationOrganisation(t, ctx, store, "Missing User Access", "missing-user-access")

	_, err := store.UpsertOrganisationMembership(ctx, UpsertMembershipInput{
		UserID:         999_999,
		OrganisationID: &orgID,
		Role:           "org_admin",
	})
	if !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("expected pgx.ErrNoRows for missing user membership replacement, got %v", err)
	}
}

func TestAdminLifecycleQueriesGetAdminUserAccessByUserIDUsesRoleRankOrder(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:        "multi-access@example.test",
		DisplayName:  "Multi Access",
		PasswordHash: &passwordHash,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	lowOrgID := insertIntegrationOrganisation(t, ctx, store, "Alpha Access", "alpha-access")
	highOrgID := insertIntegrationOrganisation(t, ctx, store, "Zulu Access", "zulu-access")
	if _, err := store.pool.Exec(ctx, `
INSERT INTO organisation_memberships (organisation_id, user_id, role, district)
VALUES ($1, $3, 'reporter', NULL),
       ($1, $3, 'district_manager', 'Zulu District'),
       ($2, $3, 'org_admin', NULL),
       ($1, $3, 'org_admin', NULL)`, lowOrgID, highOrgID, user.ID); err != nil {
		t.Fatalf("insert multiple memberships: %v", err)
	}

	access, err := store.GetAdminUserAccessByUserID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetAdminUserAccessByUserID returned error: %v", err)
	}
	if access.Role != "org_admin" || access.OrganisationID == nil || *access.OrganisationID != lowOrgID {
		t.Fatalf("expected highest-ranked org_admin access with lowest organisation id, got %+v", access)
	}
}

func TestAdminLifecycleQueriesUpdateUserLifecycleAndEnableUser(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:        "lifecycle@example.test",
		DisplayName:  "Lifecycle User",
		PasswordHash: &passwordHash,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	disabled := true
	updatedAt := time.Now().UTC().Add(-time.Minute).Truncate(time.Microsecond)
	renamed := "Renamed Lifecycle User"
	updated, err := store.UpdateUserLifecycle(ctx, UpdateUserLifecycleInput{
		UserID:      user.ID,
		DisplayName: &renamed,
		Disabled:    &disabled,
		UpdatedAt:   updatedAt,
	})
	if err != nil {
		t.Fatalf("UpdateUserLifecycle returned error: %v", err)
	}
	if updated.DisplayName != renamed || updated.DisabledAt == nil || !updated.UpdatedAt.Equal(updatedAt) {
		t.Fatalf("unexpected updated user lifecycle: %+v", updated)
	}
	if err := store.EnableUser(ctx, user.ID); err != nil {
		t.Fatalf("EnableUser returned error: %v", err)
	}
	enabled, err := store.GetUserByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetUserByID returned error: %v", err)
	}
	if enabled.DisabledAt != nil {
		t.Fatalf("expected enabled user to clear disabled_at, got %+v", enabled)
	}
}

func TestAdminLifecycleQueriesGetUserByIDReturnsPasswordLifecycleFields(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	passwordHash := "hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:                 "password-lifecycle@example.test",
		DisplayName:           "Password Lifecycle",
		PasswordHash:          &passwordHash,
		PasswordResetRequired: true,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	got, err := store.GetUserByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetUserByID returned error: %v", err)
	}
	if got.PasswordChangedAt == nil || !got.PasswordResetRequired {
		t.Fatalf("expected password lifecycle fields to persist, got %+v", got)
	}
}

func TestUpdateUserPasswordUpdatesHashChangedAtAndClearsResetRequired(t *testing.T) {
	ctx := context.Background()
	store := integrationStore(t)
	oldHash := "old-hash"

	user, err := store.CreateUser(ctx, CreateUserInput{
		Email:                 "change-password@example.test",
		DisplayName:           "Change Password",
		PasswordHash:          &oldHash,
		PasswordResetRequired: true,
	})
	if err != nil {
		t.Fatalf("CreateUser returned error: %v", err)
	}
	previousChangedAt := time.Now().UTC().Add(-24 * time.Hour).Truncate(time.Microsecond)
	if _, err := store.pool.Exec(ctx, `
UPDATE users
SET password_changed_at = $2,
    password_reset_required = true
WHERE id = $1`, user.ID, previousChangedAt); err != nil {
		t.Fatalf("set previous password lifecycle fields: %v", err)
	}

	updated, err := store.UpdateUserPassword(ctx, user.ID, "new-hash")
	if err != nil {
		t.Fatalf("UpdateUserPassword returned error: %v", err)
	}

	if updated.PasswordHash == nil || *updated.PasswordHash != "new-hash" {
		t.Fatalf("expected updated password hash, got %+v", updated.PasswordHash)
	}
	if updated.PasswordResetRequired {
		t.Fatalf("expected password reset requirement to clear, got %+v", updated)
	}
	if updated.PasswordChangedAt == nil || !updated.PasswordChangedAt.After(previousChangedAt) {
		t.Fatalf("expected password_changed_at after %s, got %+v", previousChangedAt, updated.PasswordChangedAt)
	}

	got, err := store.GetUserByID(ctx, user.ID)
	if err != nil {
		t.Fatalf("GetUserByID returned error: %v", err)
	}
	if got.PasswordHash == nil || *got.PasswordHash != "new-hash" || got.PasswordResetRequired || got.PasswordChangedAt == nil || !got.PasswordChangedAt.After(previousChangedAt) {
		t.Fatalf("expected persisted password lifecycle update, got %+v", got)
	}
}

func integrationStore(t *testing.T) Store {
	t.Helper()

	databaseURL := os.Getenv("AUTH_STORE_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set AUTH_STORE_TEST_DATABASE_URL to run auth store integration tests")
	}

	return newIntegrationStore(t, context.Background(), databaseURL)
}

func newIntegrationStore(t *testing.T, ctx context.Context, databaseURL string) Store {
	t.Helper()

	adminPool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("connect to integration database: %v", err)
	}
	t.Cleanup(adminPool.Close)

	schema := fmt.Sprintf("auth_store_test_%d", time.Now().UnixNano())
	quotedSchema := pgx.Identifier{schema}.Sanitize()
	if _, err := adminPool.Exec(ctx, "CREATE SCHEMA "+quotedSchema); err != nil {
		t.Fatalf("create test schema: %v", err)
	}
	t.Cleanup(func() {
		_, _ = adminPool.Exec(context.Background(), "DROP SCHEMA "+quotedSchema+" CASCADE")
	})

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		t.Fatalf("parse integration database url: %v", err)
	}
	config.ConnConfig.RuntimeParams["search_path"] = schema

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatalf("connect to test schema: %v", err)
	}
	t.Cleanup(pool.Close)

	applyIntegrationMigrations(t, ctx, pool)

	return New(pool)
}

func applyIntegrationMigrations(t *testing.T, ctx context.Context, pool *pgxpool.Pool) {
	t.Helper()

	migrations, err := filepath.Glob(filepath.Join("..", "..", "migrations", "*.sql"))
	if err != nil {
		t.Fatalf("find migrations: %v", err)
	}
	if len(migrations) == 0 {
		t.Fatal("expected migrations")
	}

	for _, migration := range migrations {
		sqlBytes, err := os.ReadFile(migration)
		if err != nil {
			t.Fatalf("read migration %s: %v", migration, err)
		}
		if _, err := pool.Exec(ctx, string(sqlBytes)); err != nil {
			t.Fatalf("apply migration %s: %v", migration, err)
		}
	}
}

func insertIntegrationUser(t *testing.T, ctx context.Context, store Store, email string, displayName string, passwordHash *string, disabledAt *time.Time) int64 {
	t.Helper()

	var id int64
	if err := store.pool.QueryRow(ctx, `
INSERT INTO users (email, display_name, password_hash, disabled_at)
VALUES ($1, $2, $3, $4)
RETURNING id`, email, displayName, passwordHash, disabledAt).Scan(&id); err != nil {
		t.Fatalf("insert user %s: %v", email, err)
	}

	return id
}

func insertIntegrationOrganisation(t *testing.T, ctx context.Context, store Store, name string, slug string) int64 {
	t.Helper()

	var id int64
	if err := store.pool.QueryRow(ctx, `
INSERT INTO organisations (name, slug)
VALUES ($1, $2)
RETURNING id`, name, slug).Scan(&id); err != nil {
		t.Fatalf("insert organisation %s: %v", slug, err)
	}

	return id
}

func createIntegrationSession(t *testing.T, ctx context.Context, store Store, input CreateSessionInput) Session {
	t.Helper()

	session, err := store.CreateSession(ctx, input)
	if err != nil {
		t.Fatalf("CreateSession returned error: %v", err)
	}

	return session
}
