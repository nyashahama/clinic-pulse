# Phase 5 Pilot Launch Readiness Spec

Date: 2026-05-18
Status: In progress

## Goal

Cut a controlled pilot release candidate and prepare technical, operational, legal/data-protection, and stakeholder evidence for a real pilot launch decision.

## Scope

- Track Phase 5 public docs and closeout evidence.
- Add an OpenAPI 3.1 JSON contract for implemented API routes.
- Add OpenAPI drift verification.
- Add accessibility smoke coverage for pilot-critical routes.
- Add performance smoke coverage for pilot-critical routes.
- Prepare pilot launch checklist, stakeholder handoff runbook, rollback process, and signoff matrix.
- Run and record standing release gates.

## Non-Goals

- New authenticated roles.
- Partner portal outside `/admin`.
- Production webhook worker fleet.
- External observability vendor integration.
- Legal certification or executed data-processing agreements.
- Public production launch or release tag without explicit approval.

## Acceptance Criteria

- OpenAPI verifier passes and covers every route registered in `services/api/internal/http/router.go`.
- Accessibility smoke tests pass for public, auth, field, district, admin, integration, and legal routes.
- Performance smoke tests pass for public, finder, login, admin, and integration routes.
- `docs/phase-5-pilot-launch-checklist.md` and `docs/phase-5-stakeholder-handoff-runbook.md` exist.
- `npm ci`, `make verify`, `make test-e2e`, `make verify-security`, `make test-api-container`, and `git status --short` are run and recorded in the closeout.
- The closeout records residual risks without claiming production readiness beyond the approved pilot release candidate.
