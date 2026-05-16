CREATE TABLE IF NOT EXISTS pilot_ingestion_runs (
    id TEXT PRIMARY KEY,
    organisation_id BIGINT NOT NULL REFERENCES organisations(id),
    source_name TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'partial')),
    records_received INTEGER NOT NULL DEFAULT 0,
    records_imported INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(validation_errors) = 'array'),
    actor_user_id BIGINT REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pilot_ingestion_runs_org_started_idx
    ON pilot_ingestion_runs (organisation_id, started_at DESC, id DESC);
