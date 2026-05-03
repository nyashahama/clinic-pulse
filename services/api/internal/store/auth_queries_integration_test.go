package store

import (
	"context"
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
