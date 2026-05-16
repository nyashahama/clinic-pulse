# Release Checklist

Target tag: `v0.1.0-alpha`

Release tag status: Pending final verification and user approval.

## Pre-Release Checklist

- README includes live demo status, demo credentials, local run path, docs index, and validation commands.
- Architecture, API, database schema, deployment, engineering decisions, screenshot capture, demo video, and portfolio case study docs are present, including docs/deployment.md.
- External assets that are not ready are clearly marked pending.
- `npm run lint` passes.
- `make verify` passes.
- `make test-e2e` passes before public demo handoff.
- `make verify-security` passes before any staging or pilot handoff.
- `make test-api-container` passes before promoting the Docker API image.
- Phase 4 observability runbooks are present: `docs/operations/observability.md`, `docs/operations/incident-response.md`, `docs/operations/alert-routing.md`, and `docs/operations/slo.md`.
- Pilot observability env vars are documented and set when monitoring is enabled: `CLINICPULSE_METRICS_ENABLED`, `CLINICPULSE_METRICS_TOKEN`, and `CLINICPULSE_OBSERVABILITY_SERVICE_NAME`.
- Uptime checks exist for frontend availability, API health, and readiness/database availability before pilot handoff.
- Alert routes are configured for API health, readiness/database, 5xx rate, p95 latency, HTTP categorized errors, login failures/throttling, CSRF denials, report create/review errors, offline sync failures, webhook failures, export failures, and stale clinic operational checks.
- Logs are forwarded only through a privacy-safe path that redacts secrets, tokens, patient identifiers, request bodies, and free-text clinical notes.
- Pilot SLOs are documented as internal alpha objectives and are not presented as contractual SLAs.
- `git status --short` shows only intentional release changes.

## Verification Commands

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

For Phase 1 staging handoff, also confirm the Vercel frontend variables and Docker API variables in docs/deployment.md.
For Phase 2 staging or pilot handoff, also confirm `CLINICPULSE_TRUSTED_ORIGINS`, rate-limit values, disabled public registration, and disabled demo fallback.
For Phase 3 pilot data handoff, also confirm pilot-critical routes have no implementation-placeholder copy, operational data exposes source/freshness/review state, and safety/privacy/terms links are reachable.
For Phase 4 observability handoff, also confirm metrics access is token-protected, log forwarding follows the privacy rules, dashboards cover the required operational signals, alert routes have named owners, and stakeholder/post-incident templates are ready for pilot use.

## Tag Commands

Run these only after the checklist passes and the user confirms release readiness:

```bash
git tag -a v0.1.0-alpha -m "ClinicPulse v0.1.0-alpha"
git push origin v0.1.0-alpha
```

## Release Notes Draft

### ClinicPulse v0.1.0-alpha

This alpha packages ClinicPulse as a full-stack clinic operations demo with:

- Next.js frontend routes for landing, booking, district console, clinic detail, public finder, field reporting, admin, login, and registration.
- Go API routes for public clinic data, authenticated operations, report review, offline sync, admin partner readiness, partner API keys, webhooks, exports, and partner read access.
- Postgres schema for clinics, service availability, reports, current status, audit events, auth, sessions, sync attempts, partner keys, webhooks, exports, and integration checks.
- Auth hardening for hidden demo credentials outside local fallback mode, login throttling, CSRF/origin checks, mutation rate limiting, password changes, and admin account lifecycle management.
- Observability operations docs for metrics setup, safe log forwarding, alert routing, incident response, and internal pilot SLOs.
- Local demo credentials and a repeatable Makefile setup path.
- Documentation for architecture, API, schema, screenshot capture, demo video, portfolio case study, engineering decisions, deployment, operations, and release readiness.

Known pending external assets:

- Deployed live demo URL.
- Publicly hosted MP4 demo video URL, if needed outside GitHub.
- Published portfolio case study URL.
