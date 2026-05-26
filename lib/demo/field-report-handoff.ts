import type { ClinicRow, ReportStreamItem } from "@/lib/demo/types";

type BuildFieldReportHandoffItemsInput = {
  clinics: ClinicRow[];
  reports: ReportStreamItem[];
  limit?: number;
};

function sortByReceivedAtDescending(
  left: Pick<ReportStreamItem, "receivedAt">,
  right: Pick<ReportStreamItem, "receivedAt">,
) {
  return Date.parse(right.receivedAt) - Date.parse(left.receivedAt);
}

function buildClinicUpdateItem(clinic: ClinicRow): ReportStreamItem {
  return {
    id: `clinic-update-${clinic.id}`,
    clinicId: clinic.id,
    clinicName: clinic.name,
    facilityCode: clinic.facilityCode,
    reporterName: clinic.reporterName,
    source: clinic.source,
    offlineCreated: false,
    submittedAt: clinic.lastReportedAt,
    receivedAt: clinic.lastReportedAt,
    status: clinic.status,
    reason: clinic.reason,
    staffPressure: clinic.staffPressure,
    stockPressure: clinic.stockPressure,
    queuePressure: clinic.queuePressure,
    notes: clinic.reason,
  };
}

export function buildFieldReportHandoffItems({
  clinics,
  reports,
  limit = 4,
}: BuildFieldReportHandoffItemsInput): ReportStreamItem[] {
  const sourceItems =
    reports.length > 0 ? reports : clinics.map((clinic) => buildClinicUpdateItem(clinic));

  return [...sourceItems].sort(sortByReceivedAtDescending).slice(0, limit);
}
