# Incident Response Runbook

This runbook is for alpha and pilot operations. It is intended to reduce time-to-triage and keep communication consistent; it does not create a contractual SLA.

## Severity Levels

| Severity | Definition | Examples | Target handling |
| --- | --- | --- | --- |
| Sev1 | Broad outage or unsafe data behavior affecting pilot-critical workflows | API unavailable, database unavailable, auth unavailable for most users, confirmed privacy exposure | Immediate acknowledgement, active incident channel, stakeholder update within 30 minutes. |
| Sev2 | Major degradation with workaround or limited scope | Elevated 5xx, high login throttling, stale data for a district, partner exports failing | Acknowledge within business hours target, update stakeholders if user-visible. |
| Sev3 | Partial issue with limited user impact | Single integration failing, intermittent latency, isolated sync errors | Triage during normal operator window and record follow-up. |
| Sev4 | Non-urgent operational anomaly | Dashboard warning, low-volume retries, documentation gap | Track in maintenance backlog. |

## Triage Checklist

1. Confirm the incident start time, affected environment, and affected user path.
2. Check API health, readiness, database availability, frontend availability, and recent deployment history.
3. Search logs by `request_id` or `trace_id` from the user report, browser response, or alert payload.
4. Identify the dominant error code, route, status class, and dependency involved.
5. Decide severity and owner using `docs/operations/alert-routing.md`.
6. Apply the narrowest safe mitigation: rollback frontend, redeploy previous API image, pause partner workflow, disable unsafe integration path, or restore database from backup only when necessary.
7. Record timeline, impact, mitigation, and follow-up items in the post-incident review template.

## Request ID / Trace ID Lookup

1. Ask the reporter for the timestamp, route, visible error, and request ID if shown.
2. Search API logs for `request_id="<id>"`; if absent, search by `trace_id="<id>"`.
3. If neither ID is available, filter by timestamp window, `route`, `status>=500` or known `error_code`, and user role.
4. Correlate frontend/Vercel logs to API logs by timestamp and route.
5. Share only redacted excerpts in incident channels.

## Database Down Procedure

1. Confirm readiness reports database unavailable, `/readyz` request logs show `status=503`, or API errors show connection refused, timeout, or migration failures.
2. Check managed Postgres provider status and connection limits.
3. If the database is recovering, keep frontend/API online only if they fail safely with clear unavailable responses.
4. If a new deployment caused the issue, roll back the API image or environment change.
5. If data restoration is required, follow the backup and restore guidance in `docs/deployment.md`.
6. After recovery, confirm readiness is healthy and review logs for failed writes, sync attempts, exports, and webhook retries.

## Auth / Login Degradation Procedure

1. Check login route status codes, `rate_limited`, `csrf_rejected`, and `invalid_credentials` counts.
2. Confirm `CLINICPULSE_TRUSTED_ORIGINS`, public registration setting, demo fallback setting, and frontend API base URL are correct for the environment.
3. If throttling is expected from abuse, keep limits in place and communicate that affected users may need to wait for the window to reset.
4. If legitimate users are blocked, confirm the rate-limit window and origin configuration before changing values.
5. If sessions or auth tables are unavailable, treat as database degradation and follow the database-down procedure.

## High 5xx Procedure

1. Break down 5xx by route, method, deployment version, and error code.
2. Check whether readiness/database errors are the root cause.
3. Compare the error start time with the latest API/frontend deployment and environment variable changes.
4. Roll back the API image or frontend deployment if the error began immediately after promotion.
5. Preserve request IDs and redacted log samples for the post-incident review.

## Stale Data / Sync Failure Procedure

1. Check stale clinic count by district/source and sync failure logs.
2. Confirm whether stale data is from API-triggered reconciliation, field reporting, or partner input.
3. Verify that failed sync attempts are recorded with source, freshness, and review state.
4. Pause affected partner-facing exports if stale operational data could mislead users.
5. Communicate the affected districts, expected freshness gap, and next update time.

## Partner Webhook / Export Failure Procedure

1. Identify the affected partner, webhook endpoint, export type, and first failing timestamp.
2. Check `clinicpulse_domain_operations_total{operation="partner.webhook_test",result=~"failed|error"}` and `clinicpulse_domain_operations_total{operation="partner.export",result="error"}` for the failure window.
3. Confirm no webhook secrets, partner API keys, or export contents were logged.
4. Correlate the metric spike with request completion logs by `request_id`, `trace_id`, route, and timestamp rather than querying nonexistent webhook/export component logs.
5. Retry only when the operation is idempotent or the partner confirms it is safe.
6. If delivery is intentionally disabled, confirm the environment still has `CLINICPULSE_WEBHOOK_DELIVERY_ENABLED=false` and explain that evidence is recorded but outbound delivery is not active.
7. Escalate to the partner owner if failures persist beyond the alert threshold.

## Stakeholder Communication Template

```text
Subject: ClinicPulse incident update - <severity> - <short title>

Status: Investigating | Mitigating | Monitoring | Resolved
Environment: <staging/pilot>
Started: <UTC time>
Impact: <who/what is affected, in plain language>
Current action: <what the operator is doing now>
Workaround: <if available>
Next update: <time or condition>
Request/reference IDs: <redacted IDs only>
```

## Post-Incident Review Template

```text
Title: <short title>
Severity: <Sev1-Sev4>
Environment: <staging/pilot>
Incident window: <start UTC> to <end UTC>
Detected by: <alert/user/operator>
Affected workflows: <routes/workflows/integrations>
User impact: <plain-language impact>
Root cause: <technical cause>
What worked: <detection, response, rollback, comms>
What failed: <gaps or delays>
Follow-up actions: <owner, action, due date>
Evidence: <request IDs, trace IDs, dashboard links, redacted log links>
```
