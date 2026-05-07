# ClinicPulse Showcase Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a portfolio-ready repo showcase package with live-demo guidance, demo credentials, architecture/API/schema docs, screenshot/video/case-study paths, release guidance, and engineering decisions.

**Architecture:** Keep the application behavior unchanged and make `README.md` the public front door. Add focused tracked files under `docs/` for deeper reference material, using explicit pending labels for external assets that still need deployment, capture, publication, or release confirmation.

**Tech Stack:** Markdown, Mermaid diagrams, Next.js 16 app routes, Go chi API route inventory, PostgreSQL migration inventory, existing Makefile verification commands.

---

## File Structure

- Modify `README.md`: concise showcase front door, demo credentials, local run path, route walkthrough, docs index, verification, and release status.
- Create `docs/architecture.md`: Mermaid architecture diagram and system/data-flow explanation.
- Create `docs/api.md`: route reference matching `services/api/internal/http/router.go`.
- Create `docs/database-schema.md`: schema overview matching `services/api/migrations/*.sql`.
- Create `docs/screenshots.md`: screenshot capture checklist for core workflows.
- Create `docs/demo-video.md`: short demo video script and capture checklist.
- Create `docs/portfolio-case-study.md`: portfolio case-study draft.
- Create `docs/engineering-decisions.md`: engineering decision log.
- Create `docs/release.md`: `v0.1.0-alpha` release checklist and release notes draft.

Repository note: `.gitignore` ignores `docs/` to protect local-only material. Add only the new showcase docs with `git add -f docs/architecture.md docs/api.md docs/database-schema.md docs/screenshots.md docs/demo-video.md docs/portfolio-case-study.md docs/engineering-decisions.md docs/release.md`.

---

### Task 1: README And Architecture Front Door

**Files:**
- Modify: `README.md`
- Create: `docs/architecture.md`

- [ ] **Step 1: Run a documentation coverage check to verify the current gap**

Run:

```bash
test -f docs/architecture.md
```

Expected: FAIL with a non-zero exit code because the architecture doc has not been created.

- [ ] **Step 2: Replace `README.md` with the showcase front door**

Use this structure and content. Preserve the existing accurate local setup values and demo accounts.

````markdown
# ClinicPulse

ClinicPulse is a full-stack clinic operations demo for district teams that need live facility status, offline field reporting, patient rerouting context, audit history, partner APIs, and export readiness.

## Live Demo

- Public demo URL: Pending deployment
- Local demo URL: `http://localhost:3000` after running the local setup below
- Demo API URL: `http://localhost:8080` after running the Go API locally

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
make db-bootstrap
make dev-api
```

In a second terminal:

```bash
make dev-web
```

Open `http://localhost:3000`.

The migration command is intended for a fresh local database. The local auth seed is safe to rerun with `make db-seed-auth`.

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
- [Screenshots checklist](docs/screenshots.md)
- [Demo video script](docs/demo-video.md)
- [Portfolio case study draft](docs/portfolio-case-study.md)
- [Release checklist](docs/release.md)

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
````

- [ ] **Step 3: Create `docs/architecture.md`**

Create `docs/architecture.md` with this content:

````markdown
# Architecture

ClinicPulse is a full-stack demo product with a Next.js frontend, Go chi API, and Postgres database. The application is designed to show district clinic operations end to end: public discovery, authenticated district operations, field reporting, admin readiness, partner APIs, webhooks, exports, and audit history.

## System Diagram

```mermaid
flowchart LR
  Browser["Browser / evaluator"] --> Next["Next.js app routes"]
  Next --> ServerActions["Server actions and server components"]
  Next --> Proxy["Same-origin /api/clinicpulse proxy"]
  Proxy --> API["Go chi API"]
  ServerActions --> API
  API --> Postgres["Postgres"]
  Next --> DemoStore["Browser demo store"]
  DemoStore --> LocalStorage["Local storage"]
  API --> Auth["Sessions and roles"]
  API --> Partner["Partner API keys"]
  API --> Webhooks["Webhook previews"]
  API --> Exports["Export runs"]
```

## Runtime Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Next.js app | `app/`, `components/`, `lib/` | Landing, booking, public finder, district demo, field report, admin, auth UI, browser demo state |
| Browser API proxy | `next.config.ts` | Rewrites `/api/clinicpulse/*` to the Go API base URL for same-origin browser calls |
| Go API | `services/api` | Health, public clinic data, auth, role-protected operations, reports, sync, admin readiness, partner APIs |
| Postgres | Docker Compose and `services/api/migrations` | Clinic directory, service availability, reports, status, audit history, auth, partner readiness, sync metadata |
| Demo seed and fallback | `lib/demo`, migrations, local auth seed | Keeps the demo usable locally and in non-production fallback contexts |

## Request Flow

1. Browser routes load through the Next.js app.
2. Server components and server actions call the Go API with `CLINICPULSE_API_BASE_URL`.
3. Browser-side calls use `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL`, normally `/api/clinicpulse`.
4. Next.js rewrites `/api/clinicpulse/*` to the Go API.
5. The Go API reads and writes Postgres.
6. The frontend demo store keeps local interaction state and can fall back to seeded data when configured.

## Authentication And Authorization

Local demo users are seeded from `services/api/seeds/local_phase3_auth_users.sql`.

Roles:

- `reporter`: field reporting.
- `district_manager`: field reporting and district console.
- `org_admin`: district console and admin readiness.
- `system_admin`: all seeded admin flows.

The Go router enforces auth and role boundaries through middleware in `services/api/internal/http`.

## Data Flow By Workflow

| Workflow | Frontend route | Backend route group | Stored data |
| --- | --- | --- | --- |
| Public clinic finder | `/finder` | `/v1/public/*` | `clinics`, `clinic_services`, `current_status` |
| District console | `/demo` | `/v1/clinics`, `/v1/reports`, `/v1/sync` | reports, current status, audit events, sync attempts |
| Clinic detail | `/demo/clinics/[clinicId]` | `/v1/clinics/{clinicId}` and child routes | clinic profile, reports, audit events |
| Field reporting | `/field` | `/v1/reports`, `/v1/reports/offline-sync` | reports, sync attempts, audit events |
| Admin readiness | `/admin` | `/v1/admin/*` | partner keys, webhooks, exports, integration checks |
| Partner integration | external partner client | `/v1/partner/*` | partner API keys, export runs, status data |

## Demo Fallback

`CLINICPULSE_ALLOW_DEMO_FALLBACK` controls whether API failures may fall back to seeded frontend demo state. This is useful for local demos and non-production resilience. Production and staging should keep it disabled unless fallback is intentional, because operational failures should be visible.

## Testing Boundaries

- Vitest covers frontend demo state, selectors, API clients, and UI helpers.
- Go tests cover store, service, auth, and HTTP behavior.
- ESLint covers Next.js and TypeScript quality.
- Next build verifies the production app compiles.
- Playwright smoke tests exercise route-level browser workflows against an isolated e2e database.
````

- [ ] **Step 4: Verify README and architecture links**

Run:

```bash
rg -n "Run Locally In 5 Minutes|Demo Credentials|Architecture|Release Status" README.md
rg -n "flowchart LR|Demo Fallback|Testing Boundaries" docs/architecture.md
```

Expected: both commands print matching lines.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add README.md
git add -f docs/architecture.md
git commit -m "docs: add showcase readme and architecture"
```

Expected: commit succeeds with `README.md` and `docs/architecture.md`.

---

### Task 2: API And Database Reference Docs

**Files:**
- Create: `docs/api.md`
- Create: `docs/database-schema.md`

- [ ] **Step 1: Run source inventory checks**

Run:

```bash
rg -n "router\\." services/api/internal/http/router.go
rg -n "CREATE TABLE|ALTER TABLE" services/api/migrations
```

Expected: route inventory includes health, auth, public, partner, admin, operational, report, and sync routes. Migration inventory includes clinic, report, audit, auth, sync, and partner tables.

- [ ] **Step 2: Create `docs/api.md`**

Create `docs/api.md` with this content:

````markdown
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

## Public Clinic Data

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/v1/public/alternatives` | Public | Lists public alternative clinic recommendations |
| `GET` | `/v1/public/clinics` | Public | Lists public clinic directory/status records |
| `GET` | `/v1/public/clinics/{clinicId}` | Public | Returns one public clinic record |

## Partner API

Partner routes require an API key and the listed scope.

| Method | Path | Scope | Purpose |
| --- | --- | --- | --- |
| `GET` | `/v1/partner/clinics` | `clinics:read` | Lists partner-visible clinics |
| `GET` | `/v1/partner/clinics/{clinicId}/status` | `status:read` | Returns partner-visible clinic status |
| `GET` | `/v1/partner/alternatives` | `alternatives:read` | Lists partner-visible alternatives |
| `GET` | `/v1/partner/export/latest` | `exports:read` | Returns latest partner export payload |
| `GET` | `/v1/partner/integration-status` | `status:read` | Returns integration readiness/status checks |

## Admin Partner Readiness

Admin routes require a session with `org_admin` or `system_admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/admin/partner-readiness` | Returns partner readiness summary |
| `POST` | `/v1/admin/api-keys` | Creates a partner API key and returns the one-time secret |
| `GET` | `/v1/admin/api-keys` | Lists partner API keys |
| `POST` | `/v1/admin/api-keys/{keyId}/revoke` | Revokes a partner API key |
| `GET` | `/v1/admin/webhooks` | Lists partner webhook subscriptions |
| `POST` | `/v1/admin/webhooks` | Creates a partner webhook subscription |
| `POST` | `/v1/admin/webhooks/{subscriptionId}/test` | Creates a test webhook event or preview |
| `POST` | `/v1/admin/exports` | Creates a partner export run |
| `GET` | `/v1/admin/exports/{exportId}` | Returns one partner export run |

## Operational Clinic Data

Operational routes require a session with `district_manager`, `org_admin`, or `system_admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/v1/alternatives` | Lists operational alternatives |
| `GET` | `/v1/clinics` | Lists operational clinic rows |
| `GET` | `/v1/clinics/{clinicId}` | Returns one operational clinic profile |
| `GET` | `/v1/clinics/{clinicId}/status` | Returns current clinic status |
| `GET` | `/v1/clinics/{clinicId}/reports` | Lists reports for a clinic |
| `GET` | `/v1/clinics/{clinicId}/audit-events` | Lists audit events for a clinic |
| `GET` | `/v1/reports/pending` | Lists reports waiting for review |
| `POST` | `/v1/status/reconcile-staleness` | Reconciles stale clinic status |
| `POST` | `/v1/reports/{reportId}/review` | Accepts or rejects a report |
| `GET` | `/v1/sync/summary` | Returns offline sync and pilot readiness summary |

## Reporter Routes

Reporter routes require a session with `reporter`, `district_manager`, `org_admin`, or `system_admin`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/v1/reports` | Creates a field report |
| `POST` | `/v1/reports/offline-sync` | Syncs queued offline reports |

## Response And Error Shape

Handlers use the shared response helpers in `services/api/internal/http/respond.go`. Validation and auth failures return JSON error responses with appropriate HTTP status codes. Route-specific response models live in `services/api/internal/store/models.go`, service files under `services/api/internal/service`, and frontend API types under `lib/demo/api-types.ts`.

## Future OpenAPI Path

This document is a human-readable route reference. A later release can add an OpenAPI document if ClinicPulse needs generated clients, schema validation, or public partner onboarding artifacts.
````

- [ ] **Step 3: Create `docs/database-schema.md`**

Create `docs/database-schema.md` with this content:

````markdown
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
````

- [ ] **Step 4: Verify route and schema docs against source names**

Run:

```bash
rg -n "/v1/auth/login|/v1/admin/api-keys|/v1/reports/offline-sync|/v1/partner/export/latest" docs/api.md
rg -n "clinics|report_sync_attempts|partner_api_keys|integration_status_checks" docs/database-schema.md
```

Expected: both commands print matching lines for the named routes and tables.

- [ ] **Step 5: Commit Task 2**

Run:

```bash
git add -f docs/api.md docs/database-schema.md
git commit -m "docs: document api and database schema"
```

Expected: commit succeeds with `docs/api.md` and `docs/database-schema.md`.

---

### Task 3: Showcase Asset, Case Study, Decision, And Release Docs

**Files:**
- Create: `docs/screenshots.md`
- Create: `docs/demo-video.md`
- Create: `docs/portfolio-case-study.md`
- Create: `docs/engineering-decisions.md`
- Create: `docs/release.md`

- [ ] **Step 1: Run coverage checks for the remaining requested items**

Run:

```bash
test -f docs/screenshots.md
test -f docs/demo-video.md
test -f docs/portfolio-case-study.md
test -f docs/engineering-decisions.md
test -f docs/release.md
```

Expected: each command fails before the docs are created.

- [ ] **Step 2: Create `docs/screenshots.md`**

Create `docs/screenshots.md` with this content:

````markdown
# Screenshots Checklist

Final screenshot assets are pending capture. Use this checklist to capture consistent core workflow screenshots after the local or deployed demo is running.

## Capture Setup

- Desktop viewport: `1440x1100`
- Mobile viewport: `390x844`
- Browser: Chromium through Playwright or Chrome
- Demo state: fresh database with `make db-bootstrap`, then login as `org-admin@clinicpulse.local`
- Asset directory when ready: `public/showcase/screenshots/`

## Core Workflow Shots

| Filename | Route | Viewport | State setup | What it should prove |
| --- | --- | --- | --- | --- |
| `landing-desktop.png` | `/` | Desktop | Logged out | ClinicPulse positioning and booking entry are clear |
| `booking-flow-desktop.png` | `/book-demo` | Desktop | Logged out | Lead capture path is credible and focused |
| `booking-thanks-desktop.png` | `/book-demo/thanks` | Desktop | After booking flow | Handoff routes to demo/admin/finder are visible |
| `district-console-desktop.png` | `/demo` | Desktop | Logged in as org admin | Status summary, map, alerts, and scenario controls are visible |
| `clinic-evidence-desktop.png` | `/demo/clinics/clinic-mamelodi-east` | Desktop | Logged in as org admin | Clinic profile, service availability, reports, and audit context are visible |
| `finder-mobile.png` | `/finder` | Mobile | Logged out | Public availability search works on mobile |
| `field-report-mobile.png` | `/field` | Mobile | Logged in as reporter | Offline-friendly report flow is usable on mobile |
| `admin-readiness-desktop.png` | `/admin` | Desktop | Logged in as org admin | Lead pipeline, API preview, partner readiness, and pilot readiness are visible |

## Playwright Capture Path

After the app is running, add a temporary local capture script or use Playwright UI mode:

```bash
npm run test:e2e:ui
```

Before committing screenshots, confirm they show real ClinicPulse surfaces, avoid private local data, and match the routes above.
````

- [ ] **Step 3: Create `docs/demo-video.md`**

Create `docs/demo-video.md` with this content:

````markdown
# Demo Video Script

Final demo video URL: Pending recording

Target length: 60 to 90 seconds.

## Narrative Arc

1. District teams need reliable, current clinic availability before patients are sent across the network.
2. ClinicPulse gives them a district console, field reporting, public finder, partner API surface, audit history, and export readiness.
3. The demo shows how a service disruption becomes a visible operational decision instead of a stale spreadsheet entry.

## Shot List

| Time | Screen | Action | Narration |
| --- | --- | --- | --- |
| 0:00-0:08 | `/` | Show landing and product premise | "ClinicPulse is a clinic operations demo for district teams managing live facility availability." |
| 0:08-0:22 | `/demo` | Show status summary, map, and alerts | "The district console shows which clinics are operational, degraded, non-functional, or stale." |
| 0:22-0:35 | `/demo` | Trigger stockout or staffing scenario | "When conditions change, the operating picture updates immediately and flags where action is needed." |
| 0:35-0:48 | `/demo/clinics/clinic-mamelodi-east` | Open clinic evidence | "Each clinic keeps service availability, reports, and audit context in one place." |
| 0:48-1:00 | `/field` | Submit or sync a report | "Field teams can submit updates through an offline-friendly workflow and sync when connectivity returns." |
| 1:00-1:12 | `/finder` | Search public availability | "The public finder can direct patients toward available services." |
| 1:12-1:25 | `/admin` | Show API preview, export, partner readiness | "The admin view shows integration readiness, export previews, and partner API operations." |
| 1:25-1:30 | README or docs | Show architecture/docs briefly | "The repo includes the architecture, API, schema, local run path, and tests." |

## Capture Checklist

- Run a fresh local demo or use the deployed demo URL once available.
- Use seeded demo credentials from `README.md`.
- Keep browser zoom at 100%.
- Hide browser bookmarks and unrelated local windows.
- Record at 1080p or higher.
- Keep narration factual and implementation-specific.
- Export as MP4 and publish the final link in `README.md` after review.
````

- [ ] **Step 4: Create `docs/portfolio-case-study.md`**

Create `docs/portfolio-case-study.md` with this content:

````markdown
# Portfolio Case Study Draft

Published portfolio URL: Pending publication

## Summary

ClinicPulse is a full-stack clinic operations demo built to show how district teams can maintain live facility status, route patients around disruptions, collect field reports offline, and expose operational data through partner-ready APIs.

## Problem

Clinic availability often changes faster than public directories and district spreadsheets. When staffing, stock, power, or queue pressure changes, patients and coordinators need a reliable way to understand what is open, what is degraded, and where alternatives exist.

## Target Users

- District operations managers tracking clinic readiness.
- Field reporters and clinic coordinators submitting status updates.
- Public users searching for available clinic services.
- Organisation admins preparing partner integrations and exports.
- Technical evaluators reviewing implementation quality.

## Product Scope

ClinicPulse covers:

- Public landing and booking flow.
- Authenticated district console.
- Clinic detail and audit context.
- Public clinic finder.
- Offline-friendly field reporting.
- Admin lead pipeline and partner readiness.
- Go API, Postgres schema, local seed data, and automated tests.

## Core Workflows

1. A district manager logs in and opens `/demo`.
2. The console shows status counts, alerts, clinic map, and recent reports.
3. A disruption scenario changes operational status and highlights routing decisions.
4. Clinic detail pages expose service, report, and audit evidence.
5. A reporter submits or syncs an offline field report.
6. A public user searches `/finder` for available services.
7. An admin checks API preview, exports, webhooks, and partner readiness in `/admin`.

## Architecture

ClinicPulse uses:

- Next.js app router for the frontend and server actions.
- Go chi for API routing and middleware.
- Postgres for operational data, auth, audit events, sync metadata, partner keys, webhooks, exports, and integration checks.
- Same-origin API proxying to keep browser calls simple in local demos.
- Seeded local auth users and demo data for repeatable walkthroughs.

## Engineering Decisions

The implementation favors:

- A real backend instead of static-only demo data.
- Explicit role boundaries for reporter, district manager, org admin, and system admin.
- Immutable audit/review records for operational credibility.
- Offline sync attempt tracking instead of silent retry behavior.
- Human-readable docs before generated API tooling.
- Verification through frontend tests, backend tests, lint, build, and Playwright smoke coverage.

## Evidence

Repository evidence:

- `README.md` for local run and demo credentials.
- `docs/architecture.md` for system design.
- `docs/api.md` for API routes.
- `docs/database-schema.md` for persistence model.
- `docs/engineering-decisions.md` for tradeoffs.
- `.github/workflows/ci.yml` for CI baseline.

Media evidence pending:

- Live demo URL.
- Workflow screenshots.
- Short demo video.
- Published portfolio URL.

## What Would Ship Next

- Deploy a clean live demo with seeded demo credentials.
- Capture final workflow screenshots.
- Record the short demo video.
- Publish this case study on the portfolio site.
- Create `v0.1.0-alpha` after final verification.
````

- [ ] **Step 5: Create `docs/engineering-decisions.md`**

Create `docs/engineering-decisions.md` with this content:

````markdown
# Engineering Decisions

## 1. Build A Real Full-Stack Demo

Decision: use a Next.js frontend, Go API, and Postgres database instead of a static prototype.

Reasoning: ClinicPulse is meant to demonstrate operational credibility. A real API, schema, auth layer, migrations, and tests make the demo inspectable by technical evaluators.

Tradeoff: the local setup is heavier than a static demo, but the Makefile keeps the path repeatable.

## 2. Use Same-Origin Browser API Proxying

Decision: browser calls use `/api/clinicpulse/*`, rewritten by Next.js to the Go API.

Reasoning: the frontend avoids cross-origin browser configuration during local demos while server-side calls can still target `CLINICPULSE_API_BASE_URL` directly.

Tradeoff: deployment needs the proxy base URL configured correctly.

## 3. Keep Demo Fallback Explicit

Decision: allow seeded frontend fallback only when configured or in non-production demo contexts.

Reasoning: demos should stay usable if a backend call fails locally, but staging and production should expose API failures.

Tradeoff: fallback logic must be treated as demo resilience, not production correctness.

## 4. Model Roles In The Backend

Decision: use session auth and role middleware for reporter, district manager, org admin, and system admin access.

Reasoning: the demo needs to show different operational surfaces without relying only on frontend hiding.

Tradeoff: local setup needs seeded users and a login flow.

## 5. Store Audit And Review History Append-Only

Decision: audit events and report reviews are immutable after insertion.

Reasoning: operational systems need credible history for changes, escalations, and decisions.

Tradeoff: corrections must be represented as new events instead of edits.

## 6. Track Offline Sync Attempts

Decision: persist sync attempt outcomes, including duplicate, conflict, validation, forbidden, and server error results.

Reasoning: field reporting in low-connectivity settings needs observable sync behavior.

Tradeoff: sync creates extra metadata, but that metadata makes support and audit workflows clearer.

## 7. Document Human-Readable API First

Decision: add a route reference before introducing generated OpenAPI.

Reasoning: the immediate need is portfolio and evaluator clarity. The router is still compact enough for a curated reference.

Tradeoff: generated clients and schema validation remain future work.

## 8. Gate Release Tagging On Verification

Decision: document `v0.1.0-alpha` now, but create the tag only after verification and user approval.

Reasoning: a release tag should mean the repo is ready to hand to reviewers.

Tradeoff: the visible release marker waits until screenshots, demo/video decisions, and tests are in acceptable shape.
````

- [ ] **Step 6: Create `docs/release.md`**

Create `docs/release.md` with this content:

````markdown
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
- Captured workflow screenshots.
- Recorded demo video.
- Published portfolio case study URL.
````

- [ ] **Step 7: Verify and commit Task 3**

Run:

```bash
rg -n "Published portfolio URL|Final demo video URL|Target tag|Engineering Decisions|Screenshots Checklist" docs
git add -f docs/screenshots.md docs/demo-video.md docs/portfolio-case-study.md docs/engineering-decisions.md docs/release.md
git commit -m "docs: add showcase asset and release guides"
```

Expected: the search prints matching lines and the commit succeeds with five docs files.

---

### Task 4: Final Documentation Verification

**Files:**
- Modify: only files that need correction after verification.

- [ ] **Step 1: Check requested item coverage**

Run:

```bash
rg -n "Live Demo|Demo Credentials|Architecture|API Reference|Database Schema|Run Locally In 5 Minutes|v0.1.0-alpha|Portfolio Case Study|Demo Video|Engineering Decisions|Screenshots Checklist" README.md docs
```

Expected: each requested showcase item appears in `README.md` or a linked doc.

- [ ] **Step 2: Check API docs against router names**

Run:

```bash
rg -o '"/[^"]+"' services/api/internal/http/router.go
rg -n "/healthz|/readyz|/v1/auth/login|/v1/public/clinics|/v1/partner/clinics|/v1/admin/partner-readiness|/v1/reports/offline-sync|/v1/sync/summary" docs/api.md
```

Expected: route names from the router are represented in `docs/api.md`.

- [ ] **Step 3: Check schema docs against migration table names**

Run:

```bash
rg -n "CREATE TABLE" services/api/migrations
rg -n "clinics|clinic_services|reports|current_status|audit_events|organisations|users|organisation_memberships|sessions|report_reviews|report_sync_attempts|partner_api_keys|partner_webhook_subscriptions|partner_webhook_events|partner_export_runs|integration_status_checks" docs/database-schema.md
```

Expected: table names from migrations are represented in `docs/database-schema.md`.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Inspect the working tree**

Run:

```bash
git status --short
```

Expected: no uncommitted README/docs changes after Task 1-3 commits. If verification required edits, commit them with:

```bash
git add README.md
git add -f docs/architecture.md docs/api.md docs/database-schema.md docs/screenshots.md docs/demo-video.md docs/portfolio-case-study.md docs/engineering-decisions.md docs/release.md
git commit -m "docs: finalize showcase package"
```

- [ ] **Step 6: Do not create the release tag yet**

Confirm the release checklist is documented, but leave the actual tag creation for a later explicit release step after `make verify`, `make test-e2e`, and user approval.
