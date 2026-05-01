import {
  DEMO_DISTRICT,
  DEMO_PROVINCE,
  demoClinics,
} from "@/lib/demo/clinics";
import { demoAlerts } from "@/lib/demo/alerts";
import { getFreshnessFromTimestamp } from "@/lib/demo/freshness";
import { demoLeads } from "@/lib/demo/leads";
import { demoAuditEvents, demoClinicStates, demoReports } from "@/lib/demo/reports";
import type {
  Alert,
  AuditEvent,
  ClinicCurrentState,
  DemoState,
  QueueOfflineReportInput,
  QueuedOfflineReport,
  ReportEvent,
  SubmitFieldReportInput,
} from "@/lib/demo/types";

const DEMO_CONTROL_NAME = "Demo control";

function buildId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneState(state: DemoState): DemoState {
  return {
    ...state,
    clinics: [...state.clinics],
    clinicStates: [...state.clinicStates],
    reports: [...state.reports],
    alerts: [...state.alerts],
    auditEvents: [...state.auditEvents],
    leads: [...state.leads],
    offlineQueue: [...state.offlineQueue],
  };
}

function upsertClinicState(
  clinicStates: ClinicCurrentState[],
  nextState: ClinicCurrentState,
) {
  const index = clinicStates.findIndex((state) => state.clinicId === nextState.clinicId);

  if (index === -1) {
    return [nextState, ...clinicStates];
  }

  const copy = [...clinicStates];
  copy[index] = nextState;
  return copy;
}

function replaceAlertsForClinic(alerts: Alert[], clinicId: string, alertTypes: Alert["type"][]) {
  return alerts.filter(
    (alert) => alert.clinicId !== clinicId || !alertTypes.includes(alert.type),
  );
}

function addAuditEvent(
  auditEvents: AuditEvent[],
  clinicId: string,
  actorName: string,
  eventType: AuditEvent["eventType"],
  summary: string,
  createdAt: string,
) {
  return [
    {
      id: buildId("audit"),
      clinicId,
      actorName,
      eventType,
      summary,
      createdAt,
    },
    ...auditEvents,
  ];
}

function addReportEvent(reports: ReportEvent[], report: ReportEvent) {
  return [report, ...reports];
}

function buildClinicStateFromReport(
  state: DemoState,
  report: ReportEvent,
): ClinicCurrentState {
  const currentState = state.clinicStates.find(
    (entry) => entry.clinicId === report.clinicId,
  );
  const freshness = getFreshnessFromTimestamp(report.receivedAt, new Date(report.receivedAt));

  return {
    ...currentState,
    clinicId: report.clinicId,
    status: report.status,
    reason: report.reason,
    freshness,
    lastReportedAt: report.receivedAt,
    reporterName: report.reporterName,
    staffPressure: report.staffPressure,
    stockPressure: report.stockPressure,
    queuePressure: report.queuePressure,
    source: report.source,
  };
}

export function createInitialDemoState(): DemoState {
  return {
    province: DEMO_PROVINCE,
    district: DEMO_DISTRICT,
    clinics: demoClinics.map((clinic) => ({ ...clinic })),
    clinicStates: demoClinicStates.map((state) => ({ ...state })),
    reports: demoReports.map((report) => ({ ...report })),
    alerts: demoAlerts.map((alert) => ({ ...alert })),
    auditEvents: demoAuditEvents.map((event) => ({ ...event })),
    leads: demoLeads.map((lead) => ({ ...lead })),
    role: "founder_admin",
    offlineQueue: [],
    lastSyncAt: null,
  };
}

export function triggerStockoutScenario(
  state: DemoState,
  clinicId: string,
  now = new Date().toISOString(),
): DemoState {
  const currentState = state.clinicStates.find((entry) => entry.clinicId === clinicId);

  if (!currentState) {
    return state;
  }

  const nextStatus =
    currentState.status === "degraded" ? "non_functional" : "degraded";
  const nextReason =
    nextStatus === "non_functional"
      ? "Pharmacy dispensing paused after essential medicines reached full stockout."
      : "Essential medicines unavailable for walk-in patients; referral routing required.";

  const nextClinicState: ClinicCurrentState = {
    ...currentState,
    status: nextStatus,
    reason: nextReason,
    freshness: getFreshnessFromTimestamp(now, new Date(now)),
    lastReportedAt: now,
    reporterName: DEMO_CONTROL_NAME,
    source: "demo_control",
    stockPressure: "stockout",
    queuePressure: currentState.queuePressure === "unknown" ? "moderate" : currentState.queuePressure,
  };

  const report: ReportEvent = {
    id: buildId("report"),
    clinicId,
    reporterName: DEMO_CONTROL_NAME,
    source: "demo_control",
    offlineCreated: false,
    submittedAt: now,
    receivedAt: now,
    status: nextClinicState.status,
    reason: nextClinicState.reason,
    staffPressure: nextClinicState.staffPressure,
    stockPressure: nextClinicState.stockPressure,
    queuePressure: nextClinicState.queuePressure,
    notes: "Triggered from demo controls to simulate a same-day medicine stockout.",
  };

  const alert: Alert = {
    id: buildId("alert"),
    clinicId,
    type: "stockout",
    severity: nextStatus === "non_functional" ? "critical" : "high",
    status: "open",
    recommendedAction:
      "Notify district pharmacy team, route patients to the nearest stocked clinic, and confirm replenishment ETA.",
    createdAt: now,
  };

  let nextAuditEvents = addAuditEvent(
    state.auditEvents,
    clinicId,
    DEMO_CONTROL_NAME,
    "demo.stockout_triggered",
    "Demo control triggered a stockout scenario for the clinic.",
    now,
  );

  nextAuditEvents = addAuditEvent(
    nextAuditEvents,
    clinicId,
    DEMO_CONTROL_NAME,
    "clinic.status_changed",
    `${nextStatus === "non_functional" ? "Clinic marked non-functional" : "Clinic marked degraded"} after stockout update.`,
    now,
  );

  nextAuditEvents = addAuditEvent(
    nextAuditEvents,
    clinicId,
    DEMO_CONTROL_NAME,
    "alert.created",
    "Stockout alert created from demo trigger.",
    now,
  );

  return {
    ...cloneState(state),
    clinicStates: upsertClinicState(state.clinicStates, nextClinicState),
    reports: addReportEvent(state.reports, report),
    alerts: [alert, ...replaceAlertsForClinic(state.alerts, clinicId, ["stockout"])],
    auditEvents: nextAuditEvents,
  };
}

export function triggerStaffingShortageScenario(
  state: DemoState,
  clinicId: string,
  now = new Date().toISOString(),
): DemoState {
  const currentState = state.clinicStates.find((entry) => entry.clinicId === clinicId);

  if (!currentState) {
    return state;
  }

  const nextClinicState: ClinicCurrentState = {
    ...currentState,
    status: "degraded",
    reason: "Critical nurse shortage is constraining throughput and priority services.",
    freshness: getFreshnessFromTimestamp(now, new Date(now)),
    lastReportedAt: now,
    reporterName: DEMO_CONTROL_NAME,
    source: "demo_control",
    staffPressure: "critical",
    queuePressure: "high",
  };

  const report: ReportEvent = {
    id: buildId("report"),
    clinicId,
    reporterName: DEMO_CONTROL_NAME,
    source: "demo_control",
    offlineCreated: false,
    submittedAt: now,
    receivedAt: now,
    status: "degraded",
    reason: nextClinicState.reason,
    staffPressure: "critical",
    stockPressure: nextClinicState.stockPressure,
    queuePressure: "high",
    notes: "Triggered from demo controls to simulate an acute staffing shortage.",
  };

  const alert: Alert = {
    id: buildId("alert"),
    clinicId,
    type: "staffing_shortage",
    severity: "high",
    status: "open",
    recommendedAction:
      "Redeploy floating staff, reduce non-urgent bookings, and broadcast updated wait times.",
    createdAt: now,
  };

  let nextAuditEvents = addAuditEvent(
    state.auditEvents,
    clinicId,
    DEMO_CONTROL_NAME,
    "demo.staffing_shortage_triggered",
    "Demo control triggered a staffing shortage scenario for the clinic.",
    now,
  );

  nextAuditEvents = addAuditEvent(
    nextAuditEvents,
    clinicId,
    DEMO_CONTROL_NAME,
    "clinic.status_changed",
    "Clinic marked degraded after staffing shortage update.",
    now,
  );

  nextAuditEvents = addAuditEvent(
    nextAuditEvents,
    clinicId,
    DEMO_CONTROL_NAME,
    "alert.created",
    "Staffing shortage alert created from demo trigger.",
    now,
  );

  return {
    ...cloneState(state),
    clinicStates: upsertClinicState(state.clinicStates, nextClinicState),
    reports: addReportEvent(state.reports, report),
    alerts: [alert, ...replaceAlertsForClinic(state.alerts, clinicId, ["staffing_shortage"])],
    auditEvents: nextAuditEvents,
  };
}

export function submitFieldReportScenario(
  state: DemoState,
  reportInput: SubmitFieldReportInput,
  now = new Date().toISOString(),
): DemoState {
  const submittedAt = reportInput.submittedAt ?? now;

  const report: ReportEvent = {
    ...reportInput,
    id: `report-${Math.random().toString(36).slice(2, 10)}`,
    submittedAt,
    receivedAt: reportInput.offlineCreated ? submittedAt : now,
    offlineCreated: !!reportInput.offlineCreated,
  };

  const previousClinicState = state.clinicStates.find((entry) => entry.clinicId === report.clinicId);
  const nextClinicState = buildClinicStateFromReport(state, {
    ...report,
    source: report.source,
  });

  const nextState = cloneState(state);
  nextState.reports = addReportEvent(state.reports, report);
  nextState.clinicStates = upsertClinicState(state.clinicStates, nextClinicState);

  let nextAuditEvents = addAuditEvent(
    state.auditEvents,
    report.clinicId,
    report.reporterName,
    "report.submitted",
    "Field worker submitted a clinic status report to the district surface.",
    now,
  );

  if (previousClinicState && previousClinicState.status !== report.status) {
    nextAuditEvents = addAuditEvent(
      nextAuditEvents,
      report.clinicId,
      report.reporterName,
      "clinic.status_changed",
      `${previousClinicState.status.replaceAll("_", " ")} -> ${report.status.replaceAll("_", " ")} report update from ${report.reporterName}.`,
      now,
    );

    nextState.alerts = nextState.alerts.filter((alert) => {
      if (alert.clinicId !== report.clinicId) {
        return true;
      }

      if (alert.type === "offline_queue_delay") {
        return alert.status === "resolved";
      }

      if (report.status === "operational" && alert.type === "clinic_down") {
        return false;
      }

      return true;
    });
  }

  nextState.auditEvents = nextAuditEvents;
  return nextState;
}

export function syncOfflineReportsScenario(
  state: DemoState,
  now = new Date().toISOString(),
): DemoState {
  if (state.offlineQueue.length === 0) {
    return state;
  }

  const nextState = cloneState(state);
  nextState.lastSyncAt = now;
  nextState.offlineQueue = [];

  for (const queuedReport of state.offlineQueue) {
    const syncedReport: ReportEvent = {
      id: queuedReport.id,
      clinicId: queuedReport.clinicId,
      reporterName: queuedReport.reporterName,
      source: queuedReport.source,
      offlineCreated: true,
      submittedAt: queuedReport.submittedAt,
      receivedAt: now,
      status: queuedReport.status,
      reason: queuedReport.reason,
      staffPressure: queuedReport.staffPressure,
      stockPressure: queuedReport.stockPressure,
      queuePressure: queuedReport.queuePressure,
      notes: queuedReport.notes,
    };

    const clinicState: ClinicCurrentState = {
      clinicId: queuedReport.clinicId,
      status: queuedReport.status,
      reason: queuedReport.reason,
      freshness: getFreshnessFromTimestamp(now, new Date(now)),
      lastReportedAt: now,
      reporterName: queuedReport.reporterName,
      source: queuedReport.source,
      staffPressure: queuedReport.staffPressure,
      stockPressure: queuedReport.stockPressure,
      queuePressure: queuedReport.queuePressure,
    };

    nextState.reports = addReportEvent(nextState.reports, syncedReport);
    nextState.clinicStates = upsertClinicState(nextState.clinicStates, clinicState);
    nextState.auditEvents = addAuditEvent(
      nextState.auditEvents,
      queuedReport.clinicId,
      queuedReport.reporterName,
      "report.synced",
      "Offline field report synced into the district feed.",
      now,
    );

    nextState.alerts = nextState.alerts.map((alert) =>
      alert.clinicId === queuedReport.clinicId && alert.type === "offline_queue_delay"
        ? {
            ...alert,
            status: "resolved",
          }
        : alert,
    );
  }

  nextState.auditEvents = addAuditEvent(
    nextState.auditEvents,
    state.offlineQueue[0].clinicId,
    DEMO_CONTROL_NAME,
    "demo.offline_sync_triggered",
    `Demo sync processed ${state.offlineQueue.length} offline report${state.offlineQueue.length === 1 ? "" : "s"}.`,
    now,
  );

  return nextState;
}

export function createQueuedOfflineReport(
  report: QueueOfflineReportInput,
  now = new Date().toISOString(),
): QueuedOfflineReport {
  return {
    ...report,
    submittedAt: report.submittedAt ?? now,
    id: buildId("offline-report"),
    offlineCreated: true,
    queuedAt: now,
    syncStatus: "queued",
  };
}
