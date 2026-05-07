# Database Schema Overview

Postgres migrations live in `services/api/migrations`. They are the source of truth for table definitions, constraints, indexes, and seed data.

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
| `users` | User identity, display name, password hash, disabled state, and timestamps |
| `organisation_memberships` | Role assignments scoped to system, organisation, or district |
| `sessions` | Hashed session tokens, expiry, revocation, user agent, IP, and last-seen state |

Roles:

- `system_admin`
- `org_admin`
- `district_manager`
- `reporter`

The membership constraints enforce valid combinations of role, organisation, and district.

## Offline Sync

| Table | Purpose |
| --- | --- |
| `report_sync_attempts` | Records offline sync outcomes, duplicate/conflict handling, validation errors, and sync metadata |

Important fields:

- `external_id` tracks client-generated report IDs.
- `result` is constrained to `created`, `duplicate`, `conflict`, `validation_error`, `forbidden`, or `server_error`.
- `clinic_id` can be null after migration `0007_nullable_sync_attempt_clinic_id.sql`.

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
- Export runs retain checksums and payloads for demo/admin inspection.
- Integration status checks are unique by organisation and check name.

## Seed Data

Seeded operational data is applied through migrations, especially `0002_seed_demo_data.sql`.

Local privileged auth users are seeded separately through:

```bash
make db-seed-auth
```

That target runs `services/api/seeds/local_phase3_auth_users.sql`.

## Migration Caveat

`make db-bootstrap` applies SQL files in order to a fresh local database. The current migration runner does not maintain a migration ledger, so use a fresh database or the e2e reset target when replaying the full migration set.
