import { describe, expect, it } from "vitest";

import { createInitialWorkspaceState } from "@/lib/workspace/scenarios";
import {
  buildScenarioControlsViewModel,
  scenarioControlCommandIds,
} from "@/lib/product/scenario-controls";

describe("buildScenarioControlsViewModel", () => {
  it("builds an operations runbook with the selected command preview", () => {
    const state = createInitialWorkspaceState();

    const viewModel = buildScenarioControlsViewModel({
      state,
      stockoutClinicLabel: "Mamelodi East Community Clinic",
      staffingClinicLabel: "Soshanguve Block F Clinic",
      selectedCommandId: "stockout",
      lastAction: "Scenario controls are ready.",
    });

    expect(scenarioControlCommandIds).toEqual([
      "reset",
      "incident_replay",
      "stockout",
      "staffing_shortage",
      "offline_sync",
      "reroute",
    ]);
    expect(viewModel.commandGroups.map((group) => group.title)).toEqual([
      "Baseline",
      "Incident rehearsal",
      "Data flow",
    ]);
    expect(viewModel.selectedCommand).toMatchObject({
      id: "stockout",
      label: "Trigger stockout",
      actionLabel: "Trigger stockout",
      targetLabel: "Mamelodi East Community Clinic",
      tone: "blocked",
    });
    expect(viewModel.selectedCommand.expectedEvidence).toEqual([
      "Clinic status update",
      "Stockout alert",
      "Audit trail entry",
    ]);
    expect(viewModel.selectedCommand.evidenceStages).toEqual([
      {
        id: "clinic-status-update",
        label: "Clinic status update",
        detail: "Operating state changes are visible to district users.",
        tone: "blocked",
      },
      {
        id: "stockout-alert",
        label: "Stockout alert",
        detail: "Open alert tells the operations desk what needs follow-up.",
        tone: "attention",
      },
      {
        id: "audit-trail-entry",
        label: "Audit trail entry",
        detail: "Scenario action is captured in the evidence timeline.",
        tone: "info",
      },
    ]);
  });

  it("summarizes state, safety notes, and recent evidence for the workspace", () => {
    const viewModel = buildScenarioControlsViewModel({
      state: createInitialWorkspaceState(),
      stockoutClinicLabel: "Mamelodi East Community Clinic",
      staffingClinicLabel: "Soshanguve Block F Clinic",
      selectedCommandId: "incident_replay",
      lastAction: "Incident replay applied across the platform.",
    });

    expect(viewModel.summaryMetrics.map((metric) => metric.id)).toEqual([
      "control_state",
      "active_alerts",
      "offline_queue",
      "audit_events",
    ]);
    expect(viewModel.summaryMetrics[0]).toMatchObject({
      label: "Controls",
      value: "Ready",
      detail: "Scenario commands available",
      tone: "clear",
    });
    expect(viewModel.statusMessage).toBe("Incident replay applied across the platform.");
    expect(viewModel.safetyNotes).toEqual([
      {
        label: "Browser-local run",
        detail: "Scenario actions update this review session only.",
      },
      {
        label: "Audit trail generated",
        detail: "Every run adds or refreshes evidence in the local audit stream.",
      },
      {
        label: "Reset available",
        detail: "Return to the seeded operating state at any point.",
      },
    ]);
    expect(viewModel.evidenceRows).toHaveLength(6);
    expect(viewModel.evidenceRows[0]).toEqual(
      expect.objectContaining({
        eventType: expect.any(String),
        clinicName: expect.any(String),
        summary: expect.any(String),
      }),
    );
  });
});
