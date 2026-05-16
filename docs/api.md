# API Reference

The Go API is mounted from `services/api/internal/http/router.go`. Local default base URL: `http://localhost:8080`.

Browser requests from the Next.js app normally use `/api/clinicpulse/*`, which is rewritten to the Go API by `next.config.ts`.

## Auth Model

| Auth type | How it is used |
| --- | --- |
| Public | No session or API key required |
| Session auth | Login-created session cookie required |
| Role auth | Session plus one of the allowed roles |
| Partner API key | Partner key plus required scope |

Seeded roles are `reporter`, `district_manager`, `org_admin`, and `system_admin`.

## Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/healthz` | Public | Process health check |
| `GET` | `/readyz` | Public | Database-backed readiness check |

## Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/v1/auth/login` | Public | Creates a session from email and password |
| `POST` | `/v1/auth/logout` | Public | Revokes the current session when present |
| `GET` | `/v1/auth/me` | Session | Returns the current authenticated user and roles |
| `POST` | `/v1/auth/password` | Session | Changes the current user's password after verifying the current password |

## Public Clinic Data

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/v1/public/alternatives?clinicId={clinicId}&service={service}` | Public | Lists public alternative clinic recommendations for a clinic/service pair |
| `GET` | `/v1/public/clinics` | Public | Lists public clinic directory/status records |
| `GET` | `/v1/public/clinics/{clinicId}` | Public | Returns one public clinic record |

## Partner API

Partner routes require an API key and the listed scope.

| Method | Path | Scope | Purpose |
| --- | --- | --- | --- |
| `GET` | `/v1/partner/clinics` | `clinics:read` | Lists partner-visible clinics |
| `GET` | `/v1/partner/clinics/{clinicId}/status` | `status:read` | Returns partner-visible clinic status |
| `GET` | `/v1/partner/alternatives?clinicId={clinicId}&service={service}` | `alternatives:read` | Lists partner-visible alternatives for a clinic/service pair |
| `GET` | `/v1/partner/export/latest` | `exports:read` | Returns latest partner export payload |
| `GET` | `/v1/partner/integration-status` | `status:read` | Returns integration readiness/status checks |

## Admin Partner Readiness

Admin routes require a session with `org_admin` or `system_admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/admin/partner-readiness` | Returns partner readiness summary |
| `GET` | `/v1/admin/users` | Lists users, memberships, role scope, disabled state, and latest active session signal |
| `POST` | `/v1/admin/users` | Creates a pilot user, role membership, audit event, and one-time temporary password |
| `PATCH` | `/v1/admin/users/{userId}` | Updates managed user display name or disabled state |
| `PUT` | `/v1/admin/users/{userId}/access` | Replaces managed user role, organisation, and optional district scope |
| `POST` | `/v1/admin/users/{userId}/sessions/revoke` | Revokes active sessions for a managed user |
| `GET` | `/v1/admin/audit-events` | Lists recent admin-visible audit events |
| `GET` | `/v1/admin/ingestion/runs` | Lists pilot ingestion runs with source, status, record counts, and validation error counts |
| `POST` | `/v1/admin/api-keys` | Creates a partner API key and returns the one-time secret |
| `GET` | `/v1/admin/api-keys` | Lists partner API keys |
| `POST` | `/v1/admin/api-keys/{keyId}/revoke` | Revokes a partner API key |
| `GET` | `/v1/admin/webhooks` | Lists partner webhook subscriptions |
| `POST` | `/v1/admin/webhooks` | Creates a partner webhook subscription |
| `POST` | `/v1/admin/webhooks/{subscriptionId}/test` | Creates webhook test evidence; when delivery is disabled it records a preview, and when delivery is enabled but unavailable it records failed evidence before returning `501` |
| `POST` | `/v1/admin/exports` | Creates a partner export run |
| `GET` | `/v1/admin/exports/{exportId}` | Returns one partner export run |

## Operational Clinic Data

Operational routes require a session with `district_manager`, `org_admin`, or `system_admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/alternatives?clinicId={clinicId}&service={service}` | Lists operational alternatives for a clinic/service pair |
| `GET` | `/v1/clinics` | Lists operational clinic rows |
| `GET` | `/v1/clinics/{clinicId}` | Returns one operational clinic profile |
| `GET` | `/v1/clinics/{clinicId}/status` | Returns current clinic status |
| `GET` | `/v1/clinics/{clinicId}/reports` | Lists reports for a clinic |
| `GET` | `/v1/clinics/{clinicId}/audit-events` | Lists audit events for a clinic |
| `GET` | `/v1/reports/pending` | Lists reports waiting for review |
| `POST` | `/v1/status/reconcile-staleness` | Idempotently reconciles stale status and records audit evidence for state transitions |
| `POST` | `/v1/reports/{reportId}/review` | Accepts or rejects a report |
| `GET` | `/v1/sync/summary` | Returns sync health, duplicate/conflict/validation failure counts, stale clinic counts, and latest sync evidence |

## Reporter Routes

Reporter routes require a session with `reporter`, `district_manager`, `org_admin`, or `system_admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/v1/reports` | Creates a field report |
| `POST` | `/v1/reports/offline-sync` | Syncs queued offline reports |

## Response And Error Shape

Handlers use the shared response helpers in `services/api/internal/http/respond.go`. Validation and auth failures return JSON error responses with appropriate HTTP status codes. Route-specific response models live in `services/api/internal/store/models.go`, service files under `services/api/internal/service`, and frontend API types under `lib/demo/api-types.ts`.

Common security responses:

| Status | Code | Meaning |
| --- | --- | --- |
| `401` | `unauthorized` | Authentication failed, the session is invalid, the user is disabled, or login throttling blocked the attempt. Login and password failures intentionally use generic responses. |
| `403` | `csrf_rejected` | A cookie-authenticated unsafe request included an untrusted `Origin` or `Referer`. |
| `403` | `forbidden` | The authenticated principal is not allowed to manage the requested user, scope, or admin action. |
| `429` | `rate_limited` | The per-IP/path unsafe mutation limiter rejected the request. Login throttling returns the generic unauthorized response instead. |

Unsafe cookie-authenticated methods are `POST`, `PUT`, `PATCH`, and `DELETE`. Trusted browser origins are configured with `CLINICPULSE_TRUSTED_ORIGINS`; partner API-key routes use their own authentication path and are not part of the browser CSRF flow.

## Future OpenAPI Path

This document is a human-readable route reference. A later release can add an OpenAPI document if ClinicPulse needs generated clients, schema validation, or public partner onboarding artifacts.
