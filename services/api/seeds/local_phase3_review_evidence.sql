-- Local-only Phase 3 review evidence seed.
-- This file is intentionally outside services/api/migrations and is not run automatically.
-- It gives local review environments realistic ingestion, sync, review, webhook, and export evidence.
WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), org_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'org-admin@clinicpulse.local'
), system_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'system-admin@clinicpulse.local'
), reporter AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'reporter@clinicpulse.local'
)
INSERT INTO pilot_ingestion_runs (
    id,
    organisation_id,
    source_name,
    source_reference,
    status,
    records_received,
    records_imported,
    records_rejected,
    validation_errors,
    actor_user_id,
    started_at,
    completed_at
)
SELECT
    seed.id,
    demo_org.id,
    seed.source_name,
    seed.source_reference,
    seed.status,
    seed.records_received,
    seed.records_imported,
    seed.records_rejected,
    seed.validation_errors::jsonb,
    org_admin.id,
    seed.started_at,
    seed.completed_at
FROM demo_org
CROSS JOIN org_admin
CROSS JOIN (
    VALUES
        (
            'pilot-ingestion-2026-05-01-morning',
            'Tshwane North facility roster import',
            'tn-demo-roster-2026-05-01T07:00Z',
            'succeeded',
            8,
            8,
            0,
            '[]',
            now() - interval '6 hours',
            now() - interval '5 hours 56 minutes'
        ),
        (
            'pilot-ingestion-2026-05-01-offline-sync',
            'Field worker offline sync batch',
            'offline-sync-batch-2026-05-01T08:30Z',
            'partial',
            5,
            4,
            1,
            '[{"externalId":"offline-validation-001","field":"status","message":"status must be one of the allowed operational states"}]',
            now() - interval '4 hours',
            now() - interval '3 hours 57 minutes'
        )
) AS seed (
    id,
    source_name,
    source_reference,
    status,
    records_received,
    records_imported,
    records_rejected,
    validation_errors,
    started_at,
    completed_at
)
ON CONFLICT (id) DO UPDATE SET
    organisation_id = EXCLUDED.organisation_id,
    source_name = EXCLUDED.source_name,
    source_reference = EXCLUDED.source_reference,
    status = EXCLUDED.status,
    records_received = EXCLUDED.records_received,
    records_imported = EXCLUDED.records_imported,
    records_rejected = EXCLUDED.records_rejected,
    validation_errors = EXCLUDED.validation_errors,
    actor_user_id = EXCLUDED.actor_user_id,
    started_at = EXCLUDED.started_at,
    completed_at = EXCLUDED.completed_at;

WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), org_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'org-admin@clinicpulse.local'
), review_rows AS (
    SELECT
        reports.id AS report_id,
        org_admin.id AS reviewer_user_id,
        demo_org.id AS organisation_id,
        seed.decision,
        seed.notes,
        seed.metadata::jsonb,
        seed.created_at::timestamptz
    FROM demo_org
    CROSS JOIN org_admin
    JOIN (
        VALUES
            (
                'report-001',
                'accepted',
                'Morning stock reconciliation confirmed with clinic coordinator.',
                '{"source":"local_phase3_review_evidence","confidence":"high"}',
                '2026-05-01T06:44:00.000Z'
            ),
            (
                'report-003',
                'accepted',
                'Courier delay matched district transport desk escalation.',
                '{"source":"local_phase3_review_evidence","confidence":"medium"}',
                '2026-05-01T06:05:00.000Z'
            ),
            (
                'report-006',
                'rejected',
                'Network blackout report remains unconfirmed and needs field follow-up.',
                '{"source":"local_phase3_review_evidence","confidence":"low"}',
                '2026-04-30T05:15:00.000Z'
            )
    ) AS seed (external_id, decision, notes, metadata, created_at)
        ON true
    JOIN reports ON reports.external_id = seed.external_id
)
INSERT INTO report_reviews (
    report_id,
    reviewer_user_id,
    organisation_id,
    decision,
    notes,
    metadata,
    created_at
)
SELECT
    review_rows.report_id,
    review_rows.reviewer_user_id,
    review_rows.organisation_id,
    review_rows.decision,
    review_rows.notes,
    review_rows.metadata,
    review_rows.created_at
FROM review_rows
WHERE NOT EXISTS (
    SELECT 1
    FROM report_reviews
    WHERE report_reviews.report_id = review_rows.report_id
);

UPDATE reports
SET
    review_state = report_reviews.decision,
    reviewed_by_user_id = report_reviews.reviewer_user_id,
    reviewed_at = report_reviews.created_at,
    review_notes = report_reviews.notes
FROM report_reviews
WHERE reports.id = report_reviews.report_id
    AND reports.external_id IN ('report-001', 'report-003', 'report-006');

WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), reporter AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'reporter@clinicpulse.local'
), report_rows AS (
    SELECT external_id, id, clinic_id
    FROM reports
    WHERE external_id IN ('report-001', 'report-003', 'report-009')
)
INSERT INTO report_sync_attempts (
    external_id,
    report_id,
    submitted_by_user_id,
    organisation_id,
    clinic_id,
    result,
    client_attempt_count,
    queued_at,
    submitted_at,
    received_at,
    error_code,
    error_message,
    metadata
)
SELECT
    seed.external_id,
    report_rows.id,
    reporter.id,
    demo_org.id,
    report_rows.clinic_id,
    seed.result,
    seed.client_attempt_count,
    seed.queued_at,
    seed.submitted_at,
    seed.received_at,
    seed.error_code,
    seed.error_message,
    seed.metadata::jsonb
FROM demo_org
CROSS JOIN reporter
JOIN (
    VALUES
        (
            'sync-created-report-001',
            'report-001',
            'created',
            1,
            now() - interval '5 hours 8 minutes',
            now() - interval '5 hours 6 minutes',
            now() - interval '5 hours 2 minutes',
            NULL,
            NULL,
            '{"deviceId":"field-tablet-01","network":"online"}'
        ),
        (
            'sync-duplicate-report-009',
            'report-009',
            'duplicate',
            2,
            now() - interval '4 hours 12 minutes',
            now() - interval '4 hours 1 minute',
            now() - interval '4 hours',
            'duplicate_report',
            'A matching report is already waiting for review.',
            '{"deviceId":"field-tablet-02","network":"restored"}'
        ),
        (
            'sync-validation-ga-rankuwa',
            'report-003',
            'validation_error',
            1,
            now() - interval '3 hours 13 minutes',
            now() - interval '3 hours 12 minutes',
            now() - interval '3 hours 11 minutes',
            'invalid_status',
            'status must be one of: operational, degraded, non_functional, unknown',
            '{"deviceId":"field-tablet-03","network":"online"}'
        )
) AS seed (
    external_id,
    report_external_id,
    result,
    client_attempt_count,
    queued_at,
    submitted_at,
    received_at,
    error_code,
    error_message,
    metadata
)
    ON true
JOIN report_rows ON report_rows.external_id = seed.report_external_id
WHERE NOT EXISTS (
    SELECT 1
    FROM report_sync_attempts
    WHERE report_sync_attempts.external_id = seed.external_id
);

WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), org_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'org-admin@clinicpulse.local'
)
INSERT INTO partner_api_keys (
    organisation_id,
    name,
    environment,
    key_prefix,
    key_hash,
    scopes,
    allowed_districts,
    expires_at,
    last_used_at,
    last_used_ip,
    created_by_user_id,
    created_at,
    updated_at
)
SELECT
    demo_org.id,
    'Local review partner API key',
    'demo',
    'cp_demo_review',
    'sha256:local-review-partner-api-key',
    '["clinics:read","status:read","alternatives:read","exports:read"]'::jsonb,
    '["Tshwane North District"]'::jsonb,
    '2026-12-31T23:59:59.000Z'::timestamptz,
    '2026-05-01T08:41:00.000Z'::timestamptz,
    '127.0.0.1'::inet,
    org_admin.id,
    '2026-05-01T08:40:00.000Z'::timestamptz,
    '2026-05-01T08:41:00.000Z'::timestamptz
FROM demo_org
CROSS JOIN org_admin
WHERE NOT EXISTS (
    SELECT 1
    FROM partner_api_keys
    WHERE partner_api_keys.key_hash = 'sha256:local-review-partner-api-key'
);

WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), org_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'org-admin@clinicpulse.local'
), subscription AS (
    INSERT INTO partner_webhook_subscriptions (
        organisation_id,
        name,
        target_url,
        event_types,
        secret_hash,
        status,
        last_tested_at,
        last_test_status,
        last_test_metadata,
        created_by_user_id,
        created_at,
        updated_at
    )
    SELECT
        demo_org.id,
        'Local review webhook',
        'https://partner.example.test/clinicpulse/webhooks',
        '["clinicpulse.report_reviewed","clinicpulse.status_changed"]'::jsonb,
        'sha256:local-review-webhook-secret',
        'active',
        '2026-05-01T08:48:00.000Z'::timestamptz,
        'preview_only',
        '{"mode":"local_review_seed","secretStored":"hash_only"}'::jsonb,
        org_admin.id,
        '2026-05-01T08:45:00.000Z'::timestamptz,
        '2026-05-01T08:48:00.000Z'::timestamptz
    FROM demo_org
    CROSS JOIN org_admin
    WHERE NOT EXISTS (
        SELECT 1
        FROM partner_webhook_subscriptions
        WHERE partner_webhook_subscriptions.name = 'Local review webhook'
            AND partner_webhook_subscriptions.organisation_id = demo_org.id
    )
    RETURNING id
), selected_subscription AS (
    SELECT id
    FROM subscription
    UNION ALL
    SELECT id
    FROM partner_webhook_subscriptions
    WHERE name = 'Local review webhook'
        AND NOT EXISTS (SELECT 1 FROM subscription)
)
INSERT INTO partner_webhook_events (
    subscription_id,
    event_type,
    payload,
    metadata,
    status,
    attempt_count,
    last_error,
    created_at,
    delivered_at
)
SELECT
    selected_subscription.id,
    'clinicpulse.webhook_test',
    '{"event":"clinicpulse.webhook_test","clinicId":"clinic-mamelodi-east","deliveryMode":"preview_only"}'::jsonb,
    '{"source":"local_phase3_review_evidence","secretExposed":false}'::jsonb,
    'preview_only',
    1,
    NULL,
    '2026-05-01T08:48:00.000Z'::timestamptz,
    NULL
FROM selected_subscription
WHERE NOT EXISTS (
    SELECT 1
    FROM partner_webhook_events
    WHERE partner_webhook_events.subscription_id = selected_subscription.id
        AND partner_webhook_events.event_type = 'clinicpulse.webhook_test'
);

WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), org_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'org-admin@clinicpulse.local'
)
INSERT INTO partner_export_runs (
    organisation_id,
    requested_by_user_id,
    format,
    scope,
    record_counts,
    checksum,
    payload,
    created_at
)
SELECT
    demo_org.id,
    org_admin.id,
    'json',
    '{"district":"Tshwane North District","mode":"local_review"}'::jsonb,
    '{"clinics":8,"statuses":8,"integrationChecks":6}'::jsonb,
    'sha256:local-review-partner-export',
    '{"generatedBy":"local_phase3_review_evidence","containsPatientData":false}'::jsonb,
    '2026-05-01T08:50:00.000Z'::timestamptz
FROM demo_org
CROSS JOIN org_admin
WHERE NOT EXISTS (
    SELECT 1
    FROM partner_export_runs
    WHERE partner_export_runs.checksum = 'sha256:local-review-partner-export'
);

WITH demo_org AS (
    SELECT id
    FROM organisations
    WHERE lower(slug) = 'tshwane-north-district'
), system_admin AS (
    SELECT users.id
    FROM users
    WHERE lower(users.email) = 'system-admin@clinicpulse.local'
)
INSERT INTO audit_events (
    external_id,
    clinic_id,
    actor_name,
    actor_user_id,
    actor_role,
    organisation_id,
    event_type,
    entity_type,
    entity_id,
    summary,
    metadata,
    created_at
)
SELECT
    seed.external_id,
    seed.clinic_id,
    'System Admin',
    system_admin.id,
    'system_admin',
    demo_org.id,
    seed.event_type,
    seed.entity_type,
    seed.entity_id,
    seed.summary,
    seed.metadata::jsonb,
    seed.created_at::timestamptz
FROM demo_org
CROSS JOIN system_admin
CROSS JOIN (
    VALUES
        (
            'audit-review-evidence-report-001',
            'clinic-mamelodi-east',
            'report.reviewed',
            'report',
            'report-001',
            'Report review accepted for Mamelodi East morning readiness.',
            '{"source":"local_phase3_review_evidence"}',
            '2026-05-01T06:44:00.000Z'
        ),
        (
            'audit-review-evidence-webhook-test',
            NULL,
            'partner.webhook_test_recorded',
            'partner_webhook_event',
            'clinicpulse.webhook_test',
            'Local review webhook preview recorded without exposing secrets.',
            '{"source":"local_phase3_review_evidence","secretExposed":false}',
            '2026-05-01T08:48:00.000Z'
        ),
        (
            'audit-review-evidence-export',
            NULL,
            'partner.export_generated',
            'partner_export_run',
            'sha256:local-review-partner-export',
            'Partner export generated for local review handoff.',
            '{"source":"local_phase3_review_evidence","containsPatientData":false}',
            '2026-05-01T08:50:00.000Z'
        )
) AS seed (
    external_id,
    clinic_id,
    event_type,
    entity_type,
    entity_id,
    summary,
    metadata,
    created_at
)
ON CONFLICT (external_id) DO NOTHING;
