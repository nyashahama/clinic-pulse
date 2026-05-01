import { getDemoImage } from "@/lib/demo/images";
import type {
  Alert,
  Clinic,
  ClinicCurrentState,
  ClinicRow,
  ClinicStatus,
  DemoState,
  ReportEvent,
  ReportStreamItem,
} from "@/lib/demo/types";

function getClinicById(clinics: Clinic[], clinicId: string) {
  return clinics.find((clinic) => clinic.id === clinicId);
}

function getClinicStateById(clinicStates: ClinicCurrentState[], clinicId: string) {
  return clinicStates.find((state) => state.clinicId === clinicId);
}

function getSeverityRank(severity: Alert["severity"]) {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
    default:
      return 1;
  }
}

function sortByRecentTimestamp<T extends { createdAt?: string; receivedAt?: string }>(a: T, b: T) {
  const left = new Date(a.createdAt ?? a.receivedAt ?? 0).getTime();
  const right = new Date(b.createdAt ?? b.receivedAt ?? 0).getTime();
  return right - left;
}

function getDistanceScore(fromClinic: Clinic, candidate: Clinic) {
  const latDiff = fromClinic.latitude - candidate.latitude;
  const lngDiff = fromClinic.longitude - candidate.longitude;
  return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
}

export function getStatusCounts(state: DemoState): Record<ClinicStatus, number> {
  return state.clinicStates.reduce<Record<ClinicStatus, number>>(
    (counts, clinicState) => {
      counts[clinicState.status] += 1;
      return counts;
    },
    {
      operational: 0,
      degraded: 0,
      non_functional: 0,
      unknown: 0,
    },
  );
}

export function getClinicRows(state: DemoState): ClinicRow[] {
  return state.clinics
    .map((clinic) => {
      const clinicState = getClinicStateById(state.clinicStates, clinic.id);

      if (!clinicState) {
        return null;
      }

      return {
        ...clinic,
        ...clinicState,
        image: getDemoImage(clinic.imageKey),
      };
    })
    .filter((row): row is ClinicRow => row !== null)
    .sort(
      (left, right) =>
        new Date(right.lastReportedAt).getTime() - new Date(left.lastReportedAt).getTime(),
    );
}

export function getActiveAlerts(state: DemoState): Alert[] {
  return state.alerts
    .filter((alert) => alert.status !== "resolved")
    .sort((left, right) => {
      const severityDelta = getSeverityRank(right.severity) - getSeverityRank(left.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }

      return sortByRecentTimestamp(left, right);
    });
}

export function getClinicReports(state: DemoState, clinicId: string): ReportEvent[] {
  return state.reports
    .filter((report) => report.clinicId === clinicId)
    .sort((left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime());
}

export function getClinicAuditEvents(state: DemoState, clinicId: string) {
  return state.auditEvents
    .filter((event) => event.clinicId === clinicId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function getAlternativeClinics(
  state: DemoState,
  clinicId: string,
  service: string,
): ClinicRow[] {
  const sourceClinic = getClinicById(state.clinics, clinicId);

  if (!sourceClinic) {
    return [];
  }

  return getClinicRows(state)
    .filter((clinic) => clinic.id !== clinicId)
    .filter((clinic) => clinic.services.includes(service))
    .filter(
      (clinic) =>
        clinic.status === "operational" ||
        (clinic.status === "degraded" && clinic.freshness !== "stale"),
    )
    .sort((left, right) => {
      const leftStatusRank = left.status === "operational" ? 0 : 1;
      const rightStatusRank = right.status === "operational" ? 0 : 1;

      if (leftStatusRank !== rightStatusRank) {
        return leftStatusRank - rightStatusRank;
      }

      return getDistanceScore(sourceClinic, left) - getDistanceScore(sourceClinic, right);
    });
}

export function getRecentReportStream(state: DemoState): ReportStreamItem[] {
  return state.reports
    .map((report) => {
      const clinic = getClinicById(state.clinics, report.clinicId);

      if (!clinic) {
        return null;
      }

      return {
        ...report,
        clinicName: clinic.name,
        facilityCode: clinic.facilityCode,
      };
    })
    .filter((report): report is ReportStreamItem => report !== null)
    .sort((left, right) => new Date(right.receivedAt).getTime() - new Date(left.receivedAt).getTime());
}
