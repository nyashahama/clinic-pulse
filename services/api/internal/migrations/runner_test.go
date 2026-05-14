package migrations

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestListFilesReturnsSortedSQLFiles(t *testing.T) {
	dir := t.TempDir()
	writeFile(t, filepath.Join(dir, "002_second.sql"), "select 2;")
	writeFile(t, filepath.Join(dir, "001_first.sql"), "select 1;")
	writeFile(t, filepath.Join(dir, "notes.txt"), "not sql")
	writeFile(t, filepath.Join(dir, "003_third.SQL"), "not lower-case sql")

	got, err := ListFiles(dir)
	if err != nil {
		t.Fatalf("ListFiles returned error: %v", err)
	}

	want := []string{
		filepath.Join(dir, "001_first.sql"),
		filepath.Join(dir, "002_second.sql"),
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("ListFiles() = %#v, want %#v", got, want)
	}
}

func TestChecksumChangesWithContent(t *testing.T) {
	first := Checksum([]byte("select 1;"))
	second := Checksum([]byte("select 2;"))

	if first == "" {
		t.Fatal("Checksum returned empty string")
	}
	if first == second {
		t.Fatalf("Checksum returned same value for different content: %q", first)
	}
}

func TestRunRejectsMissingDirectoryBeforeUsingDatabase(t *testing.T) {
	missingDir := filepath.Join(t.TempDir(), "missing")

	err := Run(context.Background(), nil, Options{Dir: missingDir})
	if err == nil {
		t.Fatal("Run returned nil error")
	}
	if errors.Is(err, ErrNilPool) {
		t.Fatalf("Run checked pool before directory: %v", err)
	}
	if !strings.Contains(err.Error(), missingDir) {
		t.Fatalf("Run error %q does not include missing directory %q", err, missingDir)
	}
}

func TestRunTracksAndProtectsMigrations(t *testing.T) {
	databaseURL := os.Getenv("MIGRATIONS_TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set MIGRATIONS_TEST_DATABASE_URL to run migration runner integration tests")
	}

	ctx := context.Background()
	pool, cleanup := openMigrationTestPool(t, ctx, databaseURL)
	defer cleanup()

	dir := t.TempDir()
	firstMigration := filepath.Join(dir, "001_create_widgets.sql")
	secondMigration := filepath.Join(dir, "002_insert_widget.sql")
	firstContent := "CREATE TABLE widgets (id INTEGER PRIMARY KEY, name TEXT NOT NULL);\nINSERT INTO widgets (id, name) VALUES (1, 'alpha');"
	writeFile(t, firstMigration, firstContent)
	writeFile(t, secondMigration, "INSERT INTO widgets (id, name) VALUES (2, 'bravo');")

	now := time.Date(2026, 5, 14, 9, 30, 0, 0, time.UTC)
	if err := Run(ctx, pool, Options{Dir: dir, Now: func() time.Time { return now }}); err != nil {
		t.Fatalf("Run returned error: %v", err)
	}

	assertCount(t, ctx, pool, "SELECT count(*) FROM schema_migrations", 2)
	assertCount(t, ctx, pool, "SELECT count(*) FROM widgets", 2)
	assertCount(t, ctx, pool, "SELECT count(*) FROM schema_migrations WHERE applied_at = $1", 2, now)

	if err := Run(ctx, pool, Options{Dir: dir}); err != nil {
		t.Fatalf("Run rerun returned error: %v", err)
	}
	assertCount(t, ctx, pool, "SELECT count(*) FROM schema_migrations", 2)
	assertCount(t, ctx, pool, "SELECT count(*) FROM widgets", 2)

	writeFile(t, firstMigration, firstContent+"\n-- edited after apply")
	err := Run(ctx, pool, Options{Dir: dir})
	if err == nil {
		t.Fatal("Run returned nil error for changed applied migration")
	}
	if !strings.Contains(err.Error(), "checksum mismatch") {
		t.Fatalf("Run error %q does not mention checksum mismatch", err)
	}

	writeFile(t, firstMigration, firstContent)
	badMigration := filepath.Join(dir, "003_bad_migration.sql")
	writeFile(t, badMigration, "CREATE TABLE failed_marker (id INTEGER PRIMARY KEY);\nSELECT missing_function_for_rollback();")
	err = Run(ctx, pool, Options{Dir: dir})
	if err == nil {
		t.Fatal("Run returned nil error for failing migration")
	}
	assertCount(t, ctx, pool, "SELECT count(*) FROM schema_migrations WHERE filename = '003_bad_migration.sql'", 0)

	var failedTable *string
	if err := pool.QueryRow(ctx, "SELECT to_regclass('failed_marker')").Scan(&failedTable); err != nil {
		t.Fatalf("check failed migration table rollback: %v", err)
	}
	if failedTable != nil {
		t.Fatalf("failed migration left table behind: %s", *failedTable)
	}
}

func writeFile(t *testing.T, path string, content string) {
	t.Helper()

	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write test file %s: %v", path, err)
	}
}

func openMigrationTestPool(t *testing.T, ctx context.Context, databaseURL string) (*pgxpool.Pool, func()) {
	t.Helper()

	adminPool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatalf("open migration test admin pool: %v", err)
	}
	if err := adminPool.Ping(ctx); err != nil {
		adminPool.Close()
		t.Fatalf("ping migration test database: %v", err)
	}

	schema := "migration_test_" + strings.ReplaceAll(t.Name(), "/", "_") + "_" + time.Now().UTC().Format("20060102150405")
	quotedSchema := pgx.Identifier{schema}.Sanitize()
	if _, err := adminPool.Exec(ctx, "CREATE SCHEMA "+quotedSchema); err != nil {
		adminPool.Close()
		t.Fatalf("create migration test schema: %v", err)
	}

	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		_, _ = adminPool.Exec(ctx, "DROP SCHEMA "+quotedSchema+" CASCADE")
		adminPool.Close()
		t.Fatalf("parse migration test database URL: %v", err)
	}
	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		_, err := conn.Exec(ctx, "SET search_path TO "+quotedSchema)
		return err
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		_, _ = adminPool.Exec(ctx, "DROP SCHEMA "+quotedSchema+" CASCADE")
		adminPool.Close()
		t.Fatalf("open migration test pool: %v", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		_, _ = adminPool.Exec(ctx, "DROP SCHEMA "+quotedSchema+" CASCADE")
		adminPool.Close()
		t.Fatalf("ping migration test pool: %v", err)
	}

	return pool, func() {
		pool.Close()
		_, _ = adminPool.Exec(ctx, "DROP SCHEMA "+quotedSchema+" CASCADE")
		adminPool.Close()
	}
}

func assertCount(t *testing.T, ctx context.Context, pool *pgxpool.Pool, query string, want int, args ...any) {
	t.Helper()

	var got int
	if err := pool.QueryRow(ctx, query, args...).Scan(&got); err != nil {
		t.Fatalf("query count with %q: %v", query, err)
	}
	if got != want {
		t.Fatalf("count from %q = %d, want %d", query, got, want)
	}
}
