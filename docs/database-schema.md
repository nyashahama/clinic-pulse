# Database Schema Overview

Postgres migrations live in `services/api/migrations`. They are the source of truth for table definitions, constraints, indexes, and seed data.

## Migration Ledger

| Table | Purpose |
| --- | --- |
| `schema_migrations` | Records SQL migration filename, checksum, and applied timestamp so managed databases are migrated once and checksum drift fails fast |

`make db-migrate` and the API migration command create this ledger automatically before applying pending SQL files.

Databases that already contain ClinicPulse tables but do not have a `schema_migrations` ledger are treated as pre-ledger schemas. The runner does not automatically adopt them: it creates the ledger, attempts the first pending SQL file, and fails safely if the schema objects already exist. Phase 1 staging should use a fresh managed database or a restored database that already includes the ledger. Any one-time ledger backfill must be deliberate, backed up, checksum-verified against the exact SQL files, and documented for operators before running the migrator again.

## Clinic Directory And Services

| Table | Purpose |
| --- | --- |
| `clinics` | Clinic identity, location, facility code, district, verification status, and operating hours |
| `clinic_services` | Per-clinic service availability and confidence score |
| `current_status` | Current operational status, reason, freshness, source, pressure fields, confidence, and timestamps |

Relationships:

- `clinic_services.clinic_id` references `clinics.id`.
- `current_status.clinic_id` references `clinics.id`.
- Status freshness indexes support district monitoring and stale-status reconciliation.

## Field Reports And Review

| Table | Purpose |
| --- | --- |
| `reports` | Submitted clinic reports from seed data, field workers, coordinators, and offline sync |
| `report_reviews` | Immutable accepted/rejected review decisions tied to reports and reviewers |

Relationships:

- `reports.clinic_id` references `clinics.id`.
- `reports.submitted_by_user_id` and `reports.reviewed_by_user_id` reference `users.id`.
- `report_reviews.report_id` references `reports.id`.
- `report_reviews.reviewer_user_id` references `users.id`.

Important behavior:

- Report review state is constrained to `pending`, `accepted`, or `rejected`.
- `report_reviews` rows are immutable after insert.

## Audit Events

| Table | Purpose |
| --- | --- |
| `audit_events` | Append-only operational history for status changes, report submissions, stale status, partner actions, and admin events |

Important behavior:

- `audit_events.clinic_id` can be null for non-clinic-specific events.
- Actor metadata can include user, role, organisation, entity type, entity id, and JSON metadata.
- Audit rows are immutable after insert.

## Auth And Roles

| Table | Purpose |
| --- | --- |
| `organisations` | Organisation identities and slugs |
| `users` | User identity, display name, password hash, disabled state, password lifecycle state, and timestamps |
| `organisation_memberships` | Role assignments scoped to system, organisation, or district |
| `sessions` | Hashed session tokens, expiry, revocation, user agent, IP, and last-seen state |
| `admin_user_access` | View joining users, memberships, organisation scope, disabled state, and latest active session signal for admin review |

Roles:

- `system_admin`
- `org_admin`
- `district_manager`
- `reporter`

The membership constraints enforce valid combinations of role, organisation, and district.

Important user lifecycle fields:

- `users.password_changed_at` records when the current password hash became active. Existing local seeded users are backfilled from `updated_at`.
- `users.password_reset_required` flags admin-provisioned accounts that should rotate their temporary password.
- `users.disabled_at` gates authentication and supports admin disable/enable workflows.

Important session behavior:

- `sessions.token_hash` stores only the session-token hash.
- `sessions.revoked_at` is set by logout and admin session revocation.
- `admin_user_access.last_seen_at` only considers active, unexpired, unrevoked sessions.

## Offline Sync

| Table | Purpose |
| --- | --- |
| `report_sync_attempts` | Records offline sync outcomes, duplicate/conflict handling, validation errors, and sync metadata |
| `pilot_ingestion_runs` | Records pilot source ingestion runs, source references, import/rejection counts, validation errors, actor, and completion state |

Important fields:

- `external_id` tracks client-generated report IDs.
- `result` is constrained to `created`, `duplicate`, `conflict`, `validation_error`, `forbidden`, or `server_error`.
- `clinic_id` can be null after migration `0007_nullable_sync_attempt_clinic_id.sql`.
- `pilot_ingestion_runs.validation_errors` stores an array of validation labels while the admin API exposes only the count.

## Pilot Data Provenance And Derived States

Pilot provenance is assembled from existing operational tables instead of one broad denormalized trust table:

- `reports.source`, `reports.offline_created`, `reports.review_state`, reviewer fields, and report timestamps provide field-report provenance and review evidence.
- `current_status.source`, `current_status.freshness`, `current_status.confidence_score`, and status timestamps provide the current operational data trust state.
- `report_sync_attempts` provides sync evidence for queued, synced, duplicate, conflict, validation, forbidden, and server-error outcomes.
- `audit_events` provides append-only evidence for report submission, report review, stale reconciliation, access, export, webhook, and admin actions.
- `pilot_ingestion_runs` provides controlled source-ingestion evidence when imported pilot data is available outside the field-report flow.

The frontend derives user-facing trust labels from these fields. Labels such as reviewed field data, pending review, stale, needs confirmation, failed sync, and seeded operating data are derived presentation states, not separate persisted enums.

## Partner Readiness, Webhooks, And Exports

| Table | Purpose |
| --- | --- |
| `partner_api_keys` | Hashed partner API keys, prefixes, scopes, allowed districts, expiry, revocation, and usage metadata |
| `partner_webhook_subscriptions` | Webhook target configuration, event types, status, secret hash, and test metadata |
| `partner_webhook_events` | Webhook delivery/test events, payloads, status, attempts, and delivery timestamps |
| `partner_export_runs` | JSON/CSV export runs, scope, record counts, checksum, payload, and requester |
| `integration_status_checks` | Partner integration readiness checks and latest status by organisation/check name |

Important behavior:

- Partner API key hashes are unique.
- Webhook events are tied to subscriptions.
- Export runs retain checksums and payloads for sandbox/admin inspection.
- Integration status checks are unique by organisation and check name.

## Seed Data

Seeded operational data is applied through migrations, especially `0002_seed_demo_data.sql`.

Local privileged auth users are seeded separately through:

```bash
make db-seed-auth
```

That target runs `services/api/seeds/local_phase3_auth_users.sql`.

## Migration Replay

`make db-bootstrap` applies pending SQL files in order through the migration ledger and then seeds local auth users. Use a fresh database, a database with a valid ledger, or the e2e reset target when intentionally replaying the full migration set.
