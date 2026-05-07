import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { STOCKOUT_TRIGGER_CLINIC_ID } from "@/lib/demo/clinics";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import {
  applyIncidentReplayStep,
  buildIncidentReplayWebhookPreview,
  incidentReplaySteps,
} from "@/lib/demo/incident-replay";

const demoStoreSourcePath = path.join(process.cwd(), "lib", "demo", "demo-store.tsx");

describe("incidentReplaySteps", () => {
  it("keeps the replay steps in the expected incident order", () => {
    expect(incidentReplaySteps.map((step) => step.id)).toEqual([
      "field_report",
      "district_alert",
      "reroute",
      "audit_event",
      "partner_webhook",
    ]);
  });
});

describe("applyIncidentReplayStep", () => {
  it("mutates the source clinic with a submitted field report", () => {
    const now = "2026-05-03T08:00:00.000Z";
    const state = applyIncidentReplayStep(
      createInitialDemoState(),
      "field_report",
      now,
    );

    expect(state.reports[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      reporterName: "Incident replay field worker",
      source: "field_worker",
      offlineCreated: false,
      submittedAt: now,
      receivedAt: now,
      status: "non_functional",
      stockPressure: "stockout",
      queuePressure: "high",
    });

    expect(
      state.clinicStates.find((entry) => entry.clinicId === STOCKOUT_TRIGGER_CLINIC_ID),
    ).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      status: "non_functional",
      stockPressure: "stockout",
      queuePressure: "high",
      lastReportedAt: now,
      reporterName: "Incident replay field worker",
    });

    expect(state.auditEvents[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      actorName: "Incident replay field worker",
      eventType: "report.submitted",
      createdAt: now,
    });
  });

  it("creates exactly one open stockout alert for the incident clinic", () => {
    const now = "2026-05-03T08:05:00.000Z";
    const state = applyIncidentReplayStep(
      createInitialDemoState(),
      "district_alert",
      now,
    );

    const clinicAlerts = state.alerts.filter(
      (alert) =>
        alert.clinicId === STOCKOUT_TRIGGER_CLINIC_ID && alert.type === "stockout",
    );

    expect(clinicAlerts).toHaveLength(1);
    expect(clinicAlerts[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      type: "stockout",
      severity: "critical",
      status: "open",
      id: `alert-${STOCKOUT_TRIGGER_CLINIC_ID}-district-alert-2026-05-03t08-05-00-000z`,
      createdAt: now,
    });
  });

  it("emits deterministic ids for the same clinic, step, and timestamp", () => {
    const initialState = createInitialDemoState();
    const now = "2026-05-03T08:00:00.000Z";

    const firstState = applyIncidentReplayStep(initialState, "field_report", now);
    const secondState = applyIncidentReplayStep(initialState, "field_report", now);

    expect(firstState.reports[0]?.id).toBe(secondState.reports[0]?.id);
    expect(firstState.auditEvents[0]?.id).toBe(secondState.auditEvents[0]?.id);
    expect(firstState.reports[0]?.id).toBe(
      `report-${STOCKOUT_TRIGGER_CLINIC_ID}-field-report-2026-05-03t08-00-00-000z`,
    );
  });

  it("records reroute, audit, and partner webhook events in the replay timeline", () => {
    const initialState = createInitialDemoState();
    const fieldReportedState = applyIncidentReplayStep(
      initialState,
      "field_report",
      "2026-05-03T08:00:00.000Z",
    );
    const alertState = applyIncidentReplayStep(
      fieldReportedState,
      "district_alert",
      "2026-05-03T08:01:00.000Z",
    );
    const reroutedState = applyIncidentReplayStep(
      alertState,
      "reroute",
      "2026-05-03T08:02:00.000Z",
    );
    const auditedState = applyIncidentReplayStep(
      reroutedState,
      "audit_event",
      "2026-05-03T08:03:00.000Z",
    );
    const webhookState = applyIncidentReplayStep(
      auditedState,
      "partner_webhook",
      "2026-05-03T08:04:00.000Z",
    );

    expect(webhookState.auditEvents.slice(0, 3).map((event) => event.eventType)).toEqual([
      "partner.webhook_dispatched",
      "clinic.status_changed",
      "routing.alternative_recommended",
    ]);
  });

  it("builds a delivered webhook preview with the clinic, status, and recommended alternative", () => {
    const fieldReportedState = applyIncidentReplayStep(
      createInitialDemoState(),
      "field_report",
      "2026-05-03T08:00:00.000Z",
    );
    const alertState = applyIncidentReplayStep(
      fieldReportedState,
      "district_alert",
      "2026-05-03T08:01:00.000Z",
    );
    const reroutedState = applyIncidentReplayStep(
      alertState,
      "reroute",
      "2026-05-03T08:02:00.000Z",
    );
    const preview = buildIncidentReplayWebhookPreview(
      reroutedState,
      "2026-05-03T08:04:00.000Z",
    );

    expect(preview).toMatchObject({
      deliveryStatus: "delivered",
      clinic: expect.objectContaining({
        id: STOCKOUT_TRIGGER_CLINIC_ID,
      }),
      status: "non_functional",
      recommendedAlternative: expect.objectContaining({
        id: expect.any(String),
      }),
    });
    expect(preview.summary).toContain("Partner webhook delivered for");
  });
});

describe("demo store incident replay wiring", () => {
  it("exposes the replay store method, action type, and reducer wiring", () => {
    const demoStoreSource = readFileSync(demoStoreSourcePath, "utf8");

    expect(demoStoreSource).toContain(
      "applyIncidentReplayStep: (stepId: IncidentReplayStepId, now?: string) => void;",
    );
    expect(demoStoreSource).toContain('type: "apply_incident_replay_step"');
    expect(demoStoreSource).toContain('case "apply_incident_replay_step":');
    expect(demoStoreSource).toContain(
      "return applyIncidentReplayStep(state, action.stepId, action.now);",
    );
    expect(demoStoreSource).toContain("applyIncidentReplayStep: (stepId, stepNow?) =>");
  });
});
