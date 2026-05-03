import type {
  AlternativeApiResponse,
  AuditEventApiResponse,
  ClinicDetailApiResponse,
  CurrentStatusApiResponse,
  ReportApiResponse,
} from "@/lib/demo/api-types";
import type { FinderAlternative } from "@/lib/demo/finder";
import { getDemoImage } from "@/lib/demo/images";
import type {
  AuditEvent,
  Clinic,
  ClinicCurrentState,
  ClinicRow,
  ClinicStatus,
  DemoState,
  DemoImageKey,
  Freshness,
  QueuePressure,
  ReportEvent,
  ReportStreamItem,
  StaffPressure,
  StockPressure,
} from "@/lib/demo/types";

const DEFAULT_REPORTER_NAME = "ClinicPulse API";

const clinicStatuses: ClinicStatus[] = ["operational", "degraded", "non_functional", "unknown"];
const freshnessValues: Freshness[] = ["fresh", "needs_confirmation", "stale", "unknown"];
const staffPressures: StaffPressure[] = ["normal", "strained", "critical", "unknown"];
const stockPressures: StockPressure[] = ["normal", "low", "stockout", "unknown"];
const queuePressures: QueuePressure[] = ["low", "moderate", "high", "unknown"];
const reportSources: ReportEvent["source"][] = [
  "field_worker",
  "clinic_coordinator",
  "demo_control",
  "seed",
];
const auditEventTypes: AuditEvent["eventType"][] = [
  "demo.reset",
  "demo.stockout_triggered",
  "demo.staffing_shortage_triggered",
  "demo.offline_sync_triggered",
  "clinic.status_changed",
  "clinic.status_marked_stale",
  "report.submitted",
  "report.received_offline",
  "report.synced",
  "alert.created",
  "routing.alternative_recommended",
  "lead.demo_requested",
  "export.preview_opened",
  "api.preview_opened",
];

function includesValue<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && values.includes(value as T);
}

function mapClinicStatus(value: unknown): ClinicStatus {
  return includesValue(clinicStatuses, value) ? value : "unknown";
}

function mapFreshness(value: unknown): Freshness {
  return includesValue(freshnessValues, value) ? value : "unknown";
}

function mapStaffPressure(value: unknown): StaffPressure {
  return includesValue(staffPressures, value) ? value : "unknown";
}

function mapStockPressure(value: unknown): StockPressure {
  return includesValue(stockPressures, value) ? value : "unknown";
}

function mapQueuePressure(value: unknown): QueuePressure {
  return includesValue(queuePressures, value) ? value : "unknown";
}

function mapReportSource(value: unknown): ReportEvent["source"] {
  return includesValue(reportSources, value) ? value : "seed";
}

function mapAuditEventType(value: unknown): AuditEvent["eventType"] {
  return includesValue(auditEventTypes, value) ? value : "api.preview_opened";
}

function fallbackText(value: string | null | undefined, fallback = "") {
  return value ?? fallback;
}

function fallbackTimestamp(value: string | null | undefined, fallback: string) {
  return value ?? fallback;
}

export type MapApiClinicOptions = {
  imageKey?: DemoImageKey;
};

export type ApiDemoHydrationPayload = {
  clinics: ClinicDetailApiResponse[];
  reportsByClinicId: Partial<Record<string, ReportApiResponse[]>>;
  auditEventsByClinicId: Partial<Record<string, AuditEventApiResponse[]>>;
};

export type ApiFinderAlternative = Omit<
  FinderAlternative,
  "distanceKm" | "estimatedMinutes" | "reason"
> & {
  clinic: ClinicRow;
  clinicDetail: ClinicDetailApiResponse;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  reason: string;
  rankReason: string;
  reasonCode: string;
  matchedService: string;
};

export function mapApiClinicDetailToClinic(
  detail: ClinicDetailApiResponse,
  options: MapApiClinicOptions = {},
): Clinic {
  return {
    id: detail.clinic.id,
    name: detail.clinic.name,
    facilityCode: detail.clinic.facilityCode,
    province: detail.clinic.province,
    district: detail.clinic.district,
    latitude: detail.clinic.latitude ?? 0,
    longitude: detail.clinic.longitude ?? 0,
    services: detail.services.map((service) => service.serviceName),
    operatingHours: detail.clinic.operatingHours ?? "Hours unavailable",
    imageKey: options.imageKey ?? "clinic-front-01",
  };
}

export function mapApiCurrentStatus(
  status: CurrentStatusApiResponse | null | undefined,
  clinicId: string,
  fallbackReportedAt: string,
): ClinicCurrentState {
  if (!status) {
    return {
      clinicId,
      status: "unknown",
      reason: "No current status has been reported.",
      freshness: "unknown",
      lastReportedAt: fallbackReportedAt,
      reporterName: DEFAULT_REPORTER_NAME,
      source: "seed",
      staffPressure: "unknown",
      stockPressure: "unknown",
      queuePressure: "unknown",
    };
  }

  return {
    clinicId: status.clinicId,
    status: mapClinicStatus(status.status),
    reason: fallbackText(status.reason),
    freshness: mapFreshness(status.freshness),
    lastReportedAt: fallbackTimestamp(status.lastReportedAt, status.updatedAt),
    reporterName: fallbackText(status.reporterName, DEFAULT_REPORTER_NAME),
    source: mapReportSource(status.source),
    staffPressure: mapStaffPressure(status.staffPressure),
    stockPressure: mapStockPressure(status.stockPressure),
    queuePressure: mapQueuePressure(status.queuePressure),
  };
}

export function mapApiClinicDetailToClinicRow(
  detail: ClinicDetailApiResponse,
  options: MapApiClinicOptions = {},
): ClinicRow {
  const clinic = mapApiClinicDetailToClinic(detail, options);
  const status = mapApiCurrentStatus(detail.currentStatus, detail.clinic.id, detail.clinic.updatedAt);

  return {
    ...clinic,
    ...status,
    image: getDemoImage(clinic.imageKey),
  };
}

function getHydrationClinicImageKey(
  detail: ClinicDetailApiResponse,
  index: number,
  baseState: DemoState,
) {
  return (
    baseState.clinics.find((clinic) => clinic.id === detail.clinic.id)?.imageKey ??
    (index % 2 === 0 ? "clinic-front-01" : "clinic-front-02")
  );
}

export function mapApiDemoHydrationToState(
  payload: ApiDemoHydrationPayload,
  baseState: DemoState,
): DemoState {
  const clinics = payload.clinics.map((detail, index) =>
    mapApiClinicDetailToClinic(detail, {
      imageKey: getHydrationClinicImageKey(detail, index, baseState),
    }),
  );
  const clinicStates = payload.clinics.map((detail) =>
    mapApiCurrentStatus(detail.currentStatus, detail.clinic.id, detail.clinic.updatedAt),
  );
  const reports = payload.clinics.flatMap((detail) =>
    (payload.reportsByClinicId[detail.clinic.id] ?? []).map(mapApiReport),
  );
  const auditEvents = payload.clinics.flatMap((detail) =>
    (payload.auditEventsByClinicId[detail.clinic.id] ?? []).map(mapApiAuditEvent),
  );
  const clinicIds = new Set(clinics.map((clinic) => clinic.id));

  return {
    ...baseState,
    province: clinics[0]?.province ?? baseState.province,
    district: clinics[0]?.district ?? baseState.district,
    clinics,
    clinicStates,
    reports,
    // Alerts stay seeded Phase 2 demo context until the backend exposes alert hydration.
    alerts: baseState.alerts.filter((alert) => clinicIds.has(alert.clinicId)),
    auditEvents,
  };
}

export function mapApiReport(report: ReportApiResponse): ReportEvent {
  return {
    id: report.externalId ?? `report-${report.id}`,
    clinicId: report.clinicId,
    reporterName: fallbackText(report.reporterName, DEFAULT_REPORTER_NAME),
    source: mapReportSource(report.source),
    offlineCreated: report.offlineCreated,
    submittedAt: report.submittedAt,
    receivedAt: report.receivedAt,
    status: mapClinicStatus(report.status),
    reason: fallbackText(report.reason),
    staffPressure: mapStaffPressure(report.staffPressure),
    stockPressure: mapStockPressure(report.stockPressure),
    queuePressure: mapQueuePressure(report.queuePressure),
    notes: fallbackText(report.notes),
  };
}

export function mapApiReportToReportStreamItem(
  report: ReportApiResponse,
  clinic: ClinicDetailApiResponse,
): ReportStreamItem {
  return {
    ...mapApiReport(report),
    clinicName: clinic.clinic.name,
    facilityCode: clinic.clinic.facilityCode,
  };
}

export function mapApiAuditEvent(event: AuditEventApiResponse): AuditEvent {
  return {
    id: event.externalId ?? `audit-${event.id}`,
    clinicId: event.clinicId,
    actorName: fallbackText(event.actorName, DEFAULT_REPORTER_NAME),
    eventType: mapAuditEventType(event.eventType),
    summary: event.summary,
    createdAt: event.createdAt,
  };
}

export function mapApiAlternative(
  alternative: AlternativeApiResponse,
  options: MapApiClinicOptions = {},
): ApiFinderAlternative {
  const distanceKm = alternative.distanceKm ?? null;
  const matchedServices = alternative.matchedService ? [alternative.matchedService] : [];

  return {
    clinic: mapApiClinicDetailToClinicRow(alternative.clinic, options),
    clinicDetail: alternative.clinic,
    distanceKm,
    estimatedMinutes: distanceKm === null ? null : Math.max(5, Math.round(distanceKm * 2.8)),
    compatibilityServices: matchedServices,
    reason: alternative.rankReason,
    rankReason: alternative.rankReason,
    reasonCode: alternative.reasonCode,
    matchedService: alternative.matchedService,
  };
}
