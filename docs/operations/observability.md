# Observability Runbook

ClinicPulse observability for alpha and pilot deployments is focused on fast triage, privacy-safe evidence, and clear signals for operator action. It is not a contractual monitoring package.

## Log Field Reference

Structured API logs should be forwarded as JSON when the host supports it. Treat these fields as the operator-facing reference for dashboards and incident lookup.

| Field | Meaning | Notes |
| --- | --- | --- |
| `timestamp` | Event time in UTC | Use host timestamp if the app field is unavailable. |
| `level` | `debug`, `info`, `warn`, or `error` | Alert only from `warn`/`error` signals or metrics. |
| `service` | Service name | Set with `CLINICPULSE_OBSERVABILITY_SERVICE_NAME`. |
| `env` | Deployment environment | Example: `staging`, `pilot`. |
| `request_id` | Request correlation ID | Return this to support when users report failures. |
| `trace_id` | Distributed trace/correlation ID when present | Use with provider tracing if enabled. |
| `method` | HTTP method | Example: `GET`, `POST`. |
| `route` | Bounded route pattern in request and error logs | Metrics use the same bounded `route` label instead of raw arbitrary URLs. |
| `status` | HTTP status code | Used for 5xx, auth denial, and health dashboards. |
| `duration_ms` | Request duration in milliseconds | Used for p95 latency dashboards. |
| `remote_ip_hash` | Hashed client/network identifier when available | Do not log raw IP addresses unless the host already records them. |
| `user_id_hash` | Hashed authenticated user identifier when available | Never log email addresses or names. |
| `role` | Authenticated role when available | Example: `admin`, `staff`, `partner`. |
| `clinic_id` | Clinic identifier for operational records | Allowed only as a stable internal ID, not clinic notes. |
| `error_code` | Stable application error code | Example: `rate_limited`, `database_unavailable`. CSRF denials are tracked through CSRF metrics and request completion logs, not structured error logs with a CSRF `error_code`. |
| `component` | Subsystem emitting the event | Example: `auth`, `store`, `sync`, `readiness`. Do not assume every metric-only domain operation also emits component-specific logs. |
| `partner_id` | Partner/integration identifier | Use internal IDs only; no secrets. |

## Metrics Endpoint Setup

Enable metrics only for environments where the endpoint is protected by a token and restricted network path.

| Variable | Required value |
| --- | --- |
| `CLINICPULSE_METRICS_ENABLED` | `true` to expose the metrics endpoint; unset or `false` disables it. |
| `CLINICPULSE_METRICS_TOKEN` | High-entropy bearer token used by the scraper or uptime vendor. |
| `CLINICPULSE_OBSERVABILITY_SERVICE_NAME` | Stable service label, for example `clinicpulse-api-staging`. |

Scrape the API metrics endpoint over HTTPS from the monitoring vendor or a private worker. Configure the scraper to send `Authorization: Bearer <CLINICPULSE_METRICS_TOKEN>`.

## Metrics Token Behavior

- Keep `CLINICPULSE_METRICS_TOKEN` out of frontend and client-visible environments.
- Rotate the token when an operator leaves, a vendor integration is removed, or logs suggest the endpoint was probed.
- Requests without the bearer token, with the wrong token, or when metrics are disabled should be treated as denied access and should not expose metrics content.
- Do not reuse the metrics token for partner APIs, webhooks, database access, or deployment automation.

## Safe Log Forwarding

### Render

- Use Render log streams or a vendor drain that preserves JSON fields.
- Store vendor credentials as Render environment variables, not in build args.
- Filter request bodies, cookies, `Authorization`, `Set-Cookie`, API keys, webhook secrets, and CSRF tokens before forwarding.

### Railway

- Use Railway log drains or a sidecar/agent only if it can redact secrets before export.
- Avoid forwarding database connection strings from process startup logs.
- Keep metrics scraping separate from application log forwarding.

### Vercel

- Use Vercel project logs for frontend route and rewrite visibility.
- Do not log browser cookies, session contents, patient details, or full form submissions.
- Correlate frontend failures to API logs with `request_id` when the response includes one.

## Dashboard And Query Examples

Adapt metric and log names to the selected provider. The examples below use Prometheus-style queries where possible and log-query wording where the signal is log-derived.

| Dashboard | Example signal/query |
| --- | --- |
| Request volume | `sum by (method, route, status_class, principal_type) (rate(clinicpulse_http_requests_total[5m]))` |
| 5xx rate | `sum(rate(clinicpulse_http_requests_total{status_class="5xx"}[5m])) / sum(rate(clinicpulse_http_requests_total[5m]))` |
| HTTP categorized errors | `sum by (error_kind) (rate(clinicpulse_http_errors_total[5m]))` |
| API p95 latency | `histogram_quantile(0.95, sum by (le, method, route, status_class, principal_type) (rate(clinicpulse_http_request_duration_seconds_bucket[5m])))` |
| API latency count/sum | `sum by (method, route, status_class, principal_type) (rate(clinicpulse_http_request_duration_seconds_count[5m]))` and `sum by (method, route, status_class, principal_type) (rate(clinicpulse_http_request_duration_seconds_sum[5m]))` |
| Readiness | `sum by (result) (rate(clinicpulse_readiness_checks_total[5m]))`, `rate(clinicpulse_readiness_check_duration_seconds_count[5m])`, and `rate(clinicpulse_readiness_check_duration_seconds_sum[5m])`; supplement with request logs where `route="/readyz"` and `status=503`. |
| Auth denials | Logs where `component="auth"` and `error_code in ("rate_limited", "invalid_credentials")`; track CSRF separately with `sum(rate(clinicpulse_csrf_denials_total{result="denied"}[5m]))` and/or `sum(rate(clinicpulse_http_errors_total{error_kind="csrf"}[5m]))`, then correlate affected windows and routes with request completion logs by `route`, `status_class`, `request_id`, `trace_id`, and timestamp. |
| Login failures/throttling | `sum by (result) (rate(clinicpulse_domain_operations_total{operation="auth.login",result=~"invalid_credentials|rate_limited|error"}[5m]))`. Known results: `success`, `invalid_credentials`, `rate_limited`, `error`. |
| Report create outcomes | `sum by (result) (rate(clinicpulse_domain_operations_total{operation="report.create"}[15m]))`. Known results: `created`, `pending_review`, `duplicate`, `validation_error`, `error`. |
| Report review outcomes | `sum by (result) (rate(clinicpulse_domain_operations_total{operation="report.review"}[15m]))`. Known results: `accepted`, `rejected`, `error`. |
| Sync failures | `sum(rate(clinicpulse_domain_operations_total{operation="offline_sync",result="error"}[15m]))` plus logs where `component="sync" level in ("warn", "error")`. |
| Webhook failures | `sum(rate(clinicpulse_domain_operations_total{operation="partner.webhook_test",result=~"failed|error"}[15m]))`; correlate with request completion logs by `request_id`, `trace_id`, route, and timestamp. |
| Partner export failures | `sum(rate(clinicpulse_domain_operations_total{operation="partner.export",result="error"}[15m]))`; correlate with request completion logs by `request_id`, `trace_id`, route, and timestamp. |
| Stale clinic count | Admin/data-ingestion operational check by district/source, or future provider-derived signal if the monitoring platform derives this from admin data. Do not treat it as a concrete emitted metric unless implemented. |

## Privacy And Redaction Rules

- Never log patient names, national IDs, phone numbers, email addresses, appointment notes, free-text report bodies, passwords, session tokens, API keys, webhook secrets, CSRF tokens, or raw `Authorization` headers.
- Hash user identifiers and network identifiers before forwarding outside the host platform.
- Prefer internal IDs and aggregate counts for clinic, sync, partner, and export dashboards.
- Keep log retention short for pilot environments; 14 to 30 days is enough unless an incident requires preserving evidence.
- Share incident excerpts with only the minimum fields needed for triage: time, service, request ID, route, status, error code, and redacted operator notes.
