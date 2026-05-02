# ClinicPulse Phase 1 Demo Hardening Design Spec

## Decision

Phase 1 should harden the existing frontend demo into a credible founder-led product walkthrough.

The current repo already contains the right demo surfaces: landing page, district console, field reporting flow, public finder, clinic detail page, admin deck, seeded clinic data, local state changes, offline queue simulation, audit events, alerts, and rerouting logic. Phase 1 should not start the Go backend or PostgreSQL work. It should make the current demo reliable, honest, testable, and strong enough to show to YC-style evaluators, health officials, NGO partners, and pilot prospects.

The Phase 1 operating promise is:

> In seven minutes, a viewer should understand that ClinicPulse can collect a clinic status report, update district visibility, route around unavailable clinics, and preserve trust through freshness and audit history.

## Current Context

The project is a Next.js 16.2.4 App Router app using React 19.2.4, TypeScript, Tailwind CSS 4, motion, lucide-react, and local demo state.

Important implemented files:

- `app/(demo)/demo/page-client.tsx` renders the district console with status summary, map, clinic table, report stream, side panel, and demo controls.
- `app/(demo)/field/page.tsx` renders the mobile-style field reporting flow with online/offline mode and local queued reports.
- `app/(demo)/finder/page-client.tsx` and `components/demo/clinic-finder.tsx` render the public finder and reroute recommendations.
- `app/(demo)/admin/page-client.tsx` renders founder operations, demo leads, exports, API preview, and roadmap modules.
- `lib/demo/demo-store.tsx` owns client-side demo state and local storage hydration.
- `lib/demo/scenarios.ts` owns state transitions for stockout, staffing shortage, field reports, and offline sync.
- `lib/demo/selectors.ts` owns derived clinic rows, alternatives, alerts, counts, reports, and audit events.
- `docs/demo/frontend-ui-demo-map.md` documents the current route map and basic demo script.

Fresh verification from the planning pass:

- `npm run build` exits successfully.
- `npm run lint` exits with zero errors and two warnings in `components/landing/scenario-hero.tsx`.
- No automated test files were found.
- No backend routes, database migrations, Go service, or API persistence are present.

## Goals

- Make the demo narratively coherent around one operational incident.
- Make every demo route load with seeded data and a clear role in the pitch.
- Make state transitions reliable enough for repeated founder demos.
- Keep every production-sensitive claim honest by labeling demo-seeded data.
- Show freshness, source, and uncertainty anywhere clinic status appears.
- Give the field reporting and public finder flows enough polish to feel usable, not decorative.
- Add focused tests for the demo domain logic so scenario behavior does not regress.
- Add a founder runbook with the exact route sequence, talking points, reset steps, and acceptance checks.
- Keep the implementation frontend-only and preserve the future API shape for Phase 2.

## Non-Goals

- No Go backend.
- No PostgreSQL database.
- No production authentication.
- No real DHIS2, WhatsApp, SMS, maps, directions, or government integration.
- No patient medical records, billing, claims, or NHI workflows.
- No attempt to present seeded demo data as live production usage.
- No large visual redesign of the whole application.

## Primary Demo Narrative

Use one concrete incident as the spine of the demo:

1. A district manager opens `/demo` and sees the Tshwane North demo district.
2. A stockout or staffing shortage changes one clinic from operational/degraded to degraded/non-functional.
3. The console updates status counts, map pins, side panel, alert list, and report stream.
4. The founder opens `/field`, queues or submits a five-field report, and syncs it back into the district state.
5. The founder opens `/finder`, selects the affected clinic, and shows alternatives with service compatibility, freshness, and distance.
6. The founder opens the clinic detail page and shows why the status is trusted: latest report, reason, source, freshness, audit trail, and alternatives.
7. The founder opens `/admin` and shows the export/API preview as evidence that this can become infrastructure.
8. The founder closes with `/book-demo` as the conversion path.

This flow must work after a reset without hand-editing local storage or relying on lucky state.

## Approach Options

### Option A: Demo Hardening First

Harden the current frontend-only demo, add tests for pure demo logic, fix lint warnings, improve route loading states, update the demo runbook, and verify all routes.

Tradeoff: It does not create a real backend, but it produces the strongest near-term stakeholder proof.

### Option B: Backend Foundation First

Start the Go API, PostgreSQL schema, report endpoints, and persistence layer now.

Tradeoff: This is strategically necessary, but it delays demo quality and creates more moving parts before the product story is reliably proven.

### Option C: Visual Redesign First

Spend Phase 1 on richer UI animation, map visuals, copy, and landing/demo polish without adding test coverage.

Tradeoff: It may look better in screenshots, but it does not reduce the risk of live-demo failures.

## Recommended Approach

Use Option A.

The existing demo is already broad enough. The next risk is not feature count; it is whether the founder can run the same proof cleanly, repeatedly, and honestly. A hardened demo gives immediate evidence for stakeholder conversations while creating a safer base for the real backend in Phase 2.

## Phase 1 Scope

### Demo Integrity

The demo must make clear which parts are simulated:

- The landing and app surfaces should use language such as `demo data`, `seeded reports`, `mock export`, and `API preview`.
- The admin/export/API surfaces should show future platform shape without implying partner integrations are active.
- The docs must state that all current app data is local mock state plus local storage.

### Scenario Reliability

The stockout, staffing shortage, offline queue, report submit, and sync actions must produce visible changes in the relevant surfaces:

- Status summary counts change when a scenario changes a clinic status.
- Map and table reflect the selected clinic state.
- Alerts are created or resolved in a predictable way.
- Report stream shows newly submitted or synced reports.
- Audit trail explains what changed and who or what triggered it.
- Finder and clinic detail views can show routing alternatives for unavailable clinics.

### Finder And Routing Quality

The public finder is a critical demo moment. It should not merely list clinics; it should explain routing decisions.

Required behavior:

- Search by clinic name, district, facility code, or service.
- Filter by status and service through query parameters.
- Keep selected clinic behavior coherent when filters change.
- Mark non-functional, unknown, stale, and needs-confirmation clinics as needing a reroute.
- Rank alternatives using operational status, freshness, service compatibility, and distance.
- Show why the selected alternative is recommended.

### Loading And Navigation Feedback

The demo routes should feel responsive in a live walkthrough.

Required behavior:

- Add lightweight `loading.tsx` skeletons for dynamic demo routes that benefit from immediate feedback.
- Keep `Link` for normal route navigation and reserve `useRouter` for event-driven transitions.
- Wrap search-param-dependent Client Components through the existing page/client split or a route-level loading state so production builds remain stable.

This follows the local Next.js 16 docs reviewed during planning:

- `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md`

### Testing

Phase 1 should add focused tests around the demo's domain logic:

- `lib/demo/scenarios.ts`: stockout, staffing shortage, online report submission, offline queue sync.
- `lib/demo/selectors.ts`: status counts, active alert sorting, alternatives filtering and ranking.
- A new finder utility module should be extracted from `components/demo/clinic-finder.tsx` so finder filtering and recommendation logic can be tested without rendering the component.

This is intentionally not a full end-to-end suite. The target is regression protection for the state transitions that make or break the demo.

### Demo Runbook

Add a practical founder runbook under `docs/demo`.

The runbook should include:

- Pre-demo reset steps.
- Seven-minute route sequence.
- Exact actions to click.
- Talking points for each route.
- Failure recovery steps.
- Acceptance checklist.
- Clear statement that Phase 1 is frontend-only.

## File Responsibilities

### Existing Files To Modify

- `components/landing/scenario-hero.tsx`: remove lint warnings and keep the landing hero's scenario evidence honest.
- `components/demo/clinic-finder.tsx`: delegate filtering, unavailable detection, distance estimate, and recommendation construction to a testable utility.
- `docs/demo/frontend-ui-demo-map.md`: update the route map and acceptance checklist to match Phase 1 hardening.
- `package.json`: add test scripts after the test runner is added.
- `package-lock.json`: update lockfile with test dependencies.

### New Files To Create

- `lib/demo/finder.ts`: pure finder and routing helper functions.
- `lib/demo/scenarios.test.ts`: unit tests for scenario state transitions.
- `lib/demo/selectors.test.ts`: unit tests for selector behavior.
- `lib/demo/finder.test.ts`: unit tests for finder filtering and recommendation logic.
- `vitest.config.ts`: test runner configuration for TypeScript, React, and path aliases.
- `docs/demo/phase-1-founder-runbook.md`: founder-facing demo runbook.
- `app/(demo)/demo/loading.tsx`: loading skeleton for the district console route.
- `app/(demo)/finder/loading.tsx`: loading skeleton for the finder route.
- `app/(demo)/clinics/[clinicId]/loading.tsx`: loading skeleton for the clinic detail route.

## Acceptance Criteria

- `npm run lint` exits with zero errors and zero warnings.
- `npm run test` exits successfully.
- `npm run build` exits successfully.
- Every demo route in `docs/demo/frontend-ui-demo-map.md` has a defined role in the founder runbook.
- The founder runbook can be followed from a clean reset without manual local storage editing.
- Finder recommendations are covered by unit tests and show service compatibility plus freshness.
- Scenario transitions are covered by unit tests and visibly update the state objects used by the UI.
- Phase 1 docs clearly state that the demo is frontend-only and seeded.

## Scope Check

This spec is intentionally focused on demo hardening. It does not include backend persistence, auth, deployment, observability, or pilot operations. Those belong in later phase specs after this demo is reliable.
