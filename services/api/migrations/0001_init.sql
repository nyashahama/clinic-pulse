CREATE TABLE clinics (
    id TEXT PRIMARY KEY CHECK (btrim(id) <> ''),
    name TEXT NOT NULL CHECK (btrim(name) <> ''),
    facility_code TEXT NOT NULL UNIQUE CHECK (btrim(facility_code) <> ''),
    province TEXT NOT NULL CHECK (btrim(province) <> ''),
    district TEXT NOT NULL CHECK (btrim(district) <> ''),
    latitude NUMERIC(9, 6) CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    longitude NUMERIC(9, 6) CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    operating_hours TEXT,
    facility_type TEXT NOT NULL CHECK (btrim(facility_type) <> ''),
    verification_status TEXT NOT NULL CHECK (btrim(verification_status) <> ''),
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE clinic_services (
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL CHECK (btrim(service_name) <> ''),
    current_availability TEXT NOT NULL CHECK (btrim(current_availability) <> ''),
    confidence_score NUMERIC(5, 4) CHECK (
        confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
    ),
    last_verified_at TIMESTAMPTZ,
    PRIMARY KEY (clinic_id, service_name)
);

CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    reporter_name TEXT CHECK (reporter_name IS NULL OR btrim(reporter_name) <> ''),
    source TEXT NOT NULL CHECK (btrim(source) <> ''),
    offline_created BOOLEAN NOT NULL DEFAULT false,
    submitted_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL CHECK (btrim(status) <> ''),
    reason TEXT CHECK (reason IS NULL OR btrim(reason) <> ''),
    staff_pressure TEXT CHECK (staff_pressure IS NULL OR btrim(staff_pressure) <> ''),
    stock_pressure TEXT CHECK (stock_pressure IS NULL OR btrim(stock_pressure) <> ''),
    queue_pressure TEXT CHECK (queue_pressure IS NULL OR btrim(queue_pressure) <> ''),
    notes TEXT CHECK (notes IS NULL OR btrim(notes) <> ''),
    review_state TEXT NOT NULL DEFAULT 'pending' CHECK (btrim(review_state) <> ''),
    confidence_score NUMERIC(5, 4) CHECK (
        confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
    )
);

CREATE TABLE current_status (
    clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (btrim(status) <> ''),
    reason TEXT CHECK (reason IS NULL OR btrim(reason) <> ''),
    freshness TEXT NOT NULL CHECK (btrim(freshness) <> ''),
    last_reported_at TIMESTAMPTZ,
    reporter_name TEXT CHECK (reporter_name IS NULL OR btrim(reporter_name) <> ''),
    source TEXT CHECK (source IS NULL OR btrim(source) <> ''),
    staff_pressure TEXT CHECK (staff_pressure IS NULL OR btrim(staff_pressure) <> ''),
    stock_pressure TEXT CHECK (stock_pressure IS NULL OR btrim(stock_pressure) <> ''),
    queue_pressure TEXT CHECK (queue_pressure IS NULL OR btrim(queue_pressure) <> ''),
    confidence_score NUMERIC(5, 4) CHECK (
        confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)
    ),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
    id BIGSERIAL PRIMARY KEY,
    clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    actor_name TEXT CHECK (actor_name IS NULL OR btrim(actor_name) <> ''),
    event_type TEXT NOT NULL CHECK (btrim(event_type) <> ''),
    summary TEXT NOT NULL CHECK (btrim(summary) <> ''),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reports_clinic_received_at_idx ON reports (clinic_id, received_at DESC);
CREATE INDEX audit_events_clinic_created_at_idx ON audit_events (clinic_id, created_at DESC);
CREATE INDEX current_status_status_idx ON current_status (status);
CREATE INDEX clinic_services_service_name_idx ON clinic_services (service_name);
