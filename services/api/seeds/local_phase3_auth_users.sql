-- Local-only Phase 3 auth demo users.
-- This file is intentionally outside services/api/migrations and is not run automatically.
-- Password hashes correspond to ignored local runbook credentials.
WITH seed_organisation AS (
    INSERT INTO organisations (name, slug)
    SELECT 'Tshwane North Demo District', 'tshwane-north-demo-district'
    WHERE NOT EXISTS (
        SELECT 1
        FROM organisations
        WHERE lower(slug) = 'tshwane-north-demo-district'
    )
    RETURNING id
)
UPDATE organisations
SET
    name = 'Tshwane North Demo District',
    slug = 'tshwane-north-demo-district',
    updated_at = now()
WHERE lower(slug) = 'tshwane-north-demo-district';

WITH seed_users (email, display_name, password_hash) AS (
    VALUES
        ('system-admin@clinicpulse.local', 'System Admin', '$2a$10$knasPITs/37CXcBFOWzpmu9MRyZQPBiGrkCbCktKlkL6UtBfjnY9.'),
        ('org-admin@clinicpulse.local', 'Organisation Admin', '$2a$10$knasPITs/37CXcBFOWzpmu9MRyZQPBiGrkCbCktKlkL6UtBfjnY9.'),
        ('district-manager@clinicpulse.local', 'District Manager', '$2a$10$knasPITs/37CXcBFOWzpmu9MRyZQPBiGrkCbCktKlkL6UtBfjnY9.'),
        ('reporter@clinicpulse.local', 'Reporter', '$2a$10$knasPITs/37CXcBFOWzpmu9MRyZQPBiGrkCbCktKlkL6UtBfjnY9.')
), inserted_users AS (
    INSERT INTO users (email, display_name, password_hash)
    SELECT seed_users.email, seed_users.display_name, seed_users.password_hash
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
    updated_at = now()
FROM seed_users
WHERE lower(users.email) = lower(seed_users.email);

WITH seed_memberships (email, role, district) AS (
    VALUES
        ('system-admin@clinicpulse.local', 'system_admin', NULL),
        ('org-admin@clinicpulse.local', 'org_admin', NULL),
        ('district-manager@clinicpulse.local', 'district_manager', 'Tshwane North Demo District'),
        ('reporter@clinicpulse.local', 'reporter', NULL)
), demo_organisation AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-demo-district'
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
