-- Local-only Phase 3 auth demo users.
-- This file is intentionally outside services/api/migrations and is not run automatically.
-- Password hashes correspond to the local demo password shared out-of-band.
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

WITH current_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), legacy_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
), moved_memberships AS (
    UPDATE organisation_memberships
    SET
        organisation_id = current_organisation.id,
        district = CASE
            WHEN organisation_memberships.district = 'Tshwane North Demo District'
                THEN 'Tshwane North District'
            ELSE organisation_memberships.district
        END
    FROM current_organisation, legacy_organisation
    WHERE organisation_memberships.organisation_id = legacy_organisation.id
        AND NOT EXISTS (
            SELECT 1
            FROM organisation_memberships existing
            WHERE existing.user_id = organisation_memberships.user_id
                AND existing.role = organisation_memberships.role
                AND COALESCE(existing.organisation_id, 0) =
                    COALESCE(current_organisation.id, 0)
                AND COALESCE(existing.district, '') =
                    COALESCE(
                        CASE
                            WHEN organisation_memberships.district = 'Tshwane North Demo District'
                                THEN 'Tshwane North District'
                            ELSE organisation_memberships.district
                        END,
                        ''
                    )
        )
    RETURNING organisation_memberships.id
), pruned_memberships AS (
    DELETE FROM organisation_memberships
    USING current_organisation, legacy_organisation
    WHERE organisation_memberships.organisation_id = legacy_organisation.id
        AND EXISTS (
            SELECT 1
            FROM organisation_memberships existing
            WHERE existing.user_id = organisation_memberships.user_id
                AND existing.role = organisation_memberships.role
                AND COALESCE(existing.organisation_id, 0) =
                    COALESCE(current_organisation.id, 0)
                AND COALESCE(existing.district, '') =
                    COALESCE(
                        CASE
                            WHEN organisation_memberships.district = 'Tshwane North Demo District'
                                THEN 'Tshwane North District'
                            ELSE organisation_memberships.district
                        END,
                        ''
                    )
        )
    RETURNING organisation_memberships.id
)
DELETE FROM organisations
USING current_organisation
WHERE lower(organisations.slug) = 'tshwane-north-demo-district';

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
