import { describe, expect, it } from "vitest";

import {
  STAFFING_TRIGGER_CLINIC_ID,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import {
  createInitialDemoState,
  createQueuedOfflineReport,
  submitFieldReportScenario,
  syncOfflineReportsScenario,
  triggerStaffingShortageScenario,
  triggerStockoutScenario,
} from "@/lib/demo/scenarios";
import type { Alert } from "@/lib/demo/types";

describe("triggerStockoutScenario", () => {
  it("creates a stockout report, alert, status update, and audit event at the fixed time", () => {
    const now = "2026-05-02T08:00:00.000Z";
    const state = triggerStockoutScenario(
      createInitialDemoState(),
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
      reporterName: "Demo control",
      source: "demo_control",
      stockPressure: "stockout",
    });

    expect(state.reports[0]).toMatchObject({
      clinicId: STOCKOUT_TRIGGER_CLINIC_ID,
      reporterName: "Demo control",
      source: "demo_control",
      offlineCreated: false,
      submittedAt: now,
      receivedAt: now,
      status: "degraded",
      stockPressure: "stockout",
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
        actorName: "Demo control",
        eventType: "clinic.status_changed",
        createdAt: now,
      }),
    );
  });
});

describe("triggerStaffingShortageScenario", () => {
  it("sets degraded status, critical staff pressure, high queue pressure, and a staffing alert", () => {
    const now = "2026-05-02T09:00:00.000Z";
    const state = triggerStaffingShortageScenario(
      createInitialDemoState(),
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
      source: "demo_control",
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
    const initialState = createInitialDemoState();
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
    const initialState = createInitialDemoState();
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
      actorName: "Demo control",
      eventType: "demo.offline_sync_triggered",
      createdAt: now,
    });
  });
});
