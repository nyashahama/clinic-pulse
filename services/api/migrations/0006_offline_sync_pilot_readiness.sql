CREATE TABLE report_sync_attempts (
    id BIGSERIAL PRIMARY KEY,
    external_id TEXT NOT NULL CHECK (btrim(external_id) <> ''),
    report_id BIGINT REFERENCES reports(id) ON DELETE SET NULL,
    submitted_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE SET NULL,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (
        result IN ('created', 'duplicate', 'conflict', 'validation_error', 'forbidden', 'server_error')
    ),
    client_attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (client_attempt_count > 0),
    queued_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_code TEXT CHECK (error_code IS NULL OR btrim(error_code) <> ''),
    error_message TEXT CHECK (error_message IS NULL OR btrim(error_message) <> ''),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX report_sync_attempts_external_created_at_idx
    ON report_sync_attempts (external_id, received_at DESC);
CREATE INDEX report_sync_attempts_report_created_at_idx
    ON report_sync_attempts (report_id, received_at DESC)
    WHERE report_id IS NOT NULL;
CREATE INDEX report_sync_attempts_user_created_at_idx
    ON report_sync_attempts (submitted_by_user_id, received_at DESC)
    WHERE submitted_by_user_id IS NOT NULL;
CREATE INDEX report_sync_attempts_result_created_at_idx
    ON report_sync_attempts (result, received_at DESC);
CREATE INDEX report_sync_attempts_clinic_created_at_idx
    ON report_sync_attempts (clinic_id, received_at DESC);

CREATE INDEX current_status_freshness_updated_at_idx
    ON current_status (freshness, updated_at DESC);
CREATE INDEX current_status_last_reported_at_idx
    ON current_status (last_reported_at);
