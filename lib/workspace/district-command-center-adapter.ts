import type {
  DistrictCommandClinicInput,
  DistrictCommandStatus,
  DistrictCommandTrend,
} from "@/lib/workspace/district-command-center";
import {
  getAlternativeClinics,
  getClinicRows,
  getRecentReportStream,
} from "@/lib/workspace/selectors";
import type { WorkspaceState } from "@/lib/workspace/types";

function statusRiskRank(status: DistrictCommandStatus) {
  if (status === "non_functional") {
    return 3;
  }

  if (status === "degraded") {
    return 2;
  }

  if (status === "unknown") {
    return 1;
  }

  return 0;
}

export function buildDistrictCommandClinicInputs(
  state: WorkspaceState,
): DistrictCommandClinicInput[] {
  const clinicRows = getClinicRows(state);
  const activeAlertClinicIds = new Set(
    state.alerts
      .filter((alert) => alert.status !== "resolved")
      .map((alert) => alert.clinicId),
  );
  const offlineQueueClinicIds = new Set(
    state.offlineQueue.map((report) => report.clinicId),
  );
  const reportStream = getRecentReportStream(state);
  const reportsByClinicId = new Map<string, typeof reportStream>();

  for (const report of reportStream) {
    const clinicReports = reportsByClinicId.get(report.clinicId) ?? [];
    clinicReports.push(report);
    reportsByClinicId.set(report.clinicId, clinicReports);
  }

  return clinicRows.map((clinic) => {
    const alternativeClinicIds = new Set<string>();

    for (const service of clinic.services) {
      for (const alternative of getAlternativeClinics(state, clinic.id, service)) {
        alternativeClinicIds.add(alternative.id);
      }
    }

    const clinicReports = reportsByClinicId.get(clinic.id) ?? [];
    const latestReport = clinicReports[0];
    const previousReport = clinicReports[1];
    let recentTrend: DistrictCommandTrend = "stable";

    if (!latestReport) {
      recentTrend = "unknown";
    } else if (previousReport) {
      const latestRisk = statusRiskRank(latestReport.status);
      const previousRisk = statusRiskRank(previousReport.status);

      if (latestRisk > previousRisk) {
        recentTrend = "worsening";
      } else if (latestRisk < previousRisk) {
        recentTrend = "improving";
      }
    }

    return {
      id: clinic.id,
      name: clinic.name,
      district: clinic.district,
      status: clinic.status,
      freshness: clinic.freshness,
      services: clinic.services,
      updatedAt: clinic.lastReportedAt,
      hasActiveAlert: activeAlertClinicIds.has(clinic.id),
      isInOfflineQueue: offlineQueueClinicIds.has(clinic.id),
      alternativeCount: alternativeClinicIds.size,
      recentTrend,
    };
  });
}
