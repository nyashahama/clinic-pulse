import {
  DEMO_DISTRICT,
  DEMO_PROVINCE,
  STOCKOUT_TRIGGER_CLINIC_ID,
} from "@/lib/demo/clinics";
import { getFreshnessFromTimestamp } from "@/lib/demo/freshness";
import { getAlternativeClinics } from "@/lib/demo/selectors";
import type {
  Alert,
  AuditEvent,
  Clinic,
  ClinicCurrentState,
  ClinicStatus,
  DemoState,
  ReportEvent,
} from "@/lib/demo/types";

export const INCIDENT_REPLAY_SOURCE_CLINIC_ID = STOCKOUT_TRIGGER_CLINIC_ID;

const INCIDENT_REPLAY_ACTOR_NAME = "Incident replay";
const INCIDENT_REPLAY_FIELD_WORKER_NAME = "Incident replay field worker";
export const INCIDENT_REPLAY_ROUTED_SERVICE = "Pharmacy";

export type IncidentReplayStepId =
  | "field_report"
  | "district_alert"
  | "reroute"
  | "audit_event"
  | "partner_webhook";

export type IncidentReplayStep = {
  id: IncidentReplayStepId;
  title: string;
  durationMs: number;
};

export type IncidentReplayWebhookClinicSnapshot = {
  id: string;
  name: string;
  facilityCode: string;
  province: string;
  district: string;
};

export type IncidentReplayWebhookPreview = {
  deliveryStatus: "delivered";
  deliveredAt: string;
  clinic: IncidentReplayWebhookClinicSnapshot;
  status: ClinicStatus;
  reason: string;
  recommendedAlternative: IncidentReplayWebhookClinicSnapshot | null;
  summary: string;
};

function normalizeIdPart(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildReplayId(
  prefix: string,
  clinicId: string,
  stepId: IncidentReplayStepId,
  createdAt: string,
) {
  return [
    prefix,
    normalizeIdPart(clinicId),
    normalizeIdPart(stepId),
    normalizeIdPart(createdAt),
  ].join("-");
}

function cloneState(state: DemoState): DemoState {
  return {
    ...state,
    clinics: state.clinics.map((clinic) => ({ ...clinic })),
    clinicStates: state.clinicStates.map((clinicState) => ({ ...clinicState })),
    reports: state.reports.map((report) => ({ ...report })),
    alerts: state.alerts.map((alert) => ({ ...alert })),
    auditEvents: state.auditEvents.map((event) => ({ ...event })),
    leads: state.leads.map((lead) => ({ ...lead })),
    offlineQueue: state.offlineQueue.map((item) => ({ ...item })),
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

function addAuditEvent(
  auditEvents: AuditEvent[],
  clinicId: string,
  stepId: IncidentReplayStepId,
  actorName: string,
  eventType: AuditEvent["eventType"],
  summary: string,
  createdAt: string,
) {
  return [
    {
      id: buildReplayId("audit", clinicId, stepId, createdAt),
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

function replaceAlertsForClinic(alerts: Alert[], clinicId: string, alertType: Alert["type"]) {
  return alerts.filter((alert) => alert.clinicId !== clinicId || alert.type !== alertType);
}

function resolveSourceClinic(state: DemoState) {
  const clinic = state.clinics.find(
    (entry) => entry.id === INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  );
  const clinicState = state.clinicStates.find(
    (entry) => entry.clinicId === INCIDENT_REPLAY_SOURCE_CLINIC_ID,
  );

  if (!clinic || !clinicState) {
    return null;
  }

  return { clinic, clinicState };
}

function clinicSnapshot(clinic: Clinic): IncidentReplayWebhookClinicSnapshot {
  return {
    id: clinic.id,
    name: clinic.name,
    facilityCode: clinic.facilityCode,
    province: clinic.province,
    district: clinic.district,
  };
}

function resolveRecommendedAlternative(state: DemoState) {
  const alternatives = getAlternativeClinics(
    state,
    INCIDENT_REPLAY_SOURCE_CLINIC_ID,
    INCIDENT_REPLAY_ROUTED_SERVICE,
  );

  return alternatives[0] ?? null;
}

function buildWebhookSummary(
  clinic: IncidentReplayWebhookClinicSnapshot,
  recommendedAlternative: IncidentReplayWebhookClinicSnapshot | null,
) {
  if (recommendedAlternative) {
    return `Partner webhook delivered for ${clinic.name} with reroute to ${recommendedAlternative.name}.`;
  }

  return `Partner webhook delivered for ${clinic.name} with no alternative clinic available.`;
}

export const incidentReplaySteps: IncidentReplayStep[] = [
  {
    id: "field_report",
    title: "Field report",
    durationMs: 900,
  },
  {
    id: "district_alert",
    title: "District alert",
    durationMs: 875,
  },
  {
    id: "reroute",
    title: "Reroute recommendation",
    durationMs: 950,
  },
  {
    id: "audit_event",
    title: "Audit event",
    durationMs: 850,
  },
  {
    id: "partner_webhook",
    title: "Partner webhook",
    durationMs: 1000,
  },
];

export function buildIncidentReplayWebhookPreview(
  state: DemoState,
  dispatchedAt: string,
): IncidentReplayWebhookPreview {
  const resolved = resolveSourceClinic(state);
  const sourceClinic = resolved?.clinic ?? {
    id: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
    name: "Unknown clinic",
    facilityCode: "Unavailable",
    province: DEMO_PROVINCE,
    district: DEMO_DISTRICT,
    latitude: 0,
    longitude: 0,
    services: [],
    operatingHours: "Unavailable",
    imageKey: "clinic-front-01",
  };
  const sourceState = resolved?.clinicState ?? {
    clinicId: INCIDENT_REPLAY_SOURCE_CLINIC_ID,
    status: "unknown",
    reason: "No replay state available.",
    freshness: "unknown",
    lastReportedAt: dispatchedAt,
    reporterName: INCIDENT_REPLAY_FIELD_WORKER_NAME,
    source: "field_worker",
    staffPressure: "unknown",
    stockPressure: "unknown",
    queuePressure: "unknown",
  };
  const recommendedAlternative = resolveRecommendedAlternative(state);
  const recommendedAlternativeSnapshot = recommendedAlternative
    ? clinicSnapshot(recommendedAlternative)
    : null;

  return {
    deliveryStatus: "delivered",
    deliveredAt: dispatchedAt,
    clinic: clinicSnapshot(sourceClinic),
    status: sourceState.status,
    reason: sourceState.reason,
    recommendedAlternative: recommendedAlternativeSnapshot,
    summary: buildWebhookSummary(
      clinicSnapshot(sourceClinic),
      recommendedAlternativeSnapshot,
    ),
  };
}

export function applyIncidentReplayStep(
  state: DemoState,
  stepId: IncidentReplayStepId,
  now: string,
): DemoState {
  const resolved = resolveSourceClinic(state);

  if (!resolved) {
    return state;
  }

  const { clinic, clinicState } = resolved;
  const nextState = cloneState(state);

  switch (stepId) {
    case "field_report": {
      const report: ReportEvent = {
        id: buildReplayId("report", clinic.id, "field_report", now),
        clinicId: clinic.id,
        reporterName: INCIDENT_REPLAY_FIELD_WORKER_NAME,
        source: "field_worker",
        offlineCreated: false,
        submittedAt: now,
        receivedAt: now,
        status: "non_functional",
        reason: "Field worker confirmed the clinic is non-functional during the incident replay.",
        staffPressure: clinicState.staffPressure,
        stockPressure: "stockout",
        queuePressure: "high",
        notes: "Deterministic replay field report for the stockout incident.",
      };

      const nextClinicState: ClinicCurrentState = {
        ...clinicState,
        status: "non_functional",
        reason: report.reason,
        freshness: getFreshnessFromTimestamp(now, new Date(now)),
        lastReportedAt: now,
        reporterName: INCIDENT_REPLAY_FIELD_WORKER_NAME,
        source: "field_worker",
        staffPressure: clinicState.staffPressure,
        stockPressure: "stockout",
        queuePressure: "high",
      };

      nextState.reports = addReportEvent(nextState.reports, report);
      nextState.clinicStates = upsertClinicState(nextState.clinicStates, nextClinicState);
      nextState.auditEvents = addAuditEvent(
        nextState.auditEvents,
        clinic.id,
        "field_report",
        INCIDENT_REPLAY_FIELD_WORKER_NAME,
        "report.submitted",
        "Incident replay field report submitted for the stockout clinic.",
        now,
      );

      return nextState;
    }

    case "district_alert": {
      const alert: Alert = {
        id: buildReplayId("alert", clinic.id, "district_alert", now),
        clinicId: clinic.id,
        type: "stockout",
        severity: "critical",
        status: "open",
        recommendedAction:
          "Escalate the stockout, notify the district pharmacy team, and reroute patients.",
        createdAt: now,
      };

      nextState.alerts = [
        alert,
        ...replaceAlertsForClinic(nextState.alerts, clinic.id, "stockout"),
      ];
      nextState.auditEvents = addAuditEvent(
        nextState.auditEvents,
        clinic.id,
        "district_alert",
        INCIDENT_REPLAY_ACTOR_NAME,
        "alert.created",
        "Incident replay created a critical stockout alert for the clinic.",
        now,
      );

      return nextState;
    }

    case "reroute": {
      const recommendedAlternative = resolveRecommendedAlternative(state);
      const summary = recommendedAlternative
        ? `Incident replay recommended ${recommendedAlternative.name} for rerouted patients.`
        : "Incident replay could not identify an alternative clinic for rerouting.";

      nextState.auditEvents = addAuditEvent(
        nextState.auditEvents,
        clinic.id,
        "reroute",
        INCIDENT_REPLAY_ACTOR_NAME,
        "routing.alternative_recommended",
        summary,
        now,
      );

      return nextState;
    }

    case "audit_event": {
      nextState.auditEvents = addAuditEvent(
        nextState.auditEvents,
        clinic.id,
        "audit_event",
        INCIDENT_REPLAY_ACTOR_NAME,
        "clinic.status_changed",
        "Incident replay linked field report, district alert, and reroute decision.",
        now,
      );

      return nextState;
    }

    case "partner_webhook": {
      const preview = buildIncidentReplayWebhookPreview(state, now);

      nextState.auditEvents = addAuditEvent(
        nextState.auditEvents,
        clinic.id,
        "partner_webhook",
        INCIDENT_REPLAY_ACTOR_NAME,
        "partner.webhook_dispatched",
        preview.summary,
        now,
      );

      return nextState;
    }

    default:
      return state;
  }
}
