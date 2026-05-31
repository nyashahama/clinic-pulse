import { describe, expect, it } from "vitest";

import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/workspace/clinics";
import {
  createInitialWorkspaceState,
  createQueuedOfflineReport,
  submitFieldReportScenario,
  syncOfflineReportsScenario,
  triggerStaffingShortageScenario,
  triggerStockoutScenario,
} from "@/lib/workspace/scenarios";
import type { Alert } from "@/lib/workspace/types";

describe("triggerStockoutScenario", () => {
  it("starts from a district operations incident instead of a demo proof state", () => {
    const state = createInitialWorkspaceState();
    const incidentClinic = state.clinics.find((clinic) => clinic.id === "clinic-mabopane-station");
    const incidentState = state.clinicStates.find(
      (clinicState) => clinicState.clinicId === "clinic-mabopane-station",
    );
    const incidentReport = state.reports.find(
      (report) => report.clinicId === "clinic-mabopane-station",
    );
    const incidentAlert = state.alerts.find(
      (alert) => alert.clinicId === "clinic-mabopane-station",
    );

    expect(state.district).toBe("Tshwane North District");
    expect(incidentClinic?.name).toBe("Mabopane Station Clinic");
    expect(incidentState?.reason).toContain("Generator failure paused dispensing");
    expect(incidentReport?.reporterName).toBe("Mpho Ndlovu");
    expect(incidentReport?.source).toBe("field_worker");
    expect(incidentAlert?.recommendedAction).toContain("Akasia Hills Clinic");
    expect(JSON.stringify(state).toLowerCase()).not.toContain("demo control");
  });

  it("creates a stockout report, alert, status update, and audit event at the fixed time", () => {
    const now = "2026-05-02T08:00:00.000Z";
    const state = triggerStockoutScenario(
      createInitialWorkspaceState(),
      STOCKOUT_TRIGGER_CLINIC_ID,
      now,
    );

    const clinicState = state.clinicStates.find(
      (entry) => entry.clinicId === STOCKOUT_TRIGGER_CLINIC_ID,
    );

    expect(clinicState).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      status: "degraded",
      lastReportedAt: now,
      reporterName: "Operations desk",
      source: "clinic_coordinator",
      stockPressure: "stockout",
    });

    expect(state.reports[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      reporterName: "Operations desk",
      source: "clinic_coordinator",
      offlineCreated: false,
      submittedAt: now,
      receivedAt: now,
      status: "degraded",
      stockPressure: "stockout",
      notes:
        "Tshwane North operations desk logged a same-day medicine availability change for operations review.",
    });

    expect(state.alerts[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      type: "stockout",
      status: "open",
      createdAt: now,
    });

    expect(state.auditEvents).toContainEqual(
      expect.objectContaining({
        clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
        actorName: "Operations desk",
        eventType: "clinic.status_changed",
        summary: "Stock availability update changed the clinic operating state.",
        createdAt: now,
      }),
    );
  });
});

describe("triggerStaffingShortageScenario", () => {
  it("sets degraded status, critical staff pressure, high queue pressure, and a staffing alert", () => {
    const now = "2026-05-02T09:00:00.000Z";
    const state = triggerStaffingShortageScenario(
      createInitialWorkspaceState(),
      STAFFING_TRIGGER_CLINIC_ID,
      now,
    );

    const clinicState = state.clinicStates.find(
      (entry) => entry.clinicId === STAFFING_TRIGGER_CLINIC_ID,
    );

    expect(clinicState).toMatchObject({
      clinicId: STAFFING_TRIGGER_CLINIC_ID,
      status: "degraded",
      lastReportedAt: now,
      reporterName: "Operations desk",
      source: "clinic_coordinator",
      staffPressure: "critical",
      queuePressure: "high",
    });
    expect(state.reports[0]).toMatchObject({
      clinicId: STAFFING_TRIGGER_CLINIC_ID,
      submittedAt: now,
      receivedAt: now,
      status: "degraded",
      staffPressure: "critical",
      queuePressure: "high",
      reporterName: "Operations desk",
      source: "clinic_coordinator",
      notes: "Operations desk logged an acute staffing shortage for district follow-up.",
    });
    expect(state.alerts[0]).toMatchObject({
      clinicId: STAFFING_TRIGGER_CLINIC_ID,
      type: "staffing_shortage",
      status: "open",
      createdAt: now,
    });
  });
});

describe("submitFieldReportScenario", () => {
  it("submits an online operational report for the first clinic", () => {
    const now = "2026-05-02T10:00:00.000Z";
    const initialState = createInitialWorkspaceState();
    const firstClinic = initialState.clinics[0];
    const state = submitFieldReportScenario(
      initialState,
      {
        clinicId: firstClinic.id,
        reporterName: "Nomsa Dlamini",
        source: "clinic_coordinator",
        offlineCreated: false,
        status: "operational",
        reason: "Morning verification confirms all core services are operational.",
        staffPressure: "normal",
        stockPressure: "normal",
        queuePressure: "low",
        notes: "Online report submitted during the demo.",
      },
      now,
    );

    expect(state.reports[0]).toMatchObject({
      clinicId: firstClinic.id,
      reporterName: "Nomsa Dlamini",
      source: "clinic_coordinator",
      offlineCreated: false,
      submittedAt: now,
      receivedAt: now,
      status: "operational",
    });
    expect(
      state.clinicStates.find((entry) => entry.clinicId === firstClinic.id),
    ).toMatchObject({
      clinicId: firstClinic.id,
      status: "operational",
      lastReportedAt: now,
      reporterName: "Nomsa Dlamini",
      source: "clinic_coordinator",
    });
    expect(state.auditEvents[0]).toMatchObject({
      clinicId: firstClinic.id,
      actorName: "Nomsa Dlamini",
      eventType: "report.submitted",
      createdAt: now,
    });
  });
});

describe("syncOfflineReportsScenario", () => {
  it("syncs a queued offline report, resolves the delay alert, and writes the sync audit event", () => {
    const queuedAt = "2026-05-02T09:45:00.000Z";
    const now = "2026-05-02T11:00:00.000Z";
    const initialState = createInitialWorkspaceState();
    const firstClinic = initialState.clinics[0];
    const queuedReport = createQueuedOfflineReport(
      {
        clinicId: firstClinic.id,
        reporterName: "Nomsa Dlamini",
        source: "field_worker",
        status: "degraded",
        reason: "Offline report shows queues building while connectivity is unavailable.",
        staffPressure: "strained",
        stockPressure: "normal",
        queuePressure: "high",
        notes: "Queued manually for the offline sync scenario test.",
      },
      queuedAt,
    );
    const offlineDelayAlert: Alert = {
      id: "alert-offline-delay-test",
      clinicId: firstClinic.id,
      type: "offline_queue_delay",
      severity: "medium",
      status: "open",
      recommendedAction: "Sync the queued field report.",
      createdAt: queuedAt,
    };

    const state = syncOfflineReportsScenario(
      {
        ...initialState,
        offlineQueue: [queuedReport],
        alerts: [offlineDelayAlert, ...initialState.alerts],
      },
      now,
    );

    expect(state.offlineQueue).toEqual([]);
    expect(state.lastSyncAt).toBe(now);
    expect(state.reports[0]).toMatchObject({
      id: queuedReport.id,
      clinicId: firstClinic.id,
      reporterName: "Nomsa Dlamini",
      source: "field_worker",
      offlineCreated: true,
      submittedAt: queuedAt,
      receivedAt: now,
      queuePressure: "high",
    });
    expect(
      state.clinicStates.find((entry) => entry.clinicId === firstClinic.id),
    ).toMatchObject({
      clinicId: firstClinic.id,
      lastReportedAt: now,
      queuePressure: "high",
    });
    expect(
      state.alerts.find((alert) => alert.id === offlineDelayAlert.id),
    ).toMatchObject({
      type: "offline_queue_delay",
      status: "resolved",
    });
    expect(state.auditEvents[0]).toMatchObject({
      clinicId: firstClinic.id,
      actorName: "Operations desk",
      eventType: "scenario.offline_sync_triggered",
      summary: "Operations sync processed 1 offline report.",
      createdAt: now,
    });
  });
});
