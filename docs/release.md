# Release Checklist

Target tag: `v0.1.0-alpha`

Release tag status: Pending final verification and user approval.

## Pre-Release Checklist

- README includes live demo status, demo credentials, local run path, docs index, and validation commands.
- Architecture, API, database schema, engineering decisions, screenshots, demo video, and portfolio case study docs are present.
- External assets that are not ready are clearly marked pending.
- `npm run lint` passes.
- `make verify` passes.
- `make test-e2e` passes before public demo handoff.
- `git status --short` shows only intentional release changes.

## Verification Commands

```bash
npm run lint
make verify
make test-e2e
```

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
- Local demo credentials and a repeatable Makefile setup path.
- Documentation for architecture, API, schema, screenshots, demo video, portfolio case study, engineering decisions, and release readiness.

Known pending external assets:

- Deployed live demo URL.
- Publicly hosted MP4 demo video URL, if needed outside GitHub.
- Published portfolio case study URL.
