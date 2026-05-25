package store

import (
	"context"

	"clinicpulse/services/api/internal/db"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Store struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func Open(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}

	return pool, nil
}

func New(pool *pgxpool.Pool) Store {
	return Store{pool: pool, queries: db.New(pool)}
}

func (s Store) sqlc() *db.Queries {
	if s.queries != nil {
		return s.queries
	}
	return db.New(s.pool)
}

func (s Store) Close() {
	if s.pool != nil {
		s.pool.Close()
	}
}
