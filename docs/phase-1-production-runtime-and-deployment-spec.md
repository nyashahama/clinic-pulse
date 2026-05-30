# Phase 1 Production Runtime And Deployment Spec

Date: 2026-05-14
Status: Planned

## Goal

Phase 1 makes ClinicPulse repeatably deployable to staging with production-like runtime controls.

The approved deployment shape is:

- Frontend: Vercel, using the existing Next.js build and the same-origin `/api/clinicpulse/*` proxy.
- Backend: Docker-deployed Go API, suitable for Render, Railway, or another host that can run a container and provide a managed Postgres URL.
- Database: managed Postgres with a documented migration, backup, restore, and rollback process.

This phase should make staging recreation boring: a clean checkout, known environment variables, a Docker image for the API, a Vercel project for the web app, and blocking checks that reject unsafe production-like configuration.

## Current Evidence

Phase 0 is complete and merged into `main`.

The current system already has:

- A Next.js app that builds with `npm run build`.
- A browser proxy in `next.config.ts` that rewrites `/api/clinicpulse/*` to `CLINICPULSE_API_BASE_URL`.
- A Go chi API in `services/api`.
- Public `/healthz` and database-backed `/readyz` endpoints.
- Local Docker Compose for Postgres only.
- Raw SQL migrations in `services/api/migrations`.
- A Makefile that applies migrations by replaying all SQL files against a fresh local database.
- CI gates for frontend tests, lint, build, API tests, Go vet, Playwright E2E, npm audit, and govulncheck.

The current gaps for staging are:

- No production API container image.
- No provider-neutral Docker deployment instructions for the API.
- No Vercel deployment contract for frontend environment variables.
- Runtime configuration can still fall back to local defaults.
- The API uses `http.ListenAndServe` without explicit server timeouts or graceful shutdown.
- Migration application has no ledger, so it is safe for fresh local databases but not for managed staging databases.
- Backup, restore, and rollback are not documented for managed Postgres.

## Product Decision

Recommended approach:

Use Vercel for the frontend and a Docker image for the Go API backend. Treat Render and Railway as compatible container hosts, not as first-class code dependencies.

Approaches considered:

- Vercel plus Render-specific API configuration: faster once Render is final, but too provider-specific before the backend host is chosen.
- Vercel plus Railway-specific API configuration: same tradeoff as Render-specific configuration.
- Full infrastructure-as-code platform: too large for Phase 1 and unnecessary before the deployment target is proven.
- Vercel frontend plus provider-neutral Docker API: selected because it gives a real staging path without locking the backend to one host.

## Scope

Phase 1 covers:

- A production Dockerfile for the Go API.
- A migration command or runner that records applied SQL migrations in a database ledger.
- Runtime environment validation for production-like environments.
- API server read, write, idle, and shutdown timeout configuration.
- Provider-neutral Docker deployment documentation for the API.
- Vercel deployment documentation for the frontend.
- Managed Postgres setup, migration, backup, restore, and rollback documentation.
- CI checks that build the API container and smoke-test its health endpoints.
- Release and readiness docs that describe the staging deployment gate.

Phase 1 does not cover:

- Login throttling, CSRF protection, CSP, invite flows, password reset, or session revocation hardening.
- Removing demo credentials from public docs or production-facing UI.
- Real source-of-truth clinic data ingestion.
- Background jobs for stale reconciliation, exports, or webhooks.
- Structured logs, metrics, tracing, alerting, or incident response.
- Legal, privacy, data protection, or pilot signoff.
- Terraform, Kubernetes, or permanent cloud provider selection.

## Runtime Model

### Frontend

The frontend deploys to Vercel as a standard Next.js app.

Required staging behavior:

- `CLINICPULSE_API_BASE_URL` points to the deployed Docker API over HTTPS.
- `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL` remains `/api/clinicpulse`.
- `CLINICPULSE_ALLOW_SEEDED_FALLBACK` is `false` for staging unless a deploy is intentionally marked as demo-only.
- Build or startup validation rejects staging/production values that silently point to localhost or leave required API configuration empty.

### Backend

The backend deploys as a Docker image built from `services/api`.

Required staging behavior:

- The API listens on the port supplied by the host, usually `$PORT`, unless `CLINICPULSE_API_ADDR` is explicitly set.
- `DATABASE_URL` is required outside local development.
- `CLINICPULSE_API_KEY_PEPPER` is required and must meet the documented minimum strength outside local development.
- The API fails fast on unsafe production-like configuration instead of starting with local defaults.
- `/healthz` reports process liveness without requiring Postgres.
- `/readyz` reports database readiness and returns `503` when Postgres is unavailable.
- The HTTP server has explicit read, write, idle, and header timeouts.
- Shutdown handles termination signals without dropping in-flight requests immediately.

### Database

Managed Postgres is the staging source of truth.

Required staging behavior:

- SQL migrations apply through a ledger, not by replaying all files blindly.
- Each applied migration records filename, checksum, and timestamp.
- A changed checksum for an already-applied migration fails the migration run.
- Backup and restore commands are documented for provider-managed Postgres.
- Rollback procedure favors restore-from-backup and roll-forward fixes over editing applied migrations.

## Functional Requirements

### Environment Validation

- Introduce an explicit deploy environment concept, such as `CLINICPULSE_DEPLOY_ENV=local|staging|production`.
- Local development may use existing defaults.
- Staging and production must require explicit `DATABASE_URL`, `CLINICPULSE_API_BASE_URL`, and `CLINICPULSE_API_KEY_PEPPER` values.
- Staging and production must reject localhost API URLs, local Postgres URLs, and demo fallback unless explicitly marked demo-only.
- Validation failures must produce actionable error messages that name the missing or unsafe variable.

### API Docker Runtime

- The API Docker image must contain only runtime assets needed to run the API and migrations.
- The image must include the API binary, migration binary or command, and SQL migration files.
- The image must run as a non-root user.
- The image must expose the API port expected by Docker hosts.
- The same image must be usable on Render or Railway with environment variables only.

### Migrations

- A migration command must apply pending migrations in sorted filename order.
- The command must create the ledger table if it does not exist.
- The command must run each migration inside a transaction when possible.
- The command must skip migrations already present in the ledger with the same checksum.
- The command must fail if an already-applied migration has a different checksum.
- Local `make db-migrate` should use the same migration path as staging.

### Health And Readiness

- `/healthz` must remain public and database-independent.
- `/readyz` must remain public and database-backed.
- API smoke checks must verify both endpoints against the Docker image.
- Readiness failure must not leak database connection details.

### Deployment Documentation

- Document Vercel frontend project settings.
- Document Docker API environment variables.
- Document Render and Railway deployment notes without requiring provider-specific code.
- Document managed Postgres provisioning assumptions.
- Document a staging recreation checklist from an empty environment.
- Document rollback steps for frontend, API image, and database.

### CI And Release Gates

- CI must build the API Docker image.
- CI must run the migration command against a disposable Postgres database.
- CI must start the API container and verify `/healthz` and `/readyz`.
- Existing Phase 0 gates must remain blocking.
- `docs/release.md` and `docs/production-readiness-execution-plan.md` must identify the added Phase 1 staging gate.

## Acceptance Criteria

Phase 1 is complete only when these commands pass from a clean checkout:

```bash
npm ci
make verify
make test-e2e
make verify-security
docker build -f services/api/Dockerfile services/api
make test-api-container
git status --short
```

Expected final state:

- Vercel frontend deployment variables are documented.
- Docker API deployment variables are documented.
- The API container can boot locally against a migrated Postgres database.
- The API rejects unsafe staging/production configuration.
- The migration ledger prevents blind replay and checksum drift.
- `/healthz` and `/readyz` pass in the container smoke test.
- Managed Postgres backup, restore, migration, and rollback docs exist.
- Phase 2 can begin without carrying deployment bootstrapping debt.

## Risks

- Render and Railway differ in service startup commands and private networking. The spec avoids provider-specific code, but deployment docs must call out each host's environment variable and start-command shape.
- Vercel preview deployments may be useful for demos, but they should not be treated as staging unless they point to the staging API and have production-like fallback rules.
- Migration ledgers must be introduced carefully because existing local workflows assume fresh databases.
- Environment validation can break local demos if local and staging modes are not clearly separated.
- Container smoke tests may lengthen CI runtime, so the plan should keep them focused on build, migration, and health checks.

## Implementation Plan

Detailed plan: `docs/phase-1-production-runtime-and-deployment-implementation-plan.md`
