# Phase 5 Pilot Launch Checklist

Date: 2026-05-18
Status: In progress until closeout records final evidence

## Release Candidate

- Candidate branch: `feature/phase-5-pilot-launch-readiness`
- Candidate SHA: record the exact output of `git rev-parse HEAD` during closeout.
- Candidate tag: `v0.1.0-alpha`, only after explicit approval.
- Release gate owner: repository maintainer running the final Phase 5 closeout.

## Required Gates

| Gate | Required command | Evidence location |
| --- | --- | --- |
| Clean install | `npm ci` | Phase 5 closeout |
| Unit, lint, Go test, build, OpenAPI | `make verify` | Phase 5 closeout |
| Browser E2E | `make test-e2e` | Phase 5 closeout |
| Security scans | `make verify-security` | Phase 5 closeout |
| API container smoke | `make test-api-container` | Phase 5 closeout |
| Git cleanliness | `git status --short` | Phase 5 closeout |

## Pilot Environment

- Frontend environment variables match `docs/deployment.md`.
- API environment variables match `docs/deployment.md`.
- `CLINICPULSE_ALLOW_DEMO_FALLBACK=false`.
- `CLINICPULSE_ALLOW_PUBLIC_REGISTRATION=false`.
- `CLINICPULSE_TRUSTED_ORIGINS` contains deployed frontend origins only.
- `CLINICPULSE_METRICS_ENABLED=true` only when `CLINICPULSE_METRICS_TOKEN` is set and scraping is approved.
- `CLINICPULSE_WEBHOOK_DELIVERY_ENABLED=false` unless outbound delivery is explicitly approved.

## Operational Handoff

- Uptime checks cover frontend, `/healthz`, and `/readyz`.
- Alert routes have named owners.
- Logs are forwarded through a privacy-safe path.
- SLOs are treated as internal pilot objectives, not contractual SLAs.
- Incident response uses `docs/operations/incident-response.md`.
- Alert routing uses `docs/operations/alert-routing.md`.

## Data Protection And Legal Review

- Privacy, terms, and safety pages are reachable.
- Data freshness and source labels are visible in pilot-critical workflows.
- Partner exports exclude private reporter identity and internal auth data.
- Legal/data-protection reviewer has reviewed the pilot boundary language before launch.
- The checklist records review status; it does not certify legal compliance.

## Rollback

- Frontend rollback: promote previous Vercel deployment.
- API rollback: redeploy previous Docker image tag.
- Database rollback: restore latest known-good managed Postgres backup only when roll-forward repair is unsafe.
- Rollback decision owner: pilot technical lead.

## Signoff

| Area | Required decision | Evidence |
| --- | --- | --- |
| Technical | Release gates accepted | Phase 5 closeout |
| Operational | Support, alerts, incident response accepted | This checklist and operations docs |
| Data/legal | Pilot boundary and data-protection review accepted | This checklist and public legal pages |
| Stakeholder | Pilot scope, support window, and non-goals accepted | Stakeholder handoff runbook |
