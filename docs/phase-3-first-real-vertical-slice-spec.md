# Phase 3 First Real Vertical Slice Spec

Date: 2026-05-11
Status: Draft for implementation planning

## Goal

Phase 3 turns ClinicPulse's strongest demo loop into a real product workflow:

```text
Field report submission
-> API/Postgres persistence
-> district review and status update
-> audit evidence
-> admin review context
```

The product should still keep `/demo` as a controlled showcase route, but `/field`, `/district`, and `/admin` should prove that the same operating record can move across roles using the Go API and Postgres as the source of truth.

## Product Decision

Phase 3 is a **vertical slice**, not a role expansion or broad dashboard rebuild.

ClinicPulse will keep the four active authenticated roles documented in [Product Role Model Decision](./product-role-model-decision.md):

- Reporter
- District manager
- Organisation admin
- System admin

Deferred personas such as clinic coordinator, partner/API user, public user, and founder/admin should not become new authenticated workspaces in this phase. Their future value is represented through the slice:

- clinic coordinator remains a future confirmation workflow,
- partner/API user remains partner readiness and export evidence under admin,
- public user consumes accepted clinic availability through public finder and clinic pages,
- founder/admin remains demo/showcase control, not a production role.

## Current Foundation

Phase 3 should reuse existing backend primitives instead of adding new schema first:

- `POST /v1/reports` creates a pending report.
- `POST /v1/reports/offline-sync` syncs queued field reports as pending reports.
- `GET /v1/reports/pending` lists reports waiting for review.
- `POST /v1/reports/{reportId}/review` accepts or rejects a pending report.
- Accepted reports update `current_status`.
- Rejected reports do not update `current_status`.
- Report submission and review write audit events.
- Report review scope is already role-aware for district manager, organisation admin, and system admin.

The missing product work is mainly in the Next.js layer: typed client helpers, server loaders/actions, review UI, and E2E proof that the handoff works across roles.

## Reference Inventory And Inspiration

Phase 3 is a product workflow phase, so existing ClinicPulse decisions are the strongest reference. External references should shape review density, empty states, and admin/governance ergonomics without changing ClinicPulse's role model or route direction.

### Existing ClinicPulse Product Direction

Local sources:

- `docs/product-roadmap.md`
- `docs/product-role-model-decision.md`
- `docs/phase-1-role-ui-ux-blueprint-spec.md`
- `docs/phase-2-product-shell-design-system-spec.md`

Use:

- Four-role product boundary.
- `/field`, `/district`, and `/admin` as product homes.
- `/demo` as showcase/sandbox.
- Product shell and product component namespace introduced in Phase 2.

Decision:

- These local documents override external UI references when there is a conflict.

### shadcn-admin

Local path:

- `reference-projects/shadcn-admin/src/components/layout/data/sidebar-data.ts`
- `reference-projects/shadcn-admin/src/features/dashboard/index.tsx`
- `reference-projects/shadcn-admin/src/features/users/components/users-table.tsx`

Public source checked:

- `https://www.shadcn.io/template/satnaing-shadcn-admin`

Use:

- Dense admin dashboard rhythm.
- Grouped actions inside an existing workspace shell.
- Table/list behavior for queues that must remain scannable.

Do not copy:

- Generic SaaS labels.
- TanStack Router assumptions.
- Unrelated users/settings workflows.

### OpenPanel

Local path:

- `reference-projects/openpanel/apps/start/src/components/full-page-empty-state.tsx`
- `reference-projects/openpanel/apps/start/src/components/skeleton-dashboard.tsx`
- `reference-projects/openpanel/apps/start/src/components/widget-table.tsx`

Public sources checked:

- `https://github.com/Openpanel-dev/openpanel`
- `https://openpanel.com/docs/admin/dashboard/`

Use:

- Console-style summary widgets.
- Empty/loading states that still feel operational.
- Compact table and widget density for admin evidence.

Do not copy:

- Analytics-specific project model.
- Billing or organization settings patterns.
- Data-query architecture.

### Appwrite Console

Local path:

- `reference-projects/appwrite-console/src/lib/components/filters/*`
- `reference-projects/appwrite-console/src/lib/components/permissions/*`
- `reference-projects/appwrite-console/src/lib/components/empty*.svelte`

Public source checked:

- `https://github.com/appwrite/console`

Use:

- Governance and permission surface inspiration.
- Admin backstop review framing.
- Empty-state and filter ergonomics.

Do not copy:

- Svelte implementation.
- Appwrite-specific product terms.
- A separate role or permission model.

## Scope

Phase 3 covers:

- Typed frontend API helpers for pending reports and report review.
- Product-level report review view models and summary helpers.
- Server-side loaders for pending reports using the authenticated session cookie.
- A district review queue on `/district` that shows pending reports and lets allowed users accept or reject them.
- Admin evidence context on `/admin` showing pending review pressure and recent report/audit evidence.
- Reporter feedback on `/field` that makes submitted reports feel real and pending review, not just locally added demo state.
- E2E coverage proving reporter -> district -> admin handoff.
- Documentation updates for the Phase 3 workflow.

Phase 3 does not cover:

- New roles.
- New database tables unless implementation finds a hard blocker in the existing schema.
- Dedicated clinic coordinator workspace.
- Dedicated partner/API portal.
- Public finder redesign beyond confirming it reflects accepted status.
- Bulk route-group renaming.
- Replacing the product shell or dashboard primitives from Phase 2.

## Source Of Truth

For product routes, API/Postgres should be the source of truth.

Seeded demo fallback remains allowed only as demo resilience where the existing app already supports it. Product copy should not imply that fallback data is production truth.

The expected report lifecycle is:

1. Reporter submits from `/field`.
2. Backend stores the report with `reviewState: "pending"`.
3. `/district` shows the report in a review queue.
4. District manager accepts or rejects the report.
5. If accepted, backend updates `current_status` and writes audit evidence.
6. `/district`, clinic evidence, `/admin`, and public availability surfaces can reflect the accepted status after refresh.

## User Experience Requirements

### Reporter

The reporter flow should remain form-first.

Required behavior:

- Reporter selects an assigned clinic and submits status, staffing, stock, queue, and notes.
- Online submissions call the real server action and API.
- Successful online submission shows copy that the report is pending district review.
- Offline submissions remain queued locally and sync through the existing offline-sync path.
- Recent reports should distinguish pending, accepted, and rejected where that state is available.

Reporter should not get a dashboard-heavy review screen. Their job is submission and sync confidence.

### District Manager

The district manager owns the first operational review.

Required behavior:

- `/district` shows pending reports scoped to the district manager's access.
- Each pending item shows clinic, reporter/source, submitted time, status signal, reason, pressure values, offline/online source, and review state.
- District manager can accept or reject a pending report.
- Accepting a report updates the current clinic status after server refresh.
- Rejecting a report keeps the report audit-visible but does not change current clinic status.
- The review queue should sit inside the command workflow, not in a separate placeholder route.

This is the most important Phase 3 surface.

### Organisation Admin

Organisation admin sees evidence and governance context, not a duplicate district command queue.

Required behavior:

- `/admin` shows pending report pressure and review status as part of readiness/governance.
- Admin can see reports that have moved through review and the audit evidence that proves who acted.
- Admin may accept or reject pending reports if the existing API role rules allow it, but the UI should frame this as governance/backstop review rather than the primary operational path.

### System Admin

System admin sees platform control-plane evidence.

Required behavior:

- `/admin` for system admin shows ingestion/review pressure and audit posture.
- System admin may use the same review action as a control-plane backstop.
- Copy should make system admin feel different from organisation admin: platform health, ingestion, security, audit posture.

### Demo Route

`/demo` remains a founder/showcase sandbox.

Phase 3 should not remove demo controls, scenario triggers, or seeded replay behavior. If product review components are reused in `/demo`, they must not make `/demo` the canonical operational destination.

## Data Flow

```text
Reporter UI
  -> app/(demo)/field/actions.ts
  -> lib/demo/api-client.ts createReport()
  -> Go API POST /v1/reports
  -> reports row review_state=pending
  -> report.submitted audit event

District UI
  -> server loader fetchPendingReports()
  -> review action POST /v1/reports/{reportId}/review
  -> report_reviews row
  -> reports.review_state accepted/rejected
  -> current_status updated only for accepted
  -> report.reviewed audit event

Admin UI
  -> server loader fetchPendingReports(), operational hydration, audit events
  -> readiness/evidence panels summarize review pressure and audit state
```

## Component Boundary

Use product-neutral components for review primitives where possible:

- report review queue,
- report review summary,
- review state badges,
- evidence rows.

Demo-specific scenario controls, replay, seeded alerts, and showcase copy stay under `components/demo/*`.

Product components must not import from `components/demo/*` or `lib/demo/*` except through explicitly allowed typed props. If a component needs demo state directly, it belongs in `components/demo/*`.

## Error And Empty States

Required states:

- No pending reports: calm empty state that tells district users the queue is clear.
- API load failure: use seeded fallback only where the existing fallback rules allow it; otherwise show an actionable error.
- Review conflict: if a report was already reviewed, refresh and show that the item is no longer pending.
- Forbidden review: show role/scope copy without exposing protected data.
- Network failure on review action: keep the item visible and ask the user to retry.

## Testing Requirements

Unit tests:

- API client builds `GET /v1/reports/pending`.
- API client builds `POST /v1/reports/{reportId}/review`.
- Review view-model helpers summarize pending reports and map clinics safely.
- Server hydration returns an empty pending list for reporter and calls the API for district/admin roles.

Existing backend tests already cover the planned API behavior. Backend tests stay unchanged for this phase plan unless a future implementation task introduces a backend behavior change; that task must add the matching backend test.

E2E test:

```text
reporter logs in
-> submits a degraded/non-functional report
-> district manager logs in
-> sees report in pending review queue
-> accepts the report
-> district page reflects updated status/evidence
-> org admin logs in
-> sees review/audit evidence in admin workspace
```

Run the E2E in desktop first. Add mobile coverage if the review queue introduces mobile-specific layout risk.

Verification before merge:

- `npm test`
- `npm run lint`
- `npm run build`
- `cd services/api && go test ./...`
- targeted Phase 3 E2E
- existing role-navigation E2E

## Acceptance Criteria

Phase 3 is complete when:

- A reporter-submitted report is persisted as pending through the API.
- District manager can review the pending report from `/district`.
- Accepted review updates clinic current status.
- Rejected review leaves current status unchanged.
- Audit evidence shows submission and review events.
- Admin workspace exposes review/evidence context.
- `/demo` remains available as showcase/sandbox.
- No new authenticated roles are introduced.
- Unit, lint, build, API tests, and targeted E2E pass.

## Deferred Work

- Clinic coordinator confirmation workflow.
- Dedicated partner/API portal.
- Public finder redesign.
- Report review assignment, comments, bulk actions, or SLA timers.
- Alert generation from accepted report transitions.
- Generated OpenAPI/client code.
- Full route-group rename away from `app/(demo)`.
