# ClinicPulse

ClinicPulse is a full-stack demo product for district clinic operations. The app combines a Next.js frontend with a Go API and Postgres backend for clinic status, public finder data, field reports, offline sync, audit events, auth, partner readiness, API keys, webhooks, and export previews.

## Current State

The repository is past the default scaffold stage:

- Next.js app routes cover the landing page, booking flow, demo district console, clinic detail, public finder, field reporting, admin, login, and registration.
- The Go API exposes public clinic endpoints, authenticated operational endpoints, role-protected admin endpoints, partner API-key endpoints, webhook previews, exports, and readiness checks.
- Seeded demo data lives in SQL migrations. Local auth users live in a separate seed file so privileged demo accounts are not part of normal migrations.
- Frontend and backend tests are both active.

## Requirements

- Node.js compatible with Next.js 16
- npm
- Go 1.25 or newer
- Docker with Compose
- PostgreSQL client tools, especially `psql`

## Environment

Start from the tracked example:

```bash
cp .env.example .env.local
```

Default local values:

```bash
DATABASE_URL=postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse?sslmode=disable
CLINICPULSE_POSTGRES_PORT=5432
CLINICPULSE_API_ADDR=:8080
CLINICPULSE_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_CLINICPULSE_API_BASE_URL=/api/clinicpulse
CLINICPULSE_API_KEY_PEPPER=local-development-pepper
CLINICPULSE_WEBHOOK_DELIVERY_ENABLED=false
CLINICPULSE_ALLOW_DEMO_FALLBACK=false
```

`CLINICPULSE_ALLOW_DEMO_FALLBACK` should stay `false` in staging or production unless you intentionally want API failures to fall back to seeded demo state.

## Local Full-Stack Setup

Install dependencies:

```bash
npm install
```

Start Postgres:

```bash
make db-up
```

Apply SQL migrations and seed local auth users:

```bash
make db-bootstrap
```

The migration command is intended for a fresh local database. The auth seed is safe to rerun, but the migrations do not currently use a migration ledger.

Start the Go API in one terminal:

```bash
make dev-api
```

Start the Next.js app in another terminal:

```bash
make dev-web
```

Open `http://localhost:3000`.

## Local Demo Accounts

The local seed creates these users:

- `system-admin@clinicpulse.local`
- `org-admin@clinicpulse.local`
- `district-manager@clinicpulse.local`
- `reporter@clinicpulse.local`

Local demo password:

```text
ClinicPulseDemo123!
```

Role access:

- Reporter: `/field`
- District manager: `/field`, `/demo`
- Organisation admin and system admin: `/field`, `/demo`, `/admin`

## Demo Walkthrough

The current phase-one route checklist is encoded in `lib/demo/demo-runbook.ts`.

Review these routes on desktop and mobile:

- `/` - landing page and entry into booking or demo workspace
- `/book-demo` - booking flow and local lead capture
- `/book-demo/thanks` - confirmation and navigation into demo/admin/finder
- `/demo` - district console with clinic status, incidents, rerouting, and scenario controls
- `/demo/clinics/clinic-mamelodi-east` - clinic evidence and escalation context
- `/finder` - public clinic availability search
- `/field` - offline-friendly report flow and sync
- `/admin` - lead pipeline, export preview, API preview, roadmap, partner readiness, and pilot readiness

## Useful Commands

```bash
make db-up          # start local Postgres
make db-bootstrap   # apply migrations and local auth seed to a fresh DB
make db-seed-auth   # rerun only local auth seed
make dev-api        # run Go API on :8080
make dev-web        # run Next.js on :3000
make test-web       # run Vitest
make test-api       # run Go tests
make test-e2e       # reset isolated e2e DB and run Playwright smoke tests
make lint           # run ESLint
make build          # run Next production build
make verify         # run web tests, lint, API tests, and production build
```

Direct equivalents:

```bash
npm test
npm run test:e2e
npm run lint
npm run build
cd services/api && go test ./...
```

## Backend Notes

API defaults are defined in `services/api/internal/config/config.go`.

- `DATABASE_URL` defaults to the local compose database.
- `CLINICPULSE_API_ADDR` defaults to `:8080`.
- `CLINICPULSE_API_KEY_PEPPER` is used when hashing partner API keys.
- `CLINICPULSE_WEBHOOK_DELIVERY_ENABLED=true` enables actual webhook delivery behavior. Keep it disabled for normal local demos.

Migrations live in `services/api/migrations`. The local auth seed lives in `services/api/seeds/local_phase3_auth_users.sql`.

## Frontend Notes

Server-side frontend calls use `CLINICPULSE_API_BASE_URL` to call the Go API directly. Browser-side frontend calls use `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL`, which should normally stay on the same-origin proxy path `/api/clinicpulse`.

The proxy is configured in `next.config.ts` and forwards `/api/clinicpulse/*` to `CLINICPULSE_API_BASE_URL`. This keeps client-side demo requests from depending on cross-origin browser access to the Go API.

Server hydration can fall back to seeded demo state when allowed by `CLINICPULSE_ALLOW_DEMO_FALLBACK` or in non-production environments. Treat that as a demo resilience feature, not production error handling.

## Validation Baseline

Before handing off a branch, run:

```bash
make verify
```

For browser smoke coverage, run:

```bash
make test-e2e
```

This target uses the isolated `clinicpulse_e2e` database and resets that database before running Playwright.
It starts the compose Postgres service on host port `55432` by default, so it can run even when another local Postgres already occupies `5432`.

At minimum, the branch should pass:

- Vitest frontend tests
- ESLint
- Go API tests
- Next.js production build
- Playwright smoke tests before demo handoff or route-level UI changes

## Next Product Work

The highest-leverage next work after this runbook is:

1. Add Playwright smoke coverage for the phase-one route checklist.
2. Persist booking leads and founder pipeline updates through the backend rather than only local demo state.
3. Document and smoke-test the partner API, webhook, and export contracts already exposed by the Go router.
4. Make seeded fallback behavior explicit per environment so staging and production failures are visible.
