package migrations

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNilPool = errors.New("migrations: nil database pool")

type Options struct {
	Dir string
	Now func() time.Time
}

const createLedgerSQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
	filename TEXT PRIMARY KEY CHECK (btrim(filename) <> ''),
	checksum TEXT NOT NULL CHECK (btrim(checksum) <> ''),
	applied_at TIMESTAMPTZ NOT NULL
);`

func Run(ctx context.Context, pool *pgxpool.Pool, options Options) error {
	files, err := ListFiles(options.Dir)
	if err != nil {
		return err
	}
	if pool == nil {
		return ErrNilPool
	}

	if _, err := pool.Exec(ctx, createLedgerSQL); err != nil {
		return fmt.Errorf("create schema_migrations ledger: %w", err)
	}

	for _, path := range files {
		if err := applyFile(ctx, pool, path, options); err != nil {
			return err
		}
	}

	return nil
}

func ListFiles(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("read migrations dir %s: %w", dir, err)
	}

	files := make([]string, 0, len(entries))
	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}
		files = append(files, filepath.Join(dir, entry.Name()))
	}
	sort.Strings(files)

	return files, nil
}

func Checksum(content []byte) string {
	sum := sha256.Sum256(content)
	return hex.EncodeToString(sum[:])
}

func applyFile(ctx context.Context, pool *pgxpool.Pool, path string, options Options) error {
	content, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read migration %s: %w", path, err)
	}

	filename := filepath.Base(path)
	checksum := Checksum(content)

	var existing string
	err = pool.QueryRow(ctx, "SELECT checksum FROM schema_migrations WHERE filename = $1", filename).Scan(&existing)
	if err == nil {
		if existing == checksum {
			return nil
		}
		return fmt.Errorf("migration %s checksum mismatch: ledger has %s, file has %s", filename, existing, checksum)
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("read schema_migrations ledger for %s: %w", filename, err)
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin migration %s: %w", filename, err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback(ctx)
		}
	}()

	if _, err := tx.Exec(ctx, string(content)); err != nil {
		return fmt.Errorf("apply migration %s: %w", filename, err)
	}

	appliedAt := time.Now()
	if options.Now != nil {
		appliedAt = options.Now()
	}
	if _, err := tx.Exec(ctx, "INSERT INTO schema_migrations (filename, checksum, applied_at) VALUES ($1, $2, $3)", filename, checksum, appliedAt); err != nil {
		return fmt.Errorf("record migration %s: %w", filename, err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit migration %s: %w", filename, err)
	}
	committed = true

	return nil
}
