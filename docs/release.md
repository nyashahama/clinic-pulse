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
- Local demo credentials and a repeatable Makefile setup path.
- Documentation for architecture, API, schema, screenshot capture, demo video, portfolio case study, engineering decisions, and release readiness.

Known pending external assets:

- Deployed live demo URL.
- Publicly hosted MP4 demo video URL, if needed outside GitHub.
- Published portfolio case study URL.
