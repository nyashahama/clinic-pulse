# ClinicPulse

ClinicPulse is a full-stack clinic operations demo for district teams that need live facility status, offline field reporting, patient rerouting context, audit history, partner APIs, and export readiness.

## Live Demo

- Local demo URL: `http://localhost:3000` after running the local setup below
- Demo API URL: `http://localhost:8080` after running the Go API locally
- Local workflow screenshots: `public/showcase/screenshots/` after running `npm run capture:showcase`
- Local recorded walkthrough: `public/showcase/videos/clinicpulse-demo-walkthrough.webm` after running `npm run capture:showcase`

### Demo Credentials

The local seed creates these demo users:

| Role | Email | Password | Access |
| --- | --- | --- | --- |
| System admin | `system-admin@clinicpulse.local` | `ClinicPulseDemo123!` | `/field`, `/demo`, `/admin` |
| Organisation admin | `org-admin@clinicpulse.local` | `ClinicPulseDemo123!` | `/field`, `/demo`, `/admin` |
| District manager | `district-manager@clinicpulse.local` | `ClinicPulseDemo123!` | `/field`, `/demo` |
| Reporter | `reporter@clinicpulse.local` | `ClinicPulseDemo123!` | `/field` |

## Run Locally In 5 Minutes

Requirements:

- Node.js compatible with Next.js 16
- npm
- Go 1.25 or newer
- Docker with Compose
- PostgreSQL client tools, especially `psql`

Run:

```bash
npm install
cp .env.example .env.local
make db-up
make db-wait
make db-bootstrap
make dev-api
```

In a second terminal:

```bash
make dev-web
```

Open `http://localhost:3000`.

The migration command is intended for a fresh local database. The local auth seed is safe to rerun with `make db-seed-auth`.

For a full Phase 3 review with realistic ingestion, sync, report-review, webhook, and export evidence, use the isolated review database:

```bash
make db-up-e2e
make db-reset-review
make dev-api-review
```

In a second terminal:

```bash
make dev-web-review
```

Open `http://localhost:3000`. The review API runs on `http://localhost:18080` and the review database runs on `localhost:55432`.

## Core Workflows

| Workflow | Route | What it shows |
| --- | --- | --- |
| Landing and booking entry | `/` | Product positioning, operating gap, workflows, and booking entry |
| Booking flow | `/book-demo` and `/book-demo/thanks` | Lead capture flow and handoff into demo routes |
| District console | `/demo` | Clinic status map, incidents, rerouting context, offline sync, and scenario controls |
| Clinic evidence | `/demo/clinics/clinic-mamelodi-east` | Clinic-specific service, report, and audit context |
| Public finder | `/finder` | Public clinic availability search and alternatives |
| Field reporting | `/field` | Offline-friendly report submission and sync path |
| Admin workspace | `/admin` | Lead pipeline, export preview, API preview, partner readiness, and pilot readiness |

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database schema overview](docs/database-schema.md)
- [Engineering decisions](docs/engineering-decisions.md)
- [Screenshots and capture guide](docs/screenshots.md)
- [Demo video script and local capture guide](docs/demo-video.md)
- [Portfolio case study draft](docs/portfolio-case-study.md)
- [Release checklist](docs/release.md)

## Showcase Assets

Showcase screenshots and videos are generated local artifacts and are intentionally ignored by git.

- Workflow screenshots: `public/showcase/screenshots/`
- Short demo walkthrough: `public/showcase/videos/clinicpulse-demo-walkthrough.webm`
- Regenerate them with `npm run capture:showcase` after resetting the isolated e2e database.

## Architecture Snapshot

ClinicPulse combines a Next.js app, same-origin browser proxy, Go chi API, and Postgres database. The frontend can hydrate from backend data and falls back to seeded demo state in non-production/demo contexts when configured.

```mermaid
flowchart LR
  Browser["Browser"] --> Next["Next.js app"]
  Next --> Proxy["/api/clinicpulse proxy"]
  Proxy --> API["Go chi API"]
  API --> Postgres["Postgres"]
  Next --> DemoStore["Demo store and seeded fallback"]
  API --> Partner["Partner API keys, webhooks, exports"]
```

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

`CLINICPULSE_ALLOW_DEMO_FALLBACK` should stay `false` in staging or production unless API failures should intentionally fall back to seeded demo state.

## Useful Commands

```bash
make db-up          # start local Postgres
make db-bootstrap   # apply migrations and local auth seed to a fresh DB
make db-seed-auth   # rerun only local auth seed
make db-seed-review # seed local-only Phase 3 review evidence
make db-reset-review # reset the isolated review DB and seed review evidence
make dev-api        # run Go API on :8080
make dev-api-review # run Go API on :18080 against the isolated review DB
make dev-web        # run Next.js on :3000
make dev-web-review # run Next.js on :3000 against the review API
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

## Release Status

Current package target: `v0.1.0-alpha`

Release tag status: Pending final verification and user approval. See [release checklist](docs/release.md).

## Validation Baseline

Before handing off a branch, run:

```bash
make verify
```

Before tagging a release or recording a final demo, also run:

```bash
make test-e2e
```

GitHub Actions runs the frontend, backend, and browser smoke baselines through `.github/workflows/ci.yml`.
