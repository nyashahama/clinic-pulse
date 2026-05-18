# Deployment Runbook

ClinicPulse staging uses Vercel for the Next.js frontend and a Docker host for the Go API. The staging database should be a managed Postgres instance.

## Frontend: Vercel

Configure the Vercel project with the repository root as the project root. The project contract is recorded in `vercel.json`.

| Variable | Value |
| --- | --- |
| `CLINICPULSE_DEPLOY_ENV` | `staging` |
| `CLINICPULSE_API_BASE_URL` | HTTPS URL for the deployed Docker API |
| `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL` | `/api/clinicpulse` |
| `CLINICPULSE_ALLOW_DEMO_FALLBACK` | `false` |
| `CLINICPULSE_ALLOW_PUBLIC_REGISTRATION` | `false` |

Browsers should call `/api/clinicpulse/*`. The Next.js rewrite forwards those requests to `CLINICPULSE_API_BASE_URL`, keeping the deployed API origin out of client code.

## Backend: Docker API

Run the Go API as a Docker web service using the API image.

| Variable | Value |
| --- | --- |
| `CLINICPULSE_DEPLOY_ENV` | `staging` |
| `DATABASE_URL` | Managed Postgres connection URL |
| `CLINICPULSE_API_KEY_PEPPER` | At least 32 characters |
| `CLINICPULSE_WEBHOOK_DELIVERY_ENABLED` | `false` until intentionally enabled |
| `CLINICPULSE_TRUSTED_ORIGINS` | Comma-separated frontend origins, for example `https://staging.clinicpulse.example` |
| `CLINICPULSE_LOGIN_RATE_LIMIT` | Positive integer, default `8` attempts per window |
| `CLINICPULSE_MUTATION_RATE_LIMIT` | Positive integer, default `60` unsafe mutations per window |
| `CLINICPULSE_RATE_LIMIT_WINDOW` | Go duration, default `1m` |
| `CLINICPULSE_METRICS_ENABLED` | `true` only when the metrics endpoint is protected and scraped by an approved monitor; otherwise unset or `false` |
| `CLINICPULSE_METRICS_TOKEN` | High-entropy bearer token for the metrics scraper; never expose to frontend code |
| `CLINICPULSE_OBSERVABILITY_SERVICE_NAME` | Stable service label for logs/metrics, for example `clinicpulse-api-staging` |
| `PORT` | Supplied by Render, Railway, or the Docker host |

Start command:

```bash
/app/clinicpulse-api
```

Migration command:

```bash
/app/clinicpulse-migrate
```

Run migrations before starting a new API image against staging.

Phase 1 staging should use a fresh managed DB or one that already includes `schema_migrations`; do not expect the migrator to auto-adopt pre-ledger schemas.

`CLINICPULSE_TRUSTED_ORIGINS` must contain origins only, without paths, queries, or fragments. Unsafe cookie-authenticated requests with an untrusted `Origin` or `Referer` return `403 csrf_rejected`. Partner API-key requests are authenticated separately and do not use the browser CSRF path.

Keep `CLINICPULSE_WEBHOOK_DELIVERY_ENABLED=false` until outbound delivery is implemented and reviewed. If it is enabled early, webhook test requests still record failed delivery evidence for admin review and return `501 not_implemented`; they do not expose webhook secrets.

Phase 3 does not add a persistent background worker. Stale reconciliation, exports, webhook tests, and sync evidence remain API-triggered and auditable. Phase 4 adds production observability runbooks, alert routing, and pilot-stage SLOs.

## Observability Setup

- Enable `CLINICPULSE_METRICS_ENABLED=true` only after `CLINICPULSE_METRICS_TOKEN` is set and the endpoint is reachable only by the monitoring vendor or a private scraper.
- Configure the scraper to send `Authorization: Bearer <CLINICPULSE_METRICS_TOKEN>`.
- Set `CLINICPULSE_OBSERVABILITY_SERVICE_NAME` to a stable value before the first pilot dashboard is created; changing it later can split metric history.
- Forward API logs as structured JSON when the host supports it.
- Redact request bodies, cookies, `Authorization`, `Set-Cookie`, API keys, webhook secrets, CSRF tokens, patient identifiers, and free-text clinical notes before logs leave the host.
- Create uptime checks for the Vercel frontend, API health endpoint, and API readiness endpoint.
- Build HTTP dashboards from `clinicpulse_http_requests_total{method,route,status_class,principal_type}`, `clinicpulse_http_request_duration_seconds_bucket{method,route,status_class,principal_type,le}`, `clinicpulse_http_request_duration_seconds_count{method,route,status_class,principal_type}`, `clinicpulse_http_request_duration_seconds_sum{method,route,status_class,principal_type}`, and `clinicpulse_http_errors_total{error_kind}`.
- Build readiness dashboards from `clinicpulse_readiness_checks_total{result}`, `clinicpulse_readiness_check_duration_seconds_count{result}`, and `clinicpulse_readiness_check_duration_seconds_sum{result}`.
- Build domain operation alerts from `clinicpulse_domain_operations_total{operation,result}` for `auth.login`, `report.create`, `report.review`, `offline_sync`, `partner.webhook_test`, and `partner.export`; treat stale clinic count as an admin/data-ingestion operational check unless a provider-derived monitor is configured.
- Route Sev1/Sev2 alerts to the primary operator and pilot incident channel; route partner webhook/export alerts to the partner integration owner.

Use `docs/operations/observability.md`, `docs/operations/alert-routing.md`, `docs/operations/incident-response.md`, and `docs/operations/slo.md` as the operator reference for pilot monitoring.

## Render Notes

- Create a Docker web service using `services/api/Dockerfile`.
- Provision managed Postgres and set `DATABASE_URL` from the managed database connection URL.
- Set the Docker API environment variables listed above.
- Render supplies `PORT`; do not hard-code it.
- Run `/app/clinicpulse-migrate` against the staging database before promoting the new API image.
- Configure Render log streams or a vendor drain only after redaction rules are confirmed.

## Railway Notes

- Create a Docker service rooted at `services/api`.
- Provision Railway Postgres and set `DATABASE_URL` from the Railway database connection URL.
- Set the Docker API environment variables listed above.
- Railway supplies `PORT`; do not hard-code it.
- Run `/app/clinicpulse-migrate` against the staging database before promoting the new API image.
- Configure Railway log drains or a private agent only after redaction rules are confirmed.

## Managed Postgres Backup, Restore, And Migration

Create a staging backup before migrations or image promotion:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=clinicpulse-staging-$(date +%Y%m%d%H%M%S).dump
```

Run the migration container against staging:

```bash
docker run --rm \
  -e CLINICPULSE_DEPLOY_ENV=staging \
  -e DATABASE_URL="$DATABASE_URL" \
  -e CLINICPULSE_API_KEY_PEPPER="$CLINICPULSE_API_KEY_PEPPER" \
  clinicpulse-api:<tag> \
  /app/clinicpulse-migrate
```

Restore a managed Postgres backup when a rollback requires database restoration:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" clinicpulse-staging-backup.dump
```

Prefer roll-forward corrective migrations when data shape changes can be repaired without restoring the entire database.

## Staging Recreation Checklist

- Provision a fresh managed Postgres database.
- Confirm the database is fresh or already includes `schema_migrations`.
- Create the Docker API service and configure the backend environment variables.
- Run `/app/clinicpulse-migrate` against staging.
- Start the API image with `/app/clinicpulse-api`.
- Confirm the API exposes a healthy HTTPS base URL.
- Create or reconnect the Vercel frontend project.
- Configure the Vercel frontend environment variables.
- Configure observability environment variables when pilot monitoring is in scope.
- Confirm browser traffic uses `/api/clinicpulse/*`.
- Confirm uptime checks and alert destinations are configured before pilot handoff.
- Smoke test booking, district console, clinic detail, public finder, field reporting, admin, login, and registration paths that are in scope for the staging handoff.

## Rollback

- Frontend: promote the previous Vercel deployment.
- API: redeploy the previous Docker image tag.
- Database: restore the latest known-good managed Postgres backup, or apply a roll-forward corrective migration when restoration would lose desired data.

For pilot launch decisions, use docs/phase-5-pilot-launch-checklist.md to confirm the release candidate, owner, support window, and signoff state before promotion or rollback.
