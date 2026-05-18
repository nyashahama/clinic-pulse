# Phase 4 Observability And Operations Spec

Date: 2026-05-16
Status: Draft for implementation planning

## Goal

Phase 4 makes ClinicPulse operable by a real team.

An operator should be able to answer:

- Is the frontend, API, and database healthy right now?
- Which requests are failing, slow, rate-limited, or denied?
- Can a support engineer correlate a browser/API issue to backend logs?
- Which sensitive actions happened during an incident window?
- What should the on-call person do when health, latency, sync, auth, export, or webhook signals degrade?
- What smoke and load checks prove the core journeys still work before pilot handoff?

Phase 4 should turn the production-shaped alpha into an observable pilot service. It is not a vendor integration project or a full SRE platform.

## Product Decision

Phase 4 is **observability and operations**, not another product-surface phase.

The product already has hardened runtime controls, auth, admin governance, pilot data integrity, health/readiness endpoints, and release gates. The next risk is operational: an incident would still require reading source code, raw terminal output, or ad hoc reproduction to understand what happened.

The phase should therefore prioritize low-dependency observability primitives that work locally, in CI, and on a simple Docker/Vercel staging setup:

- structured logs,
- bounded request metrics,
- request correlation and trace context,
- sanitized error events,
- operational runbooks,
- alert definitions,
- smoke and load checks.

The first implementation should avoid heavyweight observability dependencies unless the current code cannot meet the phase goals without them.

## Current Foundation

Phase 4 starts from this foundation:

- `docs/production-readiness-execution-plan.md` marks Phase 4 as the current production-readiness phase.
- Phase 0, Phase 1, Phase 2, and Phase 3 production-readiness phases are complete.
- The Go API already exposes `/healthz` and `/readyz`.
- The Go API already has request ID generation/validation and a basic line-oriented `RequestLogger`.
- The API server already has production runtime timeouts and graceful shutdown.
- The frontend uses a Next.js rewrite from `/api/clinicpulse/*` to `CLINICPULSE_API_BASE_URL`; there is no dedicated App Router API proxy file.
- CI already runs frontend tests/lint/build, Go tests/vet/govulncheck, Playwright E2E, and API container smoke checks.
- Admin audit evidence, tenant health, data ingestion, security, partner readiness, and sync summary surfaces already exist.
- Deployment docs already describe Vercel, Docker API, managed Postgres, migrations, backup, restore, and rollback.

Existing foundations should be hardened rather than replaced.

## Scope

Phase 4 covers:

- Structured JSON logs for API startup, shutdown, request completion, and selected operational events.
- Request correlation through `X-Request-Id` and W3C `traceparent` propagation.
- Bounded API request metrics exposed in a Prometheus-compatible text endpoint.
- Service health metrics for API liveness, readiness/database availability, request status, latency buckets, rate-limit/CSRF denials, and selected domain operations.
- Sanitized error tracking through structured error logs and error counters.
- Frontend/API correlation for browser-to-API calls through Next middleware and shared API clients.
- Operational audit watch signals using existing audit events for sensitive actions.
- Uptime check definitions for frontend, API `/healthz`, API `/readyz`, and core public/authenticated journeys.
- Alert routing and incident response runbooks.
- SLOs for pilot-stage availability, latency, error budget, and data freshness.
- Smoke and load checks for core journeys.
- Documentation updates for deployment, release gates, and production-readiness status.
- Unit, Go, script, and E2E/smoke tests proving the observability contracts.

Phase 4 does not cover:

- A mandatory external observability vendor.
- A distributed tracing backend.
- A persistent job scheduler or queue system.
- PagerDuty/Opsgenie account setup.
- Full compliance monitoring or SIEM integration.
- New authenticated product roles.
- New partner portal work.
- A release-candidate freeze or stakeholder launch signoff. Those belong to Phase 5.

## Observability Architecture

### Logs

API logs should be newline-delimited JSON.

Required API log fields:

- `timestamp`
- `level`
- `event`
- `service`
- `deploy_env`
- `request_id` when request-scoped
- `trace_id` and `span_id` when available
- `method`
- `route`
- `status`
- `status_class`
- `duration_ms`
- `principal_type`
- `remote_addr_hash` or no remote address; do not log raw IP by default
- `error_kind` and `error_code` for failures

Logs must avoid raw session tokens, API keys, webhook secrets, passwords, request bodies, and partner export payloads.

### Request correlation and tracing

The system should use `X-Request-Id` as the human support correlation key and `traceparent` as the machine-readable trace context.

Required behavior:

- Preserve safe inbound `X-Request-Id`; generate a safe ID when missing or invalid.
- Preserve valid inbound `traceparent`; generate one when missing or invalid.
- Return `X-Request-Id` and `traceparent` in API responses.
- Include both values in structured request logs.
- Frontend server/API clients should forward the values when available.
- Browser calls through `/api/clinicpulse/*` should receive a request ID response header.

This phase can implement trace propagation without exporting spans to an external tracing backend.

### Metrics

The API should expose bounded, Prometheus-compatible text metrics.

Required metric families:

- `clinicpulse_http_requests_total`
- `clinicpulse_http_request_duration_seconds_bucket`
- `clinicpulse_http_request_duration_seconds_count`
- `clinicpulse_http_request_duration_seconds_sum`
- `clinicpulse_http_errors_total`
- `clinicpulse_rate_limit_denials_total`
- `clinicpulse_csrf_denials_total`
- `clinicpulse_readiness_checks_total`
- `clinicpulse_readiness_check_duration_seconds`
- `clinicpulse_domain_operations_total`

Labels must remain bounded:

- `method`
- `route`
- `status_class`
- `principal_type`
- `operation`
- `result`

Do not label by raw clinic ID, user ID, email, token, API key, request ID, or arbitrary URL.

### Metrics endpoint protection

`/metrics` should be safe for local development and staging.

Required behavior:

- Local deploys may expose `/metrics` without a token.
- Staging/production must require `CLINICPULSE_METRICS_TOKEN` when metrics are enabled.
- Missing or invalid metrics token outside local should return `401` without leaking the expected token.
- `CLINICPULSE_METRICS_ENABLED=false` should disable `/metrics` with `404`.

### Error tracking

Phase 4 should create vendor-neutral error tracking through structured logs and counters.

Required behavior:

- Store/backend failures should emit sanitized error events.
- HTTP error responses should include or correlate to `X-Request-Id`.
- Error counters should distinguish `store`, `auth`, `validation`, `rate_limit`, `csrf`, `partner`, `sync`, and `unknown` categories where practical.
- The deployment docs should explain how to forward JSON logs/metrics to a hosted provider later.

### Operational audit watch

Existing audit events should remain the source for sensitive action evidence.

Phase 4 should define watch queries/signals for:

- auth login success/failure patterns,
- password changes,
- user creation/disable/access changes,
- session revocation,
- API key creation/revocation,
- webhook tests/failures,
- export generation,
- report submission/review,
- stale reconciliation,
- sync validation/conflict failures.

This can be documented and surfaced through existing admin audit/security views before adding a new dashboard.

### Uptime checks, alerts, and SLOs

Phase 4 should define pilot-stage operations policy.

Required outputs:

- uptime check matrix,
- alert routing matrix,
- incident response runbook,
- SLO/error-budget document,
- smoke test commands,
- load smoke test command.

Initial pilot SLOs should be conservative and measurable from this repo's signals, not aspirational enterprise targets.

## Target Operational Signals

The first implementation should instrument these paths:

- `/healthz`
- `/readyz`
- `/v1/auth/login`
- `/v1/auth/logout`
- `/v1/auth/me`
- `/v1/reports`
- `/v1/reports/offline-sync`
- `/v1/reports/{reportId}/review`
- `/v1/sync/summary`
- `/v1/admin/audit-events`
- `/v1/admin/partner-readiness`
- `/v1/admin/exports`
- `/v1/admin/webhooks/{subscriptionId}/test`
- `/v1/partner/*`

The implementation may record all routes through middleware, but runbooks and smoke checks should prioritize the paths above.

## Testing And Acceptance

Phase 4 is complete when:

- API request logs are JSON, sanitized, and include request/trace correlation.
- `/metrics` exposes bounded request, latency, error, readiness, and domain operation metrics.
- Metrics protection behaves correctly for local and non-local deploy environments.
- Frontend/API requests propagate or return request IDs.
- Health/readiness checks are documented and smoke-tested.
- Alert, incident, and SLO runbooks exist and are linked from deployment/release docs.
- Load smoke checks exercise health, public clinic read, auth, pending reports, and partner readiness paths without requiring production secrets.
- CI or documented release gates include the new smoke/load checks.
- The production-readiness execution plan points to the Phase 4 spec, plan, and eventual closeout.

## References

- `docs/production-readiness-execution-plan.md`
- `docs/phase-3-pilot-data-product-integrity-closeout.md`
- `docs/deployment.md`
- `docs/release.md`
- `services/api/internal/http/logging_middleware.go`
- `services/api/internal/http/router.go`
- `services/api/internal/http/handlers.go`
- `services/api/internal/config/config.go`
- `next.config.ts`
- `.github/workflows/ci.yml`
