CREATE TABLE organisations (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    slug TEXT NOT NULL CHECK (btrim(slug) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX organisations_slug_lower_unique_idx ON organisations (lower(slug));

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL CHECK (btrim(email) <> ''),
    display_name TEXT NOT NULL CHECK (btrim(display_name) <> ''),
    password_hash TEXT CHECK (password_hash IS NULL OR btrim(password_hash) <> ''),
    disabled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX users_email_lower_unique_idx ON users (lower(email));

CREATE TABLE organisation_memberships (
    id BIGSERIAL PRIMARY KEY,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (
        role IN ('system_admin', 'org_admin', 'district_manager', 'reporter')
    ),
    district TEXT CHECK (district IS NULL OR btrim(district) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (
        (role = 'system_admin' AND organisation_id IS NULL AND district IS NULL)
        OR (role IN ('org_admin', 'reporter') AND organisation_id IS NOT NULL AND district IS NULL)
        OR (role = 'district_manager' AND organisation_id IS NOT NULL AND district IS NOT NULL)
    )
);

CREATE UNIQUE INDEX organisation_memberships_one_role_per_scope_unique_idx
    ON organisation_memberships (
        user_id,
        role,
        COALESCE(organisation_id, 0),
        COALESCE(district, '')
    );
CREATE INDEX organisation_memberships_user_idx ON organisation_memberships (user_id);
CREATE INDEX organisation_memberships_organisation_role_idx
    ON organisation_memberships (organisation_id, role);
CREATE INDEX organisation_memberships_district_role_idx
    ON organisation_memberships (organisation_id, district, role)
    WHERE district IS NOT NULL;

CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL CHECK (btrim(token_hash) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    user_agent TEXT CHECK (user_agent IS NULL OR btrim(user_agent) <> ''),
    ip_address INET,
    CHECK (expires_at > created_at),
    CHECK (revoked_at IS NULL OR revoked_at >= created_at),
    CHECK (last_seen_at IS NULL OR last_seen_at >= created_at)
);

CREATE UNIQUE INDEX sessions_token_hash_unique_idx ON sessions (token_hash);
CREATE INDEX sessions_user_active_idx ON sessions (user_id, expires_at DESC)
    WHERE revoked_at IS NULL;
CREATE INDEX sessions_expiry_revocation_cleanup_idx ON sessions (expires_at, revoked_at);

ALTER TABLE reports
    ADD COLUMN submitted_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reviewed_at TIMESTAMPTZ,
    ADD COLUMN review_notes TEXT CHECK (review_notes IS NULL OR btrim(review_notes) <> ''),
    ADD CONSTRAINT reports_review_state_value_chk
        CHECK (review_state IN ('pending', 'accepted', 'rejected')),
    ADD CONSTRAINT reports_review_actor_timestamp_pair_chk
        CHECK (
            (reviewed_by_user_id IS NULL AND reviewed_at IS NULL)
            OR (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)
        );

CREATE INDEX reports_submitted_by_user_idx ON reports (submitted_by_user_id)
    WHERE submitted_by_user_id IS NOT NULL;
CREATE INDEX reports_reviewed_by_user_idx ON reports (reviewed_by_user_id)
    WHERE reviewed_by_user_id IS NOT NULL;
CREATE INDEX reports_review_state_received_at_idx ON reports (review_state, received_at DESC);
CREATE INDEX reports_pending_review_idx ON reports (received_at)
    WHERE review_state = 'pending';

CREATE TABLE report_reviews (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL REFERENCES reports(id) ON DELETE RESTRICT,
    reviewer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    organisation_id BIGINT REFERENCES organisations(id) ON DELETE RESTRICT,
    decision TEXT NOT NULL CHECK (decision IN ('accepted', 'rejected')),
    notes TEXT CHECK (notes IS NULL OR btrim(notes) <> ''),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX report_reviews_one_decision_per_report_unique_idx
    ON report_reviews (report_id);
CREATE INDEX report_reviews_reviewer_created_at_idx
    ON report_reviews (reviewer_user_id, created_at DESC);
CREATE INDEX report_reviews_organisation_created_at_idx
    ON report_reviews (organisation_id, created_at DESC)
    WHERE organisation_id IS NOT NULL;
CREATE INDEX report_reviews_decision_created_at_idx
    ON report_reviews (decision, created_at DESC);

CREATE FUNCTION prevent_report_reviews_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'report_reviews rows are immutable after insertion'
        USING ERRCODE = 'integrity_constraint_violation';
END;
$$;

CREATE TRIGGER report_reviews_immutable_after_insert_trg
    BEFORE UPDATE OR DELETE ON report_reviews
    FOR EACH ROW
    EXECUTE FUNCTION prevent_report_reviews_mutation();

CREATE TRIGGER report_reviews_immutable_truncate_trg
    BEFORE TRUNCATE ON report_reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION prevent_report_reviews_mutation();

ALTER TABLE audit_events
    ADD COLUMN actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN actor_role TEXT CHECK (
        actor_role IS NULL
        OR actor_role IN ('system_admin', 'org_admin', 'district_manager', 'reporter')
    ),
    ADD COLUMN organisation_id BIGINT REFERENCES organisations(id) ON DELETE SET NULL,
    ADD COLUMN entity_type TEXT CHECK (entity_type IS NULL OR btrim(entity_type) <> ''),
    ADD COLUMN entity_id TEXT CHECK (entity_id IS NULL OR btrim(entity_id) <> ''),
    ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object');

CREATE INDEX audit_events_actor_user_created_at_idx
    ON audit_events (actor_user_id, created_at DESC)
    WHERE actor_user_id IS NOT NULL;
CREATE INDEX audit_events_actor_role_created_at_idx
    ON audit_events (actor_role, created_at DESC)
    WHERE actor_role IS NOT NULL;
CREATE INDEX audit_events_organisation_created_at_idx
    ON audit_events (organisation_id, created_at DESC)
    WHERE organisation_id IS NOT NULL;
CREATE INDEX audit_events_entity_created_at_idx
    ON audit_events (entity_type, entity_id, created_at DESC)
    WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;
