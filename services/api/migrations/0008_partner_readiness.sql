CREATE TABLE partner_api_keys (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    environment TEXT NOT NULL CHECK (environment IN ('demo', 'live')),
    key_prefix TEXT NOT NULL CHECK (btrim(key_prefix) <> ''),
    key_hash TEXT NOT NULL CHECK (btrim(key_hash) <> ''),
    scopes JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(scopes) = 'array'),
    allowed_districts JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(allowed_districts) = 'array'),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (expires_at IS NULL OR expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at),
    CHECK (last_used_at IS NULL OR last_used_at >= created_at)
);

CREATE UNIQUE INDEX partner_api_keys_hash_unique_idx
    ON partner_api_keys (key_hash);
CREATE INDEX partner_api_keys_organisation_created_at_idx
    ON partner_api_keys (organisation_id, created_at DESC)
    WHERE organisation_id IS NOT NULL;
CREATE INDEX partner_api_keys_active_idx
    ON partner_api_keys (environment, expires_at)
    WHERE revoked_at IS NULL;

CREATE TABLE partner_webhook_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    target_url TEXT NOT NULL CHECK (btrim(target_url) <> ''),
    event_types JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(event_types) = 'array'),
    secret_hash TEXT NOT NULL CHECK (btrim(secret_hash) <> ''),
    status TEXT NOT NULL CHECK (status IN ('active', 'disabled')) DEFAULT 'active',
    last_tested_at TIMESTAMPTZ,
    last_test_status TEXT CHECK (
        last_test_status IS NULL
        OR last_test_status IN ('queued', 'delivered', 'failed', 'preview_only')
    ),
    last_test_metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(last_test_metadata) = 'object'),
    last_error TEXT CHECK (last_error IS NULL OR btrim(last_error) <> ''),
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX partner_webhook_subscriptions_organisation_created_at_idx
    ON partner_webhook_subscriptions (organisation_id, created_at DESC)
    WHERE organisation_id IS NOT NULL;
CREATE INDEX partner_webhook_subscriptions_status_idx
    ON partner_webhook_subscriptions (status, updated_at DESC);

CREATE TABLE partner_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    subscription_id BIGINT NOT NULL REFERENCES partner_webhook_subscriptions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (btrim(event_type) <> ''),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    status TEXT NOT NULL CHECK (status IN ('queued', 'delivered', 'failed', 'preview_only')),
    attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
    last_error TEXT CHECK (last_error IS NULL OR btrim(last_error) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    CHECK (delivered_at IS NULL OR delivered_at >= created_at)
);

CREATE INDEX partner_webhook_events_subscription_created_at_idx
    ON partner_webhook_events (subscription_id, created_at DESC);
CREATE INDEX partner_webhook_events_status_created_at_idx
    ON partner_webhook_events (status, created_at DESC);

CREATE TABLE partner_export_runs (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE,
    requested_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    format TEXT NOT NULL CHECK (format IN ('json', 'csv')),
    scope JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(scope) = 'object'),
    record_counts JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(record_counts) = 'object'),
    checksum TEXT NOT NULL CHECK (btrim(checksum) <> ''),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX partner_export_runs_organisation_created_at_idx
    ON partner_export_runs (organisation_id, created_at DESC)
    WHERE organisation_id IS NOT NULL;
CREATE INDEX partner_export_runs_requested_by_created_at_idx
    ON partner_export_runs (requested_by_user_id, created_at DESC)
    WHERE requested_by_user_id IS NOT NULL;

CREATE TABLE integration_status_checks (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE,
    check_name TEXT NOT NULL CHECK (btrim(check_name) <> ''),
    status TEXT NOT NULL CHECK (status IN ('passing', 'attention', 'failing')),
    summary TEXT NOT NULL CHECK (btrim(summary) <> ''),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX integration_status_checks_org_name_unique_idx
    ON integration_status_checks (COALESCE(organisation_id, 0), check_name);
CREATE INDEX integration_status_checks_status_checked_at_idx
    ON integration_status_checks (status, checked_at DESC);
