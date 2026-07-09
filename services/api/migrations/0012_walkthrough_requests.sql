CREATE TABLE walkthrough_requests (
    id               BIGSERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    work_email       TEXT NOT NULL,
    organization     TEXT NOT NULL,
    role             TEXT NOT NULL,
    interest         TEXT NOT NULL
                        CHECK (interest IN
                            ('clinic_operator','government','ngo','investor','other')),
    note             TEXT NOT NULL DEFAULT '',
    requested_date   DATE NOT NULL,
    requested_time   TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 45)),
    status           TEXT NOT NULL DEFAULT 'new'
                        CHECK (status IN ('new','contacted','completed','archived')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_walkthrough_requests_status_created
    ON walkthrough_requests (status, created_at DESC);
