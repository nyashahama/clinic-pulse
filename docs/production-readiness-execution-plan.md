# Production Readiness Execution Plan

Date: 2026-05-12
Status: Active roadmap
Current phase: Phase 1 - Production Runtime And Deployment

## Purpose

This document is the persistent production-readiness map for ClinicPulse. Keep it updated after every phase so the next phase is always obvious.

ClinicPulse is currently a production-shaped alpha. It has the core product loop, real API/database foundations, auth, roles, audit evidence, admin governance surfaces, and a stable Phase 0 release gate, but it still needs security hardening, deployability, observability, and pilot governance before it can be treated as production software.

## Phase Status Key

- `Not started`: no implementation work has begun.
- `Planned`: spec and implementation plan exist.
- `In progress`: implementation branch is active.
- `Blocked`: implementation is waiting on a decision, dependency, or external setup.
- `Complete`: phase acceptance criteria passed and closeout is documented.

## Production Readiness Gates

These gates must be green before a production or pilot release candidate is cut:

```bash
npm ci
make verify
make test-e2e
npm audit --audit-level=moderate
cd services/api && govulncheck ./...
git status --short
```

Phase 0 makes these commands reliable and enforceable. Later phases may add stricter gates, but they should not weaken these.

## Phase Overview

| Phase | Status | Target Outcome | Estimated Effort |
| --- | --- | --- | --- |
| Phase 0 - Release Gate Stabilization | Complete | Clean dependency/security scans, stable E2E, and blocking CI gates | 1-2 days |
| Phase 1 - Production Runtime And Deployment | In progress | Repeatable staging deployment with production runtime controls | 3-5 days |
| Phase 2 - Security And Auth Hardening | Not started | Production-safe auth, sessions, secrets, rate limits, and account lifecycle | 1 week |
| Phase 3 - Pilot Data And Product Integrity | Not started | Real data provenance, completed pilot workflows, and legal/safety surfaces | 1-2 weeks |
| Phase 4 - Observability And Operations | Not started | Logs, metrics, tracing, alerts, runbooks, and incident process | 1 week |
| Phase 5 - Pilot Launch Readiness | Not started | Release candidate, stakeholder docs, operational signoff, and launch checklist | 1-2 weeks |

## Phase 0 - Release Gate Stabilization

Spec: `docs/phase-0-release-gate-stabilization-spec.md`
Plan: `docs/phase-0-release-gate-stabilization-implementation-plan.md`
Closeout: `docs/phase-0-release-gate-stabilization-closeout.md`

Goal:

Make the current alpha reproducible and release-gate clean before adding more production surface area.

Required outcomes:

- `npm audit --audit-level=moderate` passes.
- `cd services/api && govulncheck ./...` passes.
- Go toolchain target is aligned to a patched version.
- Full `make test-e2e` passes without rerun-only success.
- Current hydration, smooth-scroll, and LCP warnings are resolved or deliberately documented as non-blocking.
- CI blocks on frontend tests, lint, build, Go tests, Go vet, Playwright E2E, npm audit, and govulncheck.

Exit rule:

Do not start Phase 1 until the commands in "Production Readiness Gates" pass from a clean checkout.

## Phase 1 - Production Runtime And Deployment

Spec: `docs/phase-1-production-runtime-and-deployment-spec.md`
Plan: `docs/phase-1-production-runtime-and-deployment-implementation-plan.md`
Deployment runbook: `docs/deployment.md`

Goal:

Make ClinicPulse deployable to a staging environment with production-like runtime behavior.

Scope:

- Add production Dockerfiles or a documented build/run strategy for the Next.js app and Go API.
- Add environment validation so staging/production cannot silently use local defaults, empty secrets, or demo fallback.
- Add API server read/write/idle timeouts.
- Add readiness and liveness checks suitable for orchestration.
- Add a migration ledger with repeatable up/down or forward-only migration tracking.
- Define managed Postgres configuration, backup, restore, and rollback procedures.
- Create a staging deployment path through CI/CD.

Exit rule:

Phase 1 is complete when a clean staging deploy can be recreated from CI and the app refuses unsafe production configuration.

## Phase 2 - Security And Auth Hardening

Goal:

Remove demo-only authentication assumptions and harden request/session behavior.

Scope:

- Remove visible demo credentials from production-facing UI.
- Enforce real admin provisioning, invite, password reset, disable, and role-change flows.
- Add login throttling, API rate limiting, CSRF/origin protection for cookie-auth mutations, and session rotation/revocation.
- Enforce secure cookies, secret strength, API key pepper, and least-privilege production configuration.
- Add security headers and CSP.
- Keep dependency and vulnerability scanning blocking.

Exit rule:

Phase 2 is complete when a production tenant can operate without seeded demo accounts or demo fallback assumptions.

## Phase 3 - Pilot Data And Product Integrity

Goal:

Make the product trustworthy for a controlled pilot using real operational data.

Scope:

- Replace seeded clinic data with a documented source-of-truth ingestion path.
- Add data provenance, freshness, confidence, and review state to user-facing operational data.
- Complete or remove placeholder routes before pilot.
- Implement reliable field offline queue, sync retry, conflict handling, and failure visibility.
- Add background jobs for stale reconciliation, exports, webhooks, and retry processing.
- Add public privacy, terms, and safety/disclaimer pages linked from relevant flows.

Exit rule:

Phase 3 is complete when pilot users can tell what data is real, current, reviewed, and safe to act on.

## Phase 4 - Observability And Operations

Goal:

Make ClinicPulse operable by a real team.

Scope:

- Add structured logs for frontend proxy/API flows and backend handlers.
- Add request metrics, service health metrics, and error tracking.
- Add tracing for request paths that cross frontend, API, and database.
- Add audit dashboards for sensitive actions.
- Add uptime checks, alert routing, incident runbooks, and SLOs.
- Add load and smoke tests for core journeys.

Exit rule:

Phase 4 is complete when an operator can detect, triage, and communicate incidents without reading source code.

## Phase 5 - Pilot Launch Readiness

Goal:

Cut a controlled pilot release candidate and prepare operational handoff.

Scope:

- Freeze a release candidate.
- Run full regression, E2E, security scan, accessibility, and performance checks.
- Publish partner/API documentation, preferably OpenAPI-backed.
- Complete data protection and legal review.
- Prepare stakeholder runbook, pilot support process, rollback plan, and launch checklist.

Exit rule:

Phase 5 is complete when the pilot launch has technical, operational, legal, and stakeholder signoff.

## Update Protocol

At the end of each phase:

1. Update the phase status table.
2. Move `Current phase` to the next phase.
3. Add links to the phase closeout document.
4. Record any deferred work under the next appropriate phase.
5. Re-run the standing production readiness gates and record the result in the closeout.
