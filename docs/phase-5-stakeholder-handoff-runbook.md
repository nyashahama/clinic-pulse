# Phase 5 Stakeholder Handoff Runbook

Date: 2026-05-18
Status: Ready for pilot-owner review; launch owners and support window must be assigned before handoff

## Pilot Support Model

- Support window: agreed pilot hours recorded before launch.
- Primary support owner: pilot operator assigned before launch.
- Technical escalation owner: maintainer assigned before launch.
- Data owner: operator responsible for source freshness and stale clinic review.
- Partner owner: operator responsible for API keys, exports, and webhook test evidence.

## Issue Intake

Capture:

- Environment.
- User role.
- Route or workflow.
- Timestamp with timezone.
- Visible error message.
- Request ID or trace ID when available.
- Screenshot only if it does not expose secrets, patient identifiers, or clinical notes.

## First Response

1. Confirm whether the issue affects frontend availability, API health, readiness/database, auth, stale data, reporting, sync, partner export, or webhook test evidence.
2. Check `docs/operations/alert-routing.md` for owner and severity.
3. Use `docs/operations/incident-response.md` for incident process.
4. Search logs by request ID or trace ID when available.
5. Communicate status, impact, current action, workaround, and next update time.

## Pilot Boundaries

- ClinicPulse is an alpha pilot candidate, not certified production clinical infrastructure.
- SLOs are internal pilot objectives, not contractual SLAs.
- Privacy, terms, and safety pages explain product boundaries.
- Partner-facing data should be paused when freshness or review state is unsafe.
- Rollback follows `docs/deployment.md` and the Phase 5 launch checklist.

## Launch Day Checks

1. Confirm release candidate SHA and deployment versions.
2. Confirm frontend, API health, and readiness uptime checks are green.
3. Confirm alert destinations have named owners.
4. Confirm metrics endpoint protection when enabled.
5. Confirm partner API key handling and export sharing path.
6. Confirm pilot users know support channel and issue intake expectations.
