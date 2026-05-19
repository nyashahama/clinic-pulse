-- Local-only Phase 3 auth demo users.
-- This file is intentionally outside services/api/migrations and is not run automatically.
-- Password hashes correspond to the local demo password shared out-of-band.
BEGIN;

UPDATE organisations
SET
    name = 'Tshwane North District',
    slug = 'tshwane-north-district',
    updated_at = now()
WHERE lower(slug) = 'tshwane-north-demo-district'
    AND NOT EXISTS (
        SELECT 1
        FROM organisations existing
        WHERE lower(existing.slug) = 'tshwane-north-district'
    );

ALTER TABLE report_reviews DISABLE TRIGGER report_reviews_immutable_after_insert_trg;
ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable_after_insert_trg;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
DELETE FROM organisation_memberships legacy_memberships
USING current_organisation, legacy_organisation
WHERE legacy_memberships.organisation_id = legacy_organisation.id
    AND EXISTS (
        SELECT 1
        FROM organisation_memberships existing
        WHERE existing.user_id = legacy_memberships.user_id
            AND existing.role = legacy_memberships.role
            AND COALESCE(existing.organisation_id, 0) = COALESCE(current_organisation.id, 0)
            AND COALESCE(existing.district, '') = COALESCE(
                CASE
                    WHEN legacy_memberships.district = 'Tshwane North Demo District'
                        THEN 'Tshwane North District'
                    ELSE legacy_memberships.district
                END,
                ''
            )
    );

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE organisation_memberships legacy_memberships
SET
    organisation_id = current_organisation.id,
    district = CASE
        WHEN legacy_memberships.district = 'Tshwane North Demo District'
            THEN 'Tshwane North District'
        ELSE legacy_memberships.district
    END
FROM current_organisation, legacy_organisation
WHERE legacy_memberships.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE report_reviews
SET organisation_id = current_organisation.id
FROM current_organisation, legacy_organisation
WHERE report_reviews.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE audit_events
SET organisation_id = current_organisation.id
FROM current_organisation, legacy_organisation
WHERE audit_events.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE report_sync_attempts
SET organisation_id = current_organisation.id
FROM current_organisation, legacy_organisation
WHERE report_sync_attempts.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE pilot_ingestion_runs
SET organisation_id = current_organisation.id
FROM current_organisation, legacy_organisation
WHERE pilot_ingestion_runs.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE partner_api_keys
SET
    organisation_id = current_organisation.id,
    allowed_districts = CASE
        WHEN allowed_districts = '["Tshwane North Demo District"]'::jsonb
            THEN '["Tshwane North District"]'::jsonb
        ELSE allowed_districts
    END,
    updated_at = now()
FROM current_organisation, legacy_organisation
WHERE partner_api_keys.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE partner_webhook_subscriptions
SET
    organisation_id = current_organisation.id,
    updated_at = now()
FROM current_organisation, legacy_organisation
WHERE partner_webhook_subscriptions.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE partner_export_runs
SET
    organisation_id = current_organisation.id,
    scope = CASE
        WHEN scope->>'district' = 'Tshwane North Demo District'
            THEN jsonb_set(scope, '{district}', '"Tshwane North District"', true)
        ELSE scope
    END
FROM current_organisation, legacy_organisation
WHERE partner_export_runs.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
DELETE FROM integration_status_checks legacy_checks
USING current_organisation, legacy_organisation
WHERE legacy_checks.organisation_id = legacy_organisation.id
    AND EXISTS (
        SELECT 1
        FROM integration_status_checks existing
        WHERE existing.organisation_id = current_organisation.id
            AND existing.check_name = legacy_checks.check_name
    );

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
)
UPDATE integration_status_checks
SET organisation_id = current_organisation.id
FROM current_organisation, legacy_organisation
WHERE integration_status_checks.organisation_id = legacy_organisation.id;

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
)
DELETE FROM organisations
USING current_organisation
WHERE lower(organisations.slug) = 'tshwane-north-demo-district';

ALTER TABLE audit_events ENABLE TRIGGER audit_events_immutable_after_insert_trg;
ALTER TABLE report_reviews ENABLE TRIGGER report_reviews_immutable_after_insert_trg;

COMMIT;

WITH seed_organisation AS (
    INSERT INTO organisations (name, slug)
    SELECT 'Tshwane North District', 'tshwane-north-district'
    WHERE NOT EXISTS (
        SELECT 1
        FROM organisations
        WHERE lower(slug) = 'tshwane-north-district'
    )
    RETURNING id
)
UPDATE organisations
SET
    name = 'Tshwane North District',
    slug = 'tshwane-north-district',
    updated_at = now()
WHERE lower(slug) = 'tshwane-north-district';

WITH seed_users (email, display_name, password_hash) AS (
    VALUES
        ('system-admin@clinicpulse.local', 'System Admin', '$2b$10$Wb1y1.FnS/YJ7TINBCsJCuysK7qDRweyevzs46UjsZV/hzy8P/JeG'),
        ('org-admin@clinicpulse.local', 'Organisation Admin', '$2b$10$Wb1y1.FnS/YJ7TINBCsJCuysK7qDRweyevzs46UjsZV/hzy8P/JeG'),
        ('district-manager@clinicpulse.local', 'District Manager', '$2b$10$Wb1y1.FnS/YJ7TINBCsJCuysK7qDRweyevzs46UjsZV/hzy8P/JeG'),
        ('reporter@clinicpulse.local', 'Reporter', '$2b$10$Wb1y1.FnS/YJ7TINBCsJCuysK7qDRweyevzs46UjsZV/hzy8P/JeG')
), inserted_users AS (
    INSERT INTO users (email, display_name, password_hash, password_changed_at, password_reset_required)
    SELECT seed_users.email, seed_users.display_name, seed_users.password_hash, now(), false
    FROM seed_users
    WHERE NOT EXISTS (
        SELECT 1
        FROM users
        WHERE lower(users.email) = lower(seed_users.email)
    )
    RETURNING id
)
UPDATE users
SET
    email = seed_users.email,
    display_name = seed_users.display_name,
    password_hash = seed_users.password_hash,
    disabled_at = NULL,
    password_changed_at = now(),
    password_reset_required = false,
    updated_at = now()
FROM seed_users
WHERE lower(users.email) = lower(seed_users.email);

WITH seed_memberships (email, role, district) AS (
    VALUES
        ('system-admin@clinicpulse.local', 'system_admin', NULL),
        ('org-admin@clinicpulse.local', 'org_admin', NULL),
        ('district-manager@clinicpulse.local', 'district_manager', 'Tshwane North District'),
        ('reporter@clinicpulse.local', 'reporter', NULL)
), demo_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), resolved_memberships AS (
    SELECT
        users.id AS user_id,
        seed_memberships.role,
        CASE
            WHEN seed_memberships.role = 'system_admin' THEN NULL::BIGINT
            ELSE demo_organisation.id
        END AS organisation_id,
        seed_memberships.district
    FROM seed_memberships
    JOIN users ON lower(users.email) = lower(seed_memberships.email)
    CROSS JOIN demo_organisation
)
INSERT INTO organisation_memberships (organisation_id, user_id, role, district)
SELECT
    resolved_memberships.organisation_id,
    resolved_memberships.user_id,
    resolved_memberships.role,
    resolved_memberships.district
FROM resolved_memberships
WHERE NOT EXISTS (
    SELECT 1
    FROM organisation_memberships
    WHERE organisation_memberships.user_id = resolved_memberships.user_id
        AND organisation_memberships.role = resolved_memberships.role
        AND COALESCE(organisation_memberships.organisation_id, 0) =
            COALESCE(resolved_memberships.organisation_id, 0)
        AND COALESCE(organisation_memberships.district, '') =
            COALESCE(resolved_memberships.district, '')
);
