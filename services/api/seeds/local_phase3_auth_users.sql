-- Local-only Phase 3 auth users.
-- This file is intentionally outside services/api/migrations and is not run automatically.
-- Password hashes correspond to the local walkthrough password shared out-of-band.
BEGIN;

CREATE TEMP TABLE local_phase3_org_merge ON COMMIT DROP AS
SELECT
    legacy.id AS legacy_org_id,
    COALESCE(current_org.id, legacy.id) AS target_org_id,
    current_org.id IS NOT NULL AS has_current_org
FROM organisations legacy
LEFT JOIN organisations current_org
    ON lower(current_org.slug) = 'tshwane-north-district'
WHERE lower(legacy.slug) = 'tshwane-north-demo-district';

ALTER TABLE report_reviews DISABLE TRIGGER report_reviews_immutable_after_insert_trg;
ALTER TABLE audit_events DISABLE TRIGGER audit_events_immutable_after_insert_trg;

DELETE FROM organisation_memberships legacy_memberships
USING local_phase3_org_merge merge
WHERE merge.has_current_org
    AND legacy_memberships.organisation_id = merge.legacy_org_id
    AND EXISTS (
        SELECT 1
        FROM organisation_memberships existing
        WHERE existing.user_id = legacy_memberships.user_id
            AND existing.role = legacy_memberships.role
            AND COALESCE(existing.organisation_id, 0) = COALESCE(merge.target_org_id, 0)
            AND COALESCE(existing.district, '') = COALESCE(
                CASE
                    WHEN legacy_memberships.district = 'Tshwane North Demo District'
                        THEN 'Tshwane North District'
                    ELSE legacy_memberships.district
                END,
                ''
            )
    );

UPDATE organisation_memberships legacy_memberships
SET
    organisation_id = merge.target_org_id,
    district = CASE
        WHEN legacy_memberships.district = 'Tshwane North Demo District'
            THEN 'Tshwane North District'
        ELSE legacy_memberships.district
    END
FROM local_phase3_org_merge merge
WHERE legacy_memberships.organisation_id = merge.legacy_org_id;

UPDATE report_reviews
SET organisation_id = merge.target_org_id
FROM local_phase3_org_merge merge
WHERE report_reviews.organisation_id = merge.legacy_org_id;

UPDATE audit_events
SET organisation_id = merge.target_org_id
FROM local_phase3_org_merge merge
WHERE audit_events.organisation_id = merge.legacy_org_id;

UPDATE report_sync_attempts
SET organisation_id = merge.target_org_id
FROM local_phase3_org_merge merge
WHERE report_sync_attempts.organisation_id = merge.legacy_org_id;

UPDATE pilot_ingestion_runs
SET organisation_id = merge.target_org_id
FROM local_phase3_org_merge merge
WHERE pilot_ingestion_runs.organisation_id = merge.legacy_org_id;

UPDATE partner_api_keys
SET
    organisation_id = merge.target_org_id,
    allowed_districts = CASE
        WHEN allowed_districts = '["Tshwane North Demo District"]'::jsonb
            THEN '["Tshwane North District"]'::jsonb
        ELSE allowed_districts
    END,
    updated_at = now()
FROM local_phase3_org_merge merge
WHERE partner_api_keys.organisation_id = merge.legacy_org_id;

UPDATE partner_webhook_subscriptions
SET
    organisation_id = merge.target_org_id,
    updated_at = now()
FROM local_phase3_org_merge merge
WHERE partner_webhook_subscriptions.organisation_id = merge.legacy_org_id;

UPDATE partner_export_runs
SET
    organisation_id = merge.target_org_id,
    scope = CASE
        WHEN scope->>'district' = 'Tshwane North Demo District'
            THEN jsonb_set(scope, '{district}', '"Tshwane North District"', true)
        ELSE scope
    END
FROM local_phase3_org_merge merge
WHERE partner_export_runs.organisation_id = merge.legacy_org_id;

DELETE FROM integration_status_checks legacy_checks
USING local_phase3_org_merge merge
WHERE merge.has_current_org
    AND legacy_checks.organisation_id = merge.legacy_org_id
    AND EXISTS (
        SELECT 1
        FROM integration_status_checks existing
        WHERE existing.organisation_id = merge.target_org_id
            AND existing.check_name = legacy_checks.check_name
    );

UPDATE integration_status_checks
SET organisation_id = merge.target_org_id
FROM local_phase3_org_merge merge
WHERE integration_status_checks.organisation_id = merge.legacy_org_id;

DELETE FROM organisations legacy
USING local_phase3_org_merge merge
WHERE merge.has_current_org
    AND legacy.id = merge.legacy_org_id;

UPDATE organisations legacy
SET
    name = 'Tshwane North District',
    slug = 'tshwane-north-district',
    updated_at = now()
FROM local_phase3_org_merge merge
WHERE NOT merge.has_current_org
    AND legacy.id = merge.legacy_org_id;

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
