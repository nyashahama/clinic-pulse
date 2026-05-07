# Incident Replay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a one-click `/demo` incident replay that animates field report → district alert → reroute → audit event → partner webhook.

**Architecture:** Add a pure `lib/demo/incident-replay.ts` workflow model that owns replay steps, deterministic state transitions, and webhook preview payloads. Wire it through `lib/demo/demo-store.tsx`, then let `app/(demo)/demo/page-client.tsx` orchestrate timers and render a compact `IncidentReplayPanel` beside the existing demo controls.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, Playwright, lucide-react, existing ClinicPulse demo store and selector utilities.

---

## File Structure

- Create `lib/demo/incident-replay.ts`
  - Owns replay step definitions, step IDs, fixed source clinic, state transition helpers, and webhook preview builder.
- Create `lib/demo/incident-replay.test.ts`
  - Unit tests for step order, per-step state mutations, and webhook preview.
- Modify `lib/demo/types.ts`
  - Adds `partner.webhook_dispatched` to `AuditEvent["eventType"]`.
- Modify `components/demo/audit-trail.tsx`
  - Adds presentation copy for `partner.webhook_dispatched`.
- Modify `lib/demo/demo-store.tsx`
  - Adds `applyIncidentReplayStep` to store value and reducer.
- Modify `components/demo/demo-controls.tsx`
  - Adds a replay action and disabled/running state.
- Create `components/demo/incident-replay-panel.tsx`
  - Renders active/completed replay stages and webhook preview.
- Create `lib/demo/incident-replay-ui.test.ts`
  - Source-boundary test for UI wiring without adding a React test renderer.
- Modify `app/(demo)/demo/page-client.tsx`
  - Owns replay timers, selected clinic/reroute focus, and panel rendering.
- Modify `tests/e2e/phase-one-smoke.spec.ts`
  - Adds a smoke assertion for the replay flow.

## Task 1: Pure Replay Model

**Files:**
- Create: `lib/demo/incident-replay.test.ts`
- Create: `lib/demo/incident-replay.ts`
- Modify: `lib/demo/types.ts`
- Modify: `components/demo/audit-trail.tsx`

- [ ] **Step 1: Write failing tests for replay step order and field report mutation**

Create `lib/demo/incident-replay.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  applyIncidentReplayStep,
  buildIncidentReplayWebhookPreview,
  incidentReplaySteps,
} from "@/lib/demo/incident-replay";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getAlternativeClinics, getClinicRows } from "@/lib/demo/selectors";

describe("incident replay workflow", () => {
  it("defines the replay in the operating evidence order", () => {
    expect(incidentReplaySteps.map((step) => step.id)).toEqual([
      "field_report",
      "district_alert",
      "reroute",
      "audit_event",
      "partner_webhook",
    ]);
    expect(incidentReplaySteps.every((step) => step.durationMs >= 750)).toBe(true);
  });

  it("applies the field report step as the latest clinic report and status", () => {
    const now = "2026-05-07T08:00:00.000Z";
    const state = applyIncidentReplayStep(
      createInitialDemoState(),
      "field_report",
      now,
    );

    expect(state.reports[0]).toMatchObject({
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
      offlineCreated: false,
      submittedAt: now,
      receivedAt: now,
      status: "non_functional",
      stockPressure: "stockout",
      queuePressure: "high",
    });
    expect(
      state.clinicStates.find((entry) => entry.clinicId === INCIDENT_REPLAY_SOURCE_CLINIC_ID),
    ).toMatchObject({
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      status: "non_functional",
      lastReportedAt: now,
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- lib/demo/incident-replay.test.ts
```

Expected: FAIL because `@/lib/demo/incident-replay` does not exist.

- [ ] **Step 3: Add audit event type**

Modify `lib/demo/types.ts` by adding the event type:

```ts
    | "routing.alternative_recommended"
    | "partner.webhook_dispatched"
    | "lead.demo_requested"
```

- [ ] **Step 4: Implement the minimal replay model**

Create `lib/demo/incident-replay.ts`:

```ts
import { STOCKOUT_TRIGGER_CLINIC_ID } from "@/lib/demo/clinics";
import { getFreshnessFromTimestamp } from "@/lib/demo/freshness";
import { getAlternativeClinics, getClinicRows } from "@/lib/demo/selectors";
import type {
  Alert,
  AuditEvent,
  ClinicCurrentState,
  DemoState,
  ReportEvent,
} from "@/lib/demo/types";

export const INCIDENT_REPLAY_SOURCE_CLINIC_ID = STOCKOUT_TRIGGER_CLINIC_ID;

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

export const incidentReplaySteps: IncidentReplayStep[] = [
  {
    id: "field_report",
    label: "Field report",
    summary: "Field worker submits a verified stockout report.",
    durationMs: 900,
  },
  {
    id: "district_alert",
    label: "District alert",
    summary: "District queue receives a critical stockout alert.",
    durationMs: 900,
  },
  {
    id: "reroute",
    label: "Reroute",
    summary: "ClinicPulse recommends the nearest compatible alternative.",
    durationMs: 1000,
  },
  {
    id: "audit_event",
    label: "Audit event",
    summary: "The operating decision is written to the audit trail.",
    durationMs: 850,
  },
  {
    id: "partner_webhook",
    label: "Partner webhook",
    summary: "Partner webhook payload is dispatched as a delivered preview.",
    durationMs: 950,
  },
];

function buildId(prefix: string, stepId: IncidentReplayStepId) {
  return `${prefix}-incident-replay-${stepId}`;
}

function cloneState(state: DemoState): DemoState {
  return {
    ...state,
    clinics: state.clinics.map((clinic) => ({ ...clinic, services: [...clinic.services] })),
    clinicStates: state.clinicStates.map((clinicState) => ({ ...clinicState })),
    reports: state.reports.map((report) => ({ ...report })),
    alerts: state.alerts.map((alert) => ({ ...alert })),
    auditEvents: state.auditEvents.map((event) => ({ ...event })),
    leads: state.leads.map((lead) => ({ ...lead })),
    offlineQueue: state.offlineQueue.map((report) => ({ ...report })),
  };
}

function upsertClinicState(
  clinicStates: ClinicCurrentState[],
  nextState: ClinicCurrentState,
) {
  const index = clinicStates.findIndex((entry) => entry.clinicId === nextState.clinicId);
  if (index === -1) {
    return [nextState, ...clinicStates];
  }

  const copy = [...clinicStates];
  copy[index] = nextState;
  return copy;
}

function addAuditEvent(
  auditEvents: AuditEvent[],
  stepId: IncidentReplayStepId,
  eventType: AuditEvent["eventType"],
  summary: string,
  createdAt: string,
) {
  return [
    {
      id: buildId("audit", stepId),
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      actorName: "Incident replay",
      eventType,
      summary,
      createdAt,
    },
    ...auditEvents.filter((event) => event.id !== buildId("audit", stepId)),
  ];
}

function getSourceClinic(state: DemoState) {
  return getClinicRows(state).find((clinic) => clinic.id === INCIDENT_REPLAY_SOURCE_CLINIC_ID);
}

function getRecommendedAlternative(state: DemoState) {
  const sourceClinic = getSourceClinic(state);
  const primaryService = sourceClinic?.services[0];
  if (!primaryService) {
    return null;
  }

  return getAlternativeClinics(state, sourceClinic.id, primaryService)[0] ?? null;
}

function applyFieldReportStep(state: DemoState, now: string): DemoState {
  const currentState = state.clinicStates.find(
    (entry) => entry.clinicId === INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  );
  if (!currentState) {
    return state;
  }

  const report: ReportEvent = {
    id: buildId("report", "field_report"),
    clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
    reporterName: "Nomsa Dlamini",
    source: "field_worker",
    offlineCreated: false,
    submittedAt: now,
    receivedAt: now,
    status: "non_functional",
    reason: "Field report confirms essential medicines are unavailable and pharmacy dispensing has paused.",
    staffPressure: currentState.staffPressure,
    stockPressure: "stockout",
    queuePressure: "high",
    notes: "Incident replay report: pharmacy stockout requires immediate district reroute.",
  };

  const nextClinicState: ClinicCurrentState = {
    ...currentState,
    status: report.status,
    reason: report.reason,
    freshness: getFreshnessFromTimestamp(now, new Date(now)),
    lastReportedAt: now,
    reporterName: report.reporterName,
    source: report.source,
    stockPressure: report.stockPressure,
    queuePressure: report.queuePressure,
  };

  return {
    ...cloneState(state),
    reports: [report, ...state.reports.filter((entry) => entry.id !== report.id)],
    clinicStates: upsertClinicState(state.clinicStates, nextClinicState),
    auditEvents: addAuditEvent(
      state.auditEvents,
      "field_report",
      "report.submitted",
      "Incident replay field report received from Nomsa Dlamini.",
      now,
    ),
  };
}

function applyDistrictAlertStep(state: DemoState, now: string): DemoState {
  const alert: Alert = {
    id: buildId("alert", "district_alert"),
    clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
    type: "stockout",
    severity: "critical",
    status: "open",
    recommendedAction:
      "Route patients to the nearest stocked clinic and notify district pharmacy operations.",
    createdAt: now,
  };

  return {
    ...cloneState(state),
    alerts: [
      alert,
      ...state.alerts.filter(
        (entry) =>
          entry.id !== alert.id &&
          !(entry.clinicId === alert.clinicId && entry.type === alert.type),
      ),
    ],
    auditEvents: addAuditEvent(
      state.auditEvents,
      "district_alert",
      "alert.created",
      "Critical district stockout alert created from replay report.",
      now,
    ),
  };
}

function applyRerouteStep(state: DemoState, now: string): DemoState {
  const alternative = getRecommendedAlternative(state);
  const summary = alternative
    ? `Reroute recommended to ${alternative.name}.`
    : "No compatible alternative available; district operator must coordinate manually.";

  return {
    ...cloneState(state),
    auditEvents: addAuditEvent(
      state.auditEvents,
      "reroute",
      "routing.alternative_recommended",
      summary,
      now,
    ),
  };
}

function applyAuditEventStep(state: DemoState, now: string): DemoState {
  return {
    ...cloneState(state),
    auditEvents: addAuditEvent(
      state.auditEvents,
      "audit_event",
      "clinic.status_changed",
      "Incident replay linked field report, district alert, and reroute decision.",
      now,
    ),
  };
}

function applyPartnerWebhookStep(state: DemoState, now: string): DemoState {
  const preview = buildIncidentReplayWebhookPreview(state, now);
  const summary = preview.recommendedAlternativeName
    ? `Partner webhook dispatched for ${preview.clinicName}; recommended alternative ${preview.recommendedAlternativeName}.`
    : `Partner webhook dispatched for ${preview.clinicName}; manual reroute coordination required.`;

  return {
    ...cloneState(state),
    auditEvents: addAuditEvent(
      state.auditEvents,
      "partner_webhook",
      "partner.webhook_dispatched",
      summary,
      now,
    ),
  };
}

export function applyIncidentReplayStep(
  state: DemoState,
  stepId: IncidentReplayStepId,
  now: string,
): DemoState {
  switch (stepId) {
    case "field_report":
      return applyFieldReportStep(state, now);
    case "district_alert":
      return applyDistrictAlertStep(state, now);
    case "reroute":
      return applyRerouteStep(state, now);
    case "audit_event":
      return applyAuditEventStep(state, now);
    case "partner_webhook":
      return applyPartnerWebhookStep(state, now);
  }
}

export function buildIncidentReplayWebhookPreview(
  state: DemoState,
  dispatchedAt: string,
): IncidentReplayWebhookPreview {
  const sourceClinic = getSourceClinic(state);
  const alternative = getRecommendedAlternative(state);
  const currentStatus = state.clinicStates.find(
    (entry) => entry.clinicId === INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  );
  const clinicName = sourceClinic?.name ?? INCIDENT_REPLAY_SOURCE_CLINIC_ID;
  const status = currentStatus?.status ?? "unknown";

  return {
    eventType: "clinic.status_changed",
    deliveryStatus: "delivered_preview",
    clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
    clinicName,
    status,
    recommendedAlternativeName: alternative?.name ?? null,
    dispatchedAt,
    payload: {
      eventType: "clinic.status_changed",
      clinic: {
        id: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
        name: clinicName,
      },
      status,
      reason: currentStatus?.reason ?? "Status unavailable.",
      recommendedAlternative: alternative
        ? {
            id: alternative.id,
            name: alternative.name,
            facilityCode: alternative.facilityCode,
          }
        : null,
      dispatchedAt,
    },
  };
}
```

- [ ] **Step 5: Update audit-trail copy for partner webhook**

Modify `components/demo/audit-trail.tsx` inside `systemResponseByType`:

```ts
  "partner.webhook_dispatched": {
    title: "Partner webhook",
    action: "Partner-facing webhook payload was prepared and marked delivered for the replay.",
    icon: Workflow,
  },
```

- [ ] **Step 6: Run test to verify it passes**

Run:

```bash
npm test -- lib/demo/incident-replay.test.ts
```

Expected: PASS with 2 tests.

- [ ] **Step 7: Add remaining replay model tests**

Append to `lib/demo/incident-replay.test.ts`:

```ts
  it("creates one critical district alert for the incident clinic", () => {
    const now = "2026-05-07T08:01:00.000Z";
    const state = applyIncidentReplayStep(
      createInitialDemoState(),
      "district_alert",
      now,
    );

    expect(
      state.alerts.filter(
        (alert) =>
          alert.clinicId === INCIDENT_REPLAY_SOURCE_CLINIC_ID &&
          alert.type === "stockout" &&
          alert.status === "open",
      ),
    ).toHaveLength(1);
    expect(state.alerts[0]).toMatchObject({
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      type: "stockout",
      severity: "critical",
      createdAt: now,
    });
  });

  it("records reroute, audit, and partner webhook audit evidence", () => {
    const initialState = createInitialDemoState();
    const reported = applyIncidentReplayStep(
      initialState,
      "field_report",
      "2026-05-07T08:00:00.000Z",
    );
    const rerouted = applyIncidentReplayStep(
      reported,
      "reroute",
      "2026-05-07T08:02:00.000Z",
    );
    const audited = applyIncidentReplayStep(
      rerouted,
      "audit_event",
      "2026-05-07T08:03:00.000Z",
    );
    const webhooked = applyIncidentReplayStep(
      audited,
      "partner_webhook",
      "2026-05-07T08:04:00.000Z",
    );

    expect(webhooked.auditEvents).toContainEqual(
      expect.objectContaining({
        clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
        eventType: "routing.alternative_recommended",
      }),
    );
    expect(webhooked.auditEvents).toContainEqual(
      expect.objectContaining({
        clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
        eventType: "clinic.status_changed",
        summary: "Incident replay linked field report, district alert, and reroute decision.",
      }),
    );
    expect(webhooked.auditEvents[0]).toMatchObject({
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      eventType: "partner.webhook_dispatched",
      createdAt: "2026-05-07T08:04:00.000Z",
    });
  });

  it("builds a partner webhook preview payload from current incident state", () => {
    const now = "2026-05-07T08:05:00.000Z";
    const initialState = createInitialDemoState();
    const reported = applyIncidentReplayStep(initialState, "field_report", now);
    const rows = getClinicRows(reported);
    const source = rows.find((clinic) => clinic.id === INCIDENT_REPLAY_SOURCE_CLINIC_ID)!;
    const expectedAlternative = getAlternativeClinics(
      reported,
      source.id,
      source.services[0],
    )[0];

    const preview = buildIncidentReplayWebhookPreview(reported, now);

    expect(preview).toMatchObject({
      eventType: "clinic.status_changed",
      deliveryStatus: "delivered_preview",
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      clinicName: source.name,
      status: "non_functional",
      recommendedAlternativeName: expectedAlternative?.name ?? null,
      dispatchedAt: now,
    });
    expect(preview.payload).toMatchObject({
      eventType: "clinic.status_changed",
      clinic: {
        id: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
        name: source.name,
      },
      status: "non_functional",
    });
  });
```

- [ ] **Step 8: Run full replay model tests**

Run:

```bash
npm test -- lib/demo/incident-replay.test.ts lib/demo/scenarios.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Task 1**

```bash
git add lib/demo/incident-replay.ts lib/demo/incident-replay.test.ts lib/demo/types.ts components/demo/audit-trail.tsx
git commit -m "feat: add incident replay state model"
```

## Task 2: Store Action

**Files:**
- Modify: `lib/demo/demo-store.tsx`
- Modify: `lib/demo/demo-store.test.ts`

- [ ] **Step 1: Write failing store test**

Append to `lib/demo/demo-store.test.ts`:

```ts
import {
  INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  applyIncidentReplayStep,
} from "@/lib/demo/incident-replay";
```

Add this test inside the existing `describe("Demo store hydration", ...)` block or a new `describe("Demo store incident replay", ...)` block:

```ts
describe("Demo store incident replay", () => {
  it("applies an incident replay step through the pure replay reducer helper", () => {
    const now = "2026-05-07T09:00:00.000Z";
    const nextState = applyIncidentReplayStep(createInitialDemoState(), "field_report", now);

    expect(nextState.reports[0]).toMatchObject({
      clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
      reporterName: "Nomsa Dlamini",
      receivedAt: now,
    });
  });
});
```

Run:

```bash
npm test -- lib/demo/demo-store.test.ts
```

Expected: PASS because this validates the helper before wiring.

- [ ] **Step 2: Wire replay action into store types**

Modify imports in `lib/demo/demo-store.tsx`:

```ts
import {
  applyIncidentReplayStep,
  type IncidentReplayStepId,
} from "@/lib/demo/incident-replay";
```

Add to `DemoStoreValue`:

```ts
  applyIncidentReplayStep: (stepId: IncidentReplayStepId, now?: string) => void;
```

Add to `DemoAction`:

```ts
  | { type: "apply_incident_replay_step"; stepId: IncidentReplayStepId; now: string }
```

Add reducer case:

```ts
    case "apply_incident_replay_step":
      return applyIncidentReplayStep(state, action.stepId, action.now);
```

Add to provider value:

```ts
      applyIncidentReplayStep: (stepId: IncidentReplayStepId, stepNow?: string) =>
        dispatch({
          type: "apply_incident_replay_step",
          stepId,
          now: stepNow ?? new Date().toISOString(),
        }),
```

- [ ] **Step 3: Add source-boundary test for store API**

Add these imports to the top of `lib/demo/incident-replay.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
```

Add:

```ts
describe("incident replay store wiring", () => {
  it("exposes applyIncidentReplayStep through the demo store", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib", "demo", "demo-store.tsx"),
      "utf8",
    );

    expect(source).toContain("applyIncidentReplayStep: (stepId: IncidentReplayStepId");
    expect(source).toContain('type: "apply_incident_replay_step"');
    expect(source).toContain("return applyIncidentReplayStep(state, action.stepId, action.now)");
  });
});
```

- [ ] **Step 4: Run store and replay tests**

Run:

```bash
npm test -- lib/demo/incident-replay.test.ts lib/demo/demo-store.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add lib/demo/demo-store.tsx lib/demo/demo-store.test.ts lib/demo/incident-replay.test.ts
git commit -m "feat: expose incident replay through demo store"
```

## Task 3: Replay Panel Component

**Files:**
- Create: `components/demo/incident-replay-panel.tsx`
- Create: `lib/demo/incident-replay-ui.test.ts`

- [ ] **Step 1: Write failing source-boundary test**

Create `lib/demo/incident-replay-ui.test.ts`:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const replayPanel = path.join(
  process.cwd(),
  "components",
  "demo",
  "incident-replay-panel.tsx",
);

describe("incident replay UI", () => {
  it("renders the incident replay timeline and webhook preview states", () => {
    const source = readFileSync(replayPanel, "utf8");

    expect(source).toContain("Incident replay");
    expect(source).toContain("Partner webhook");
    expect(source).toContain("Delivered preview");
    expect(source).toContain("completedStepIds");
    expect(source).toContain("activeStepId");
  });
});
```

Run:

```bash
npm test -- lib/demo/incident-replay-ui.test.ts
```

Expected: FAIL because the component file does not exist.

- [ ] **Step 2: Implement `IncidentReplayPanel`**

Create `components/demo/incident-replay-panel.tsx`:

```tsx
"use client";

import {
  BellRing,
  CheckCircle2,
  FileJson,
  Radio,
  Route,
  Send,
  UserRound,
} from "lucide-react";

import { SectionHeader } from "@/components/demo/section-header";
import {
  incidentReplaySteps,
  type IncidentReplayStepId,
  type IncidentReplayWebhookPreview,
} from "@/lib/demo/incident-replay";
import { cn } from "@/lib/utils";

type IncidentReplayStatus = "idle" | "running" | "complete";

type IncidentReplayPanelProps = {
  status: IncidentReplayStatus;
  activeStepId: IncidentReplayStepId | null;
  completedStepIds: IncidentReplayStepId[];
  completedAtByStepId: Partial<Record<IncidentReplayStepId, string>>;
  webhookPreview: IncidentReplayWebhookPreview | null;
};

const iconByStepId = {
  field_report: UserRound,
  district_alert: BellRing,
  reroute: Route,
  audit_event: FileJson,
  partner_webhook: Send,
} satisfies Record<IncidentReplayStepId, typeof UserRound>;

function formatTime(value: string | undefined) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function stepState(
  stepId: IncidentReplayStepId,
  activeStepId: IncidentReplayStepId | null,
  completedStepIds: IncidentReplayStepId[],
) {
  if (completedStepIds.includes(stepId)) {
    return "Complete";
  }
  if (activeStepId === stepId) {
    return "Live";
  }
  return "Queued";
}

export function IncidentReplayPanel({
  status,
  activeStepId,
  completedStepIds,
  completedAtByStepId,
  webhookPreview,
}: IncidentReplayPanelProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <section className="rounded-lg border border-border-subtle bg-bg-default p-4 shadow-sm">
      <SectionHeader
        eyebrow="Operating chain"
        title="Incident replay"
        description="One incident moving through report, alert, reroute, audit, and partner handoff."
      />

      <div className="mt-4 grid gap-2">
        {incidentReplaySteps.map((step) => {
          const Icon = iconByStepId[step.id];
          const state = stepState(step.id, activeStepId, completedStepIds);
          const completed = state === "Complete";
          const live = state === "Live";

          return (
            <article
              key={step.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                live
                  ? "border-teal-300 bg-teal-50"
                  : completed
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-border-subtle bg-bg-subtle",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-default text-content-subtle">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-content-emphasis">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-content-default">{step.summary}</p>
                    {completed ? (
                      <p className="mt-1 font-mono text-xs text-content-subtle">
                        {formatTime(completedAtByStepId[step.id])}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold",
                    live
                      ? "border-teal-200 bg-teal-100 text-teal-900"
                      : completed
                        ? "border-emerald-200 bg-emerald-100 text-emerald-900"
                        : "border-border-subtle bg-bg-default text-content-subtle",
                  )}
                >
                  {completed ? <CheckCircle2 className="size-3" /> : <Radio className="size-3" />}
                  {state}
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {webhookPreview ? (
        <div className="mt-4 rounded-lg border border-border-subtle bg-bg-subtle p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-content-emphasis">Partner webhook</p>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
              Delivered preview
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <dt className="text-content-subtle">Event</dt>
              <dd className="mt-1 font-mono text-content-default">{webhookPreview.eventType}</dd>
            </div>
            <div>
              <dt className="text-content-subtle">Clinic</dt>
              <dd className="mt-1 text-content-default">{webhookPreview.clinicName}</dd>
            </div>
            <div>
              <dt className="text-content-subtle">Status</dt>
              <dd className="mt-1 capitalize text-content-default">
                {webhookPreview.status.replaceAll("_", " ")}
              </dd>
            </div>
            <div>
              <dt className="text-content-subtle">Alternative</dt>
              <dd className="mt-1 text-content-default">
                {webhookPreview.recommendedAlternativeName ?? "Manual coordination"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 3: Run UI source test**

Run:

```bash
npm test -- lib/demo/incident-replay-ui.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit Task 3**

```bash
git add components/demo/incident-replay-panel.tsx lib/demo/incident-replay-ui.test.ts
git commit -m "feat: add incident replay timeline panel"
```

## Task 4: District Console Orchestration

**Files:**
- Modify: `components/demo/demo-controls.tsx`
- Modify: `app/(demo)/demo/page-client.tsx`
- Modify: `lib/demo/incident-replay-ui.test.ts`

- [ ] **Step 1: Add failing UI wiring test**

Append to `lib/demo/incident-replay-ui.test.ts`:

```ts
const demoControls = path.join(process.cwd(), "components", "demo", "demo-controls.tsx");
const demoPageClient = path.join(process.cwd(), "app", "(demo)", "demo", "page-client.tsx");

describe("incident replay page wiring", () => {
  it("wires replay action through demo controls into the district console", () => {
    const controlsSource = readFileSync(demoControls, "utf8");
    const pageSource = readFileSync(demoPageClient, "utf8");

    expect(controlsSource).toContain("Replay incident");
    expect(controlsSource).toContain("onReplayIncident");
    expect(controlsSource).toContain("replayRunning");
    expect(pageSource).toContain("IncidentReplayPanel");
    expect(pageSource).toContain("startIncidentReplay");
    expect(pageSource).toContain("applyIncidentReplayStep(step.id");
    expect(pageSource).toContain("buildIncidentReplayWebhookPreview");
  });
});
```

Run:

```bash
npm test -- lib/demo/incident-replay-ui.test.ts
```

Expected: FAIL because the controls/page are not wired.

- [ ] **Step 2: Extend `DemoControls` props**

Modify `components/demo/demo-controls.tsx`:

```ts
import {
  PlayCircle,
  RefreshCw,
  Route,
  Syringe,
  TriangleAlert,
  UsersRound,
} from "lucide-react";
```

Add props:

```ts
  replayRunning?: boolean;
  onReplayIncident: () => void;
```

Add them to the function arguments.

Add this action after Reset:

```ts
    {
      title: "Replay incident",
      description: "Animate one incident from field report to partner webhook evidence.",
      icon: PlayCircle,
      onClick: onReplayIncident,
      variant: "outline",
      disabled: replayRunning,
    },
```

Extend `ControlAction`:

```ts
  disabled?: boolean;
```

Pass disabled to `<Button>`:

```tsx
                  disabled={action.disabled}
```

Keep the button label as `{action.title}`.

- [ ] **Step 3: Add replay state and imports to page client**

Modify imports in `app/(demo)/demo/page-client.tsx`:

```ts
import { useEffect, useMemo, useRef, useState } from "react";
import { IncidentReplayPanel } from "@/components/demo/incident-replay-panel";
import {
  INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  buildIncidentReplayWebhookPreview,
  incidentReplaySteps,
  type IncidentReplayStepId,
  type IncidentReplayWebhookPreview,
} from "@/lib/demo/incident-replay";
```

Include `applyIncidentReplayStep` from `useDemoStore()`:

```ts
    applyIncidentReplayStep,
```

Add state near existing `useState` calls:

```ts
  const replayTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const [replayStatus, setReplayStatus] = useState<"idle" | "running" | "complete">("idle");
  const [activeReplayStepId, setActiveReplayStepId] =
    useState<IncidentReplayStepId | null>(null);
  const [completedReplayStepIds, setCompletedReplayStepIds] = useState<IncidentReplayStepId[]>([]);
  const [completedReplayAtByStepId, setCompletedReplayAtByStepId] = useState<
    Partial<Record<IncidentReplayStepId, string>>
  >({});
  const [webhookPreview, setWebhookPreview] =
    useState<IncidentReplayWebhookPreview | null>(null);
```

Add timer cleanup:

```ts
  useEffect(() => {
    return () => {
      if (replayTimeoutRef.current) {
        window.clearTimeout(replayTimeoutRef.current);
      }
    };
  }, []);
```

- [ ] **Step 4: Add replay runner**

Add inside `DistrictConsolePage` before `return`:

```ts
  const clearReplayTimer = () => {
    if (replayTimeoutRef.current) {
      window.clearTimeout(replayTimeoutRef.current);
      replayTimeoutRef.current = null;
    }
  };

  const runIncidentReplayStep = (stepIndex: number) => {
    const step = incidentReplaySteps[stepIndex];
    if (!step) {
      setActiveReplayStepId(null);
      setReplayStatus("complete");
      return;
    }

    const stepNow = new Date().toISOString();
    setActiveReplayStepId(step.id);
    applyIncidentReplayStep(step.id, stepNow);

    if (step.id === "reroute") {
      setRerouteClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID);
    }

    if (step.id === "partner_webhook") {
      setWebhookPreview(buildIncidentReplayWebhookPreview(state, stepNow));
    }

    replayTimeoutRef.current = window.setTimeout(() => {
      setCompletedReplayStepIds((previous) =>
        previous.includes(step.id) ? previous : [...previous, step.id],
      );
      setCompletedReplayAtByStepId((previous) => ({
        ...previous,
        [step.id]: new Date().toISOString(),
      }));
      runIncidentReplayStep(stepIndex + 1);
    }, step.durationMs);
  };

  const startIncidentReplay = () => {
    if (replayStatus === "running") {
      return;
    }

    clearReplayTimer();
    setReplayStatus("running");
    setActiveReplayStepId(null);
    setCompletedReplayStepIds([]);
    setCompletedReplayAtByStepId({});
    setWebhookPreview(null);
    setSelectedClinicId(INCIDENT_REPLAY_SOURCE_CLINIC_ID);
    setClinicPanelOpen(true);
    setRerouteClinicId(null);
    runIncidentReplayStep(0);
  };
```

Then adjust `handleCloseClinicPanel` so it does not clear replay state; closing panel can keep replay panel visible. Keep existing close behavior for clinic selection.

- [ ] **Step 5: Pass replay props and render panel**

In the `DemoControls` call:

```tsx
          replayRunning={replayStatus === "running"}
          onReplayIncident={startIncidentReplay}
```

Render the panel immediately after `DemoControls`:

```tsx
        <IncidentReplayPanel
          status={replayStatus}
          activeStepId={activeReplayStepId}
          completedStepIds={completedReplayStepIds}
          completedAtByStepId={completedReplayAtByStepId}
          webhookPreview={webhookPreview}
        />
```

Modify reset handler:

```ts
            clearReplayTimer();
            setReplayStatus("idle");
            setActiveReplayStepId(null);
            setCompletedReplayStepIds([]);
            setCompletedReplayAtByStepId({});
            setWebhookPreview(null);
```

- [ ] **Step 6: Keep webhook preview aligned with latest demo state**

The timer callback must not build the webhook preview from stale React state. Add a ref after state declarations:

```ts
  const latestDemoStateRef = useRef(state);
```

Add effect:

```ts
  useEffect(() => {
    latestDemoStateRef.current = state;
  }, [state]);
```

Use it in the partner webhook branch:

```ts
    if (step.id === "partner_webhook") {
      setWebhookPreview(buildIncidentReplayWebhookPreview(latestDemoStateRef.current, stepNow));
    }
```

Use only `latestDemoStateRef` for the webhook preview.

- [ ] **Step 7: Run UI source tests**

Run:

```bash
npm test -- lib/demo/incident-replay-ui.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit Task 4**

```bash
git add app/'(demo)'/demo/page-client.tsx components/demo/demo-controls.tsx lib/demo/incident-replay-ui.test.ts
git commit -m "feat: animate incident replay from demo controls"
```

## Task 5: E2E Smoke Coverage

**Files:**
- Modify: `tests/e2e/phase-one-smoke.spec.ts`

- [ ] **Step 1: Add smoke expectation for replay**

Inside `renders protected district, clinic detail, field, and admin routes after login`, after:

```ts
    await expect(page.getByText("Report stream")).toBeVisible();
```

Add:

```ts
    await page.getByRole("button", { name: "Replay incident" }).click();
    await expect(page.getByRole("heading", { name: "Incident replay" })).toBeVisible();
    await expect(page.getByText("Partner webhook")).toBeVisible();
    await expect(page.getByText("Delivered preview")).toBeVisible({ timeout: 7000 });
```

Run:

```bash
npm run test:e2e -- tests/e2e/phase-one-smoke.spec.ts
```

Expected after Task 4: PASS when local e2e services are available.

- [ ] **Step 2: Run focused unit checks first**

Run:

```bash
npm test -- lib/demo/incident-replay.test.ts lib/demo/incident-replay-ui.test.ts lib/demo/demo-store.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run E2E smoke if the local API/e2e database is available**

Run:

```bash
npm run test:e2e -- tests/e2e/phase-one-smoke.spec.ts
```

Expected: PASS. If local e2e dependencies are not running, record the exact dependency failure and rely on CI for Playwright verification.

- [ ] **Step 4: Commit Task 5**

```bash
git add tests/e2e/phase-one-smoke.spec.ts
git commit -m "test: cover incident replay smoke path"
```

## Task 6: Final Verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run Vitest replay suite**

```bash
npm test -- lib/demo/incident-replay.test.ts lib/demo/incident-replay-ui.test.ts lib/demo/demo-store.test.ts lib/demo/scenarios.test.ts
```

Expected: all listed test files pass.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 3: Run production build**

```bash
npm run build
```

Expected: exit code 0 and `/demo` listed as a dynamic route.

- [ ] **Step 4: Manual browser check**

Run:

```bash
npm run dev
```

Open `/demo` after logging in as `org-admin@clinicpulse.local`.

Verify:

- "Replay incident" is visible in Console controls.
- Clicking it opens/keeps the Mamelodi East clinic panel.
- Timeline advances through Field report, District alert, Reroute, Audit event, Partner webhook.
- Report stream shows the replay report.
- Alert queue shows the critical stockout alert.
- Selected clinic shows reroute recommended.
- Webhook preview shows Delivered preview.
- Reset clears the replay panel.

- [ ] **Step 5: Commit verification note only if docs changed**

No commit is needed if Task 6 only verifies. If manual findings require small copy/test updates, commit them with:

```bash
git add <changed-files>
git commit -m "fix: polish incident replay verification gaps"
```

## Self-Review Checklist

- Spec coverage: all five replay stages are implemented by Task 1 and shown by Tasks 3-4.
- UI coverage: Task 4 wires one-click control, selected clinic focus, reroute activation, and reset cleanup.
- Partner webhook: local delivered-preview payload is implemented without backend dependency.
- Tests: unit, source-boundary, and Playwright smoke paths are specified.
- No backend schema/API changes are required.
