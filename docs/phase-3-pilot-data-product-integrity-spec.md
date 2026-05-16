# Phase 3 Pilot Data And Product Integrity Spec

Date: 2026-05-16
Status: Draft for implementation planning

## Goal

Phase 3 makes ClinicPulse trustworthy enough for a controlled pilot using real operational data.

A pilot user should be able to answer:

- Where did this clinic status or report come from?
- How fresh is this operating data?
- Has the data been reviewed or is it still pending?
- What failed during field sync or ingestion?
- Which routes are safe to use in a pilot, and which demo-only surfaces have been removed or clearly downgraded?
- What privacy, terms, and safety boundaries apply before a pilot user acts on the information?

Phase 3 should close the biggest trust gaps after Phase 2 security hardening. It is not a full production data platform, observability phase, or legal compliance program.

## Product Decision

Phase 3 is **pilot data and product integrity**, not another broad dashboard phase.

The product already has a working clinic operations loop, authenticated roles, admin governance surfaces, partner readiness, offline sync primitives, stale reconciliation, audit evidence, and hardened auth. The next risk is not whether users can log in or navigate; the risk is whether a pilot user can trust the data enough to act.

The phase should therefore prioritize provenance, freshness, review state, sync failure visibility, and pilot-safe product boundaries over new features.

## Current Foundation

Phase 3 starts from this foundation:

- Phase 0 release gates are stable and CI blocks on core checks.
- Phase 1 added production-shaped runtime and deployment controls.
- Phase 2 hardened auth, sessions, CSRF/origin checks, rate limits, security headers, and admin account lifecycle.
- The Go API already owns Postgres-backed clinics, reports, current status, audit events, report reviews, offline sync attempts, partner readiness, exports, webhooks, auth, users, memberships, and sessions.
- Field reports can persist, enter district review, update current status after acceptance, and produce audit evidence.
- Offline sync summary and stale status reconciliation already exist.
- Admin governance routes expose users, access review, reporting coverage, audit evidence, tenant health, data ingestion, and security posture.
- Public legal routes are linked from auth pages, but the broader pilot safety story is not yet complete.
- Some demo and workflow routes still render placeholder pages or demo-only copy.

## Scope

Phase 3 covers:

- Documented source-of-truth ingestion path for pilot clinic data.
- Data provenance, freshness, confidence, and review-state labels on operational surfaces.
- Offline queue and sync integrity hardening for field reports.
- Retry, conflict, duplicate, validation failure, and failure visibility in field, district, and admin workflows.
- Background processing direction for stale reconciliation, export generation, webhook delivery, and retry processing.
- Pilot-safe placeholder route policy: complete, hide, or remove unfinished routes before pilot.
- Privacy, terms, and safety/disclaimer pages linked from relevant flows.
- Documentation updates for pilot data assumptions, source-of-truth boundaries, and safety copy.
- Unit, Go, and E2E tests proving pilot users can distinguish real, reviewed, stale, pending, and failed data states.

Phase 3 does not cover:

- A full external ETL platform.
- DHIS2 production integration.
- WhatsApp/SMS ingestion.
- A distributed background worker fleet.
- Full legal compliance certification.
- SSO, MFA, email invites, or password reset emails.
- Replacing the role model.
- Replacing the product shell.
- Full observability, alerting, tracing, incident runbooks, or SLOs. Those belong to Phase 4.
- Pilot launch checklist, stakeholder signoff, and release candidate freeze. Those belong to Phase 5.

## Reference Inventory

### Existing ClinicPulse Sources

Use:

- `docs/production-readiness-execution-plan.md`
- `docs/phase-2-security-and-auth-hardening-closeout.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/database-schema.md`
- `docs/deployment.md`
- `docs/release.md`
- `docs/product-roadmap.md`
- `docs/phase-3-first-real-vertical-slice-closeout.md`

Borrow:

- Current four-role boundary.
- Existing field report review workflow.
- Current admin governance module structure.
- Existing stale reconciliation and sync summary language.
- Existing release gate command set.

Do not borrow:

- Older demo-only phase numbering as production-readiness phase numbering.
- Browser-local demo state as a pilot source of truth.

### Product Pattern References

Use existing reference projects only for interaction patterns where needed:

- `reference-projects/shadcn-admin`: dense operational tables and filter chips.
- `reference-projects/appwrite-console`: clear credential, permission, and failure-state ergonomics.
- `reference-projects/openpanel`: empty states, loading states, and console-style data tables.

External references should not change ClinicPulse's data model or role model.

## Pilot Data Model Direction

Phase 3 should prefer existing tables and endpoints before adding schema.

Existing data sources to use first:

- `clinics`
- `service_availability`
- `current_status`
- `reports`
- `report_reviews`
- `report_sync_attempts`
- `audit_events`
- `partner_export_runs`
- `partner_webhook_events`
- `integration_status_checks`
- `users`
- `organisation_memberships`
- `sessions`

New schema is acceptable only when existing data cannot answer pilot trust questions. Any new table or column must directly support provenance, freshness, confidence, review state, or retry/failure visibility.

## Source-Of-Truth Ingestion

Purpose: make seeded/demo clinic data distinguishable from pilot-imported data.

Required behavior:

- Document the accepted pilot source-of-truth path.
- Add a small importable fixture or operator ingestion command for pilot clinic/status data.
- Record ingestion source, imported time, source reference, actor, and affected record counts.
- Surface the latest ingestion evidence in admin data ingestion and audit evidence routes.
- Keep browser-local demo state out of pilot source-of-truth claims.

Implementation direction:

- Prefer a CLI or API-backed import path that writes through the Go API/store layer.
- For this phase, a controlled CSV/JSON import path is enough if it records provenance and validation failures.
- Avoid building a streaming ETL or third-party integration adapter.

## Provenance, Freshness, Confidence, And Review State

Purpose: make operational data safe to interpret.

Required behavior:

- Clinic status, field reports, district review, admin reporting coverage, data ingestion, audit evidence, and partner export surfaces show whether data is imported, field-submitted, demo-seeded, reviewed, pending, rejected, stale, or needs confirmation.
- Stale or unreviewed data must not look equivalent to reviewed current data.
- Data cards and tables should expose enough context to explain trust state without forcing users into raw audit logs.
- Export and partner evidence must include the data scope and freshness assumptions.

Recommended model:

- `source`: `seeded_demo`, `pilot_import`, `field_report`, `system_reconciliation`, or `partner_export`.
- `freshness`: `fresh`, `needs_confirmation`, `stale`, or `unknown`.
- `reviewState`: `reviewed`, `pending_review`, `rejected`, `not_required`, or `unknown`.
- `confidence`: `high`, `medium`, `low`, or `unknown`.
- `lastVerifiedAt`: timestamp when the status/report was reviewed, imported, or reconciled.
- `evidenceHref`: route to the relevant clinic, review, audit, ingestion, or export evidence.

The implementation does not need to persist every field if a deterministic view model can derive it from existing data. Persist only what cannot be derived reliably.

## Offline Queue And Sync Integrity

Purpose: make field reporting reliable enough for real-world low-connectivity use.

Required behavior:

- Field workers can see queued, syncing, synced, conflict, duplicate, validation failed, and retryable failed states.
- Sync attempts use idempotency so repeated submissions do not create duplicate reports.
- Conflict handling tells the user whether the report was accepted, rejected, duplicated, or needs district review.
- Admin data ingestion shows aggregate sync health and recent failures.
- District review receives only valid reports and can distinguish newly synced reports from stale or duplicate submissions.

Implementation direction:

- Use `report_sync_attempts` and existing report review state first.
- Add client-visible queue receipts where needed.
- Prefer deterministic retry state over hidden background magic.
- If offline storage is browser-local, label it clearly and keep server state authoritative after sync.

## Background Processing Direction

Purpose: define reliable processing without overbuilding infrastructure.

Required behavior:

- Stale reconciliation can be triggered and its results are auditable.
- Export generation records scope, checksum, requester, created time, and source freshness assumptions.
- Webhook delivery/test attempts record success and failure evidence.
- Retryable sync or delivery failures are visible to admins.

Implementation direction:

- Phase 3 may use explicit API-triggered jobs or command-style worker entrypoints.
- Any job must be idempotent, auditable, and safe to rerun.
- Do not add Redis, queues, cron orchestration, or external workers unless the current code cannot meet pilot trust requirements without them.
- Phase 4 can replace command-triggered jobs with production observability and scheduling.

## Placeholder Route Policy

Purpose: avoid shipping pilot routes that imply unfinished functionality is safe.

Required behavior:

- Inventory routes that still render `ModulePlaceholderPage` or placeholder copy.
- For each route, choose one of three outcomes:
  - Complete it with pilot-safe content.
  - Hide it from authenticated navigation and public demo maps.
  - Replace it with explicit roadmap copy that is not part of the pilot path.
- Pilot-critical routes must not show generic implementation-placeholder text.

Pilot-critical routes include:

- `/field`
- `/field/submit-report`
- `/field/sync-queue`
- `/field/drafts-sync`
- `/district`
- `/admin/reporting-coverage`
- `/admin/audit-evidence`
- `/admin/data-ingestion`
- `/admin/security`
- `/admin/tenant-health`
- `/admin/partner-readiness`

Demo-only routes can remain if they are clearly marked as demo/sandbox and not presented as pilot operations.

## Privacy, Terms, And Safety Surfaces

Purpose: make pilot boundaries explicit before users act.

Required behavior:

- Public privacy page explains what data the product expects, what is demo/local versus pilot-operational, and what is not yet a compliance certification.
- Public terms page explains acceptable pilot use, account responsibility, and limits of operational guidance.
- Safety/disclaimer page explains that clinic availability and rerouting guidance require human confirmation before real-world patient movement.
- Auth, field reporting, district operations, public finder, exports, and partner readiness routes link to the relevant safety/privacy surfaces where decisions may affect real people.
- Copy must be clear and conservative. It should not claim legal compliance, clinical certification, or emergency-service suitability.

## UX Rules

- Trust labels must be compact and visible near the data they describe.
- Avoid large legal banners on every screen; use targeted inline safety notes and persistent footer/auth links.
- Tables should expose source, freshness, review state, and latest evidence columns where those attributes matter.
- Empty states should explain whether no data exists, data is hidden by scope, or ingestion has not run.
- Error states should say whether data is unavailable versus not trustworthy.
- Mobile must remain usable for field and district flows.
- Admin modules can remain optimized for desktop repeat work.

## API And Documentation Direction

Update API and docs only when behavior changes.

Likely documentation updates:

- `docs/api.md`: ingestion, sync, reconciliation, export, webhook, and safety-relevant endpoint behavior.
- `docs/database-schema.md`: provenance, freshness, review, sync attempt, and audit evidence assumptions.
- `docs/architecture.md`: pilot data trust flow.
- `docs/deployment.md`: any command-triggered job or ingestion runbook.
- `docs/release.md`: Phase 3 pilot data integrity gate.
- `docs/production-readiness-execution-plan.md`: mark Phase 3 planned/in-progress/complete during the phase lifecycle.

## Testing Requirements

Unit tests:

- Provenance/freshness/review-state view models.
- Offline queue and sync state classification.
- Placeholder route inventory helpers if implemented.
- Safety/legal link mapping.
- API client request/response contracts for any new endpoints.

Go tests:

- Ingestion validation, provenance recording, and audit creation.
- Sync idempotency, duplicate detection, validation failure, and retry classification.
- Stale reconciliation idempotency and audit evidence.
- Export/webhook evidence updates if touched.
- Handler auth, role scoping, and response shapes for new or changed endpoints.

E2E tests:

- Reporter can see queued/synced/failed states for field reports.
- District manager can distinguish pending, reviewed, stale, and imported/field-submitted data.
- Admin can inspect ingestion, sync failure, audit, and safety evidence.
- Placeholder copy does not appear on pilot-critical routes.
- Privacy, terms, and safety pages are reachable from auth and pilot-relevant flows.
- Mobile field flow remains usable.

Release gates:

```bash
npm ci
make verify
make test-e2e
make verify-security
make test-api-container
git status --short
```

Targeted development commands should be added to the implementation plan for each task.

## Completion Criteria

Phase 3 is complete when:

- Pilot users can tell whether operational data is imported, field-submitted, demo-seeded, reviewed, pending, rejected, stale, or needs confirmation.
- Field sync failures, conflicts, duplicates, validation failures, and retry states are visible where users need them.
- Ingestion and background-style processing leave auditable evidence.
- Pilot-critical routes no longer expose generic placeholder implementation copy.
- Privacy, terms, and safety boundaries are linked from relevant flows.
- Documentation records pilot source-of-truth and trust-state assumptions.
- CI and release gates pass.
- `docs/production-readiness-execution-plan.md` points to Phase 4 - Observability And Operations as the next phase.

## Risks

- The phase can expand into a full data platform. Keep ingestion controlled and documented.
- Browser-local offline behavior can be mistaken for authoritative server state. Label queued and unsynced states explicitly.
- Safety copy can sound like legal certification. Keep it conservative and factual.
- Background processing can become infrastructure work. Use idempotent command-triggered jobs unless true scheduling is necessary.
- Placeholder removal can become broad UX redesign. Only pilot-critical routes must be completed or hidden in this phase.
