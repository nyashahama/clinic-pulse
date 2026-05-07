# Incident Replay Design

## Goal

Add a one-click district console replay that animates one clinic incident through the operating chain:

1. field report received
2. district alert created
3. patient reroute recommended
4. audit event recorded
5. partner webhook dispatched

The replay should make the demo feel like a connected operating system, not a set of disconnected panels.

## Current Context

The existing app already has the major surfaces and data shapes:

- `lib/demo/scenarios.ts` creates reports, alerts, status changes, and audit events.
- `lib/demo/demo-store.tsx` owns browser-visible demo state through reducer actions.
- `app/(demo)/demo/page-client.tsx` wires demo controls, report stream, alert queue, clinic table, map, selected-clinic panel, and reroute state.
- `components/demo/demo-controls.tsx` exposes one-click scenario actions.
- `components/demo/report-stream.tsx`, `components/demo/alert-list.tsx`, and `components/demo/clinic-side-panel.tsx` already show report, alert, and reroute evidence.
- `components/demo/audit-trail.tsx` already understands `routing.alternative_recommended`.
- `app/(demo)/admin/actions.ts` and the Go API support partner webhook creation/testing, but that path requires admin auth and backend partner setup.

The replay should therefore be a local deterministic demo workflow in the district console, with a partner webhook preview step that mirrors backend webhook event data instead of requiring a live webhook subscription.

## Scope

In scope:

- Add a "Replay incident" one-click action to the district console controls.
- Animate five ordered steps with clear active/completed states.
- Mutate demo state progressively so existing surfaces visibly update as the replay advances.
- Select and keep open the incident clinic while the replay runs.
- Mark reroute state active at the reroute step.
- Record audit evidence for reroute and partner webhook steps.
- Show a compact webhook payload/status card in the replay panel.
- Prevent overlapping replays.
- Allow reset to clear active replay UI through existing reset behavior.

Out of scope:

- Sending real webhook HTTP deliveries.
- Creating partner webhook subscriptions from `/demo`.
- Persisting replay progress across reloads.
- Adding new backend API routes.
- Replacing existing stockout/staffing/offline scenario controls.

## Recommended Approach

Use a pure replay model plus a small UI orchestrator.

Create `lib/demo/incident-replay.ts` as the source of truth for:

- replay step IDs, labels, summaries, and durations
- fixed incident clinic selection
- deterministic replay timestamps
- per-step state transitions
- webhook preview payload

Extend `DemoState` with an optional `incidentReplay` evidence object only if the UI needs to render webhook details from store state. Otherwise keep replay animation state in `app/(demo)/demo/page-client.tsx` and only commit durable operating evidence into `reports`, `alerts`, `auditEvents`, and `clinicStates`. The first implementation should avoid expanding `DemoState` unless tests show prop drilling gets awkward.

Add one reducer action:

```ts
| { type: "apply_incident_replay_step"; stepId: IncidentReplayStepId; now: string }
```

This action calls `applyIncidentReplayStep(state, stepId, now)` from `lib/demo/incident-replay.ts`. The page client owns timers and active step index; the store owns durable report/alert/audit changes.

## UX Design

Place the replay inside the existing `DemoControls` card as a primary "Replay incident" action. When clicked:

- disable the button while replaying
- select `STOCKOUT_TRIGGER_CLINIC_ID`
- open the clinic side panel
- clear any stale replay timers
- start a visible replay timeline below the controls

The replay timeline should be a dense operational component, not a marketing hero. Use a compact bordered section named `IncidentReplayPanel` with five rows:

- `Field report`
- `District alert`
- `Reroute`
- `Audit event`
- `Partner webhook`

Each row shows:

- icon
- label
- short evidence summary
- status badge: `Queued`, `Live`, `Complete`
- timestamp once completed

The active row should use a restrained accent border/background. Completed rows should show a check icon and timestamp. The webhook step should reveal a compact payload preview with:

- event type: `clinic.status_changed`
- clinic id/name
- status
- recommended alternative
- delivery status: `Delivered preview`

The replay must not use visible instructional copy such as keyboard shortcuts or "how this works." The component should let the sequence speak through labels and evidence.

## Data Flow

Clicking "Replay incident":

1. Page client initializes replay UI state:
   - `status: "running"`
   - `activeStepId: "field_report"`
   - `completedStepIds: []`
   - fixed `startedAt`
2. Page dispatches `applyIncidentReplayStep("field_report", timestamp)`.
3. A timer advances through each step every 850-1100 ms.
4. On each step, page dispatches `applyIncidentReplayStep(stepId, timestamp)`.
5. After `partner_webhook`, replay status becomes `complete`.

State mutations:

- `field_report`: insert a `ReportEvent`, update current clinic state to degraded/non-functional incident state.
- `district_alert`: insert or replace one open stockout alert for the clinic.
- `reroute`: insert a `routing.alternative_recommended` audit event and set page `rerouteClinicId` to the source clinic.
- `audit_event`: insert an explicit audit event summarizing the incident replay evidence chain.
- `partner_webhook`: insert a `partner.webhook_dispatched` audit event and expose a webhook preview payload in the replay panel.

The source clinic should be `STOCKOUT_TRIGGER_CLINIC_ID`. The recommended alternative should be resolved through existing `getAlternativeClinics(state, sourceClinicId, primaryService)[0]` behavior so the replay remains aligned with current routing rules.

## Types

Add:

```ts
export type IncidentReplayStepId =
  | "field_report"
  | "district_alert"
  | "reroute"
  | "audit_event"
  | "partner_webhook";

export type IncidentReplayStep = {
  id: IncidentReplayStepId;
  label: string;
  summary: string;
  durationMs: number;
};

export type IncidentReplayWebhookPreview = {
  eventType: "clinic.status_changed";
  deliveryStatus: "delivered_preview";
  clinicId: string;
  clinicName: string;
  status: string;
  recommendedAlternativeName: string | null;
  dispatchedAt: string;
  payload: Record<string, unknown>;
};
```

Extend `AuditEvent["eventType"]` with:

```ts
| "partner.webhook_dispatched"
```

Update `components/demo/audit-trail.tsx` so the new event type has a label and response tone.

## Error Handling

This feature should not fail because of backend availability. If no compatible alternative exists, the reroute step still completes with summary copy:

`No compatible alternative available; district operator must coordinate manually.`

If the replay is clicked while already running, ignore the second click. If the component unmounts, clear timers. Reset should clear active replay UI and return store state to the reset baseline.

## Testing Strategy

Unit tests:

- `lib/demo/incident-replay.test.ts`
  - verifies replay step order
  - verifies `field_report` inserts report and updates clinic state
  - verifies `district_alert` creates one open stockout alert
  - verifies `reroute` writes `routing.alternative_recommended`
  - verifies `partner_webhook` writes `partner.webhook_dispatched`
  - verifies webhook preview payload includes clinic, status, and alternative

- `lib/demo/scenarios.test.ts`
  - keep existing scenario tests green

- `lib/demo/demo-store.test.ts`
  - verifies the store exposes/apply replay action through reducer-level helpers if exported

Source-boundary or component tests:

- Add a small source-boundary test if render tooling is not present:
  - `DemoControls` includes `Replay incident`
  - `DistrictConsolePage` passes `replayIncident` and renders `IncidentReplayPanel`
  - `AuditTrail` handles `partner.webhook_dispatched`

E2E:

- Extend `tests/e2e/phase-one-smoke.spec.ts` to click `Replay incident` on `/demo` and expect:
  - `Incident replay` panel visible
  - `Partner webhook` row reaches complete/delivered preview
  - selected clinic panel remains visible

Verification:

```bash
npm test -- lib/demo/incident-replay.test.ts lib/demo/scenarios.test.ts
npm test -- lib/demo/demo-store.test.ts
npm run lint
npm run build
```

Run Playwright smoke when the backend test database is available:

```bash
npm run test:e2e
```

## Acceptance Criteria

- `/demo` has one visible "Replay incident" action.
- One click animates the five-step chain in order.
- Existing report stream, alert queue, selected clinic panel, reroute state, and audit evidence reflect the replay.
- The partner webhook step shows delivered preview evidence without requiring real webhook delivery.
- Replay cannot overlap itself.
- Reset clears replay UI and state.
- Unit tests and build pass.

## Open Decision Resolved

The first implementation should be local and deterministic. Real webhook delivery should remain a later backend-backed enhancement because the current user-facing goal is a high-confidence demo moment, and requiring partner setup would make the one-click path fragile.
