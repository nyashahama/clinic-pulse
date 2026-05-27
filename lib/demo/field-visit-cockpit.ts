import type {
  ClinicRow,
  ClinicStatus,
  Freshness,
  OfflineReportQueueItem,
  OfflineReportQueueStatus,
} from "@/lib/demo/types";
import type { FieldLocationVerification } from "@/lib/demo/field-location-verification";

export type FieldVisitTone = "clear" | "attention" | "blocked" | "info";

export type OfflineReportStatusLabel = {
  label: string;
  detail: string;
  tone: FieldVisitTone;
};

export type FieldVisitItineraryRow = {
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  status: ClinicStatus;
  freshness: Freshness;
  reason: string;
  reporterName: string;
  lastReportedAt: string;
  distanceLabel: string;
  positionLabel: string;
  isSelected: boolean;
  queueLabel: string | null;
  tone: FieldVisitTone;
};

export type FieldVisitTaskQueueItem = {
  id: "active-stop" | "clinic-report" | "device-sync" | "district-review";
  title: string;
  description: string;
  stateLabel: string;
  href:
    | "/field#field-itinerary"
    | "/field#submit-report"
    | "/field#drafts-sync"
    | "/field#recent-reports";
  tone: FieldVisitTone;
};

export type FieldVisitCockpitViewModel = {
  selectedVisit: FieldVisitItineraryRow & {
    primaryActionLabel: "Start report" | "Continue report";
    secondaryActionLabel: "Change clinic";
  };
  itineraryRows: FieldVisitItineraryRow[];
  taskQueue: FieldVisitTaskQueueItem[];
  routePositionPercent: number;
  routePositionLabel: string;
  deviceStrip: {
    connectionLabel: "Online" | "Offline";
    savedOnDeviceCount: number;
    needsRetryCount: number;
    sentForReviewCount: number;
    lastSyncedLabel: string;
  };
};

type BuildFieldVisitCockpitViewModelInput = {
  clinics: ClinicRow[];
  selectedClinicId: string | null;
  offlineReports: OfflineReportQueueItem[];
  isOnline: boolean;
  lastSyncedAt: string | null;
  selectedVisitVerification?: FieldLocationVerification | null;
};

const WORKER_COORDS: [number, number] = [-25.74, 28.13];

const statusRiskRank: Record<ClinicStatus, number> = {
  non_functional: 50,
  degraded: 35,
  unknown: 25,
  operational: 0,
};

const freshnessRiskRank: Record<Freshness, number> = {
  stale: 24,
  needs_confirmation: 18,
  unknown: 12,
  fresh: 0,
};

const queueRiskRank: Partial<Record<OfflineReportQueueStatus, number>> = {
  conflict: 30,
  failed: 28,
  retry_wait: 24,
  queued: 12,
  syncing: 8,
};

export function getOfflineReportStatusLabel(
  status: OfflineReportQueueStatus,
): OfflineReportStatusLabel {
  if (status === "synced") {
    return {
      label: "Sent for district review",
      detail: "ClinicPulse accepted this device report.",
      tone: "clear",
    };
  }

  if (status === "syncing") {
    return {
      label: "Syncing",
      detail: "This report is being sent to ClinicPulse.",
      tone: "info",
    };
  }

  if (status === "retry_wait" || status === "failed") {
    return {
      label: "Needs retry",
      detail: "This report stayed on the device after a sync failure.",
      tone: "blocked",
    };
  }

  if (status === "conflict") {
    return {
      label: "Needs review",
      detail: "District review is needed before this report can be resolved.",
      tone: "blocked",
    };
  }

  return {
    label: "Saved on this device",
    detail: "This report will sync when ClinicPulse can be reached.",
    tone: "attention",
  };
}

function estimateDistance(lat: number, lng: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const [workerLat, workerLng] = WORKER_COORDS;
  const dLat = toRadians(lat - workerLat);
  const dLng = toRadians(lng - workerLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(workerLat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) ** 2;
  const km = 2 * 6371 * Math.asin(Math.sqrt(a));

  return `${km < 10 ? km.toFixed(1) : Math.round(km).toString()} km`;
}

function rowTone(
  clinic: ClinicRow,
  queuedItem: OfflineReportQueueItem | null,
): FieldVisitTone {
  if (
    clinic.status === "non_functional" ||
    queuedItem?.syncStatus === "conflict" ||
    queuedItem?.syncStatus === "failed" ||
    queuedItem?.syncStatus === "retry_wait"
  ) {
    return "blocked";
  }

  if (
    clinic.status === "degraded" ||
    clinic.status === "unknown" ||
    clinic.freshness === "stale" ||
    clinic.freshness === "needs_confirmation" ||
    queuedItem?.syncStatus === "queued"
  ) {
    return "attention";
  }

  return "clear";
}

function riskScore(clinic: ClinicRow, queuedItem: OfflineReportQueueItem | null) {
  return (
    statusRiskRank[clinic.status] +
    freshnessRiskRank[clinic.freshness] +
    (queuedItem ? (queueRiskRank[queuedItem.syncStatus] ?? 0) : 0)
  );
}

function buildOpenReportsByClinicId(offlineReports: OfflineReportQueueItem[]) {
  const openReportsByClinicId = new Map<string, OfflineReportQueueItem>();

  for (const report of offlineReports) {
    if (report.syncStatus === "synced") {
      continue;
    }

    if (!openReportsByClinicId.has(report.clinicId)) {
      openReportsByClinicId.set(report.clinicId, report);
    }
  }

  return openReportsByClinicId;
}

function sortClinicsByFieldRisk(
  clinics: ClinicRow[],
  offlineReports: OfflineReportQueueItem[],
) {
  const openReportsByClinicId = buildOpenReportsByClinicId(offlineReports);

  return clinics
    .map((clinic, index) => ({
      clinic,
      index,
      queuedItem: openReportsByClinicId.get(clinic.id) ?? null,
    }))
    .sort((left, right) => {
      const riskDelta =
        riskScore(right.clinic, right.queuedItem) -
        riskScore(left.clinic, left.queuedItem);

      return riskDelta === 0 ? left.index - right.index : riskDelta;
    });
}

export function getDefaultFieldVisitClinicId({
  clinics,
  offlineReports,
}: {
  clinics: ClinicRow[];
  offlineReports: OfflineReportQueueItem[];
}) {
  return sortClinicsByFieldRisk(clinics, offlineReports)[0]?.clinic.id ?? null;
}

function formatLastSynced(value: string | null) {
  if (!value) {
    return "Not synced yet";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCount(value: number, singular: string, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function buildTaskQueue({
  selectedVisit,
  savedOnDeviceCount,
  needsRetryCount,
  sentForReviewCount,
  isOnline,
  selectedVisitVerification,
}: {
  selectedVisit: FieldVisitItineraryRow;
  savedOnDeviceCount: number;
  needsRetryCount: number;
  sentForReviewCount: number;
  isOnline: boolean;
  selectedVisitVerification?: FieldLocationVerification | null;
}): FieldVisitTaskQueueItem[] {
  const clinicReportStateLabel =
    selectedVisit.queueLabel ??
    selectedVisitVerification?.statusLabel ??
    "Ready";
  const clinicReportDescription = selectedVisit.queueLabel
    ? "Resolve the saved status report before moving to the next stop."
    : selectedVisitVerification
      ? "Visit proof captured. Complete status, pressure, and notes."
      : "Capture status, staffing, stock, queue pressure, and notes.";
  const clinicReportTone =
    selectedVisit.queueLabel
      ? selectedVisit.tone
      : selectedVisitVerification?.tone ?? "info";

  return [
    {
      id: "active-stop",
      title: "Open active stop",
      description: `${selectedVisit.clinicName} is the selected visit for this reporting round.`,
      stateLabel: selectedVisit.positionLabel,
      href: "/field#field-itinerary",
      tone: selectedVisit.tone,
    },
    {
      id: "clinic-report",
      title: selectedVisit.queueLabel ? "Continue clinic report" : "Start clinic report",
      description: clinicReportDescription,
      stateLabel: clinicReportStateLabel,
      href: "/field#submit-report",
      tone: clinicReportTone,
    },
    {
      id: "device-sync",
      title: needsRetryCount > 0 ? "Retry device sync" : "Check device sync",
      description: isOnline
        ? "Send saved reports when ClinicPulse is reachable."
        : "Saved reports remain available on this browser while offline.",
      stateLabel:
        needsRetryCount > 0
          ? `${needsRetryCount} needs retry`
          : formatCount(savedOnDeviceCount, "saved", "saved"),
      href: "/field#drafts-sync",
      tone: needsRetryCount > 0 ? "blocked" : savedOnDeviceCount > 0 ? "attention" : "clear",
    },
    {
      id: "district-review",
      title: "District review handoff",
      description: "Confirm which submitted reports are already waiting for review.",
      stateLabel: formatCount(sentForReviewCount, "sent", "sent"),
      href: "/field#recent-reports",
      tone: sentForReviewCount > 0 ? "clear" : "info",
    },
  ];
}

export function buildFieldVisitCockpitViewModel({
  clinics,
  selectedClinicId,
  offlineReports,
  isOnline,
  lastSyncedAt,
  selectedVisitVerification = null,
}: BuildFieldVisitCockpitViewModelInput): FieldVisitCockpitViewModel {
  const sortedClinics = sortClinicsByFieldRisk(clinics, offlineReports);
  const selectedId = selectedClinicId ?? sortedClinics[0]?.clinic.id ?? "";

  const itineraryRows = sortedClinics.map(({ clinic, queuedItem }, index) => {
    const queueLabel = queuedItem
      ? getOfflineReportStatusLabel(queuedItem.syncStatus).label
      : null;

    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      facilityCode: clinic.facilityCode,
      status: clinic.status,
      freshness: clinic.freshness,
      reason: clinic.reason,
      reporterName: clinic.reporterName,
      lastReportedAt: clinic.lastReportedAt,
      distanceLabel: estimateDistance(clinic.latitude, clinic.longitude),
      positionLabel: `Stop ${index + 1} of ${clinics.length}`,
      isSelected: clinic.id === selectedId,
      queueLabel,
      tone: rowTone(clinic, queuedItem),
    } satisfies FieldVisitItineraryRow;
  });

  const selectedVisit =
    itineraryRows.find((row) => row.clinicId === selectedId) ??
    itineraryRows[0] ??
    ({
      clinicId: "",
      clinicName: "Select a clinic",
      facilityCode: "",
      status: "unknown",
      freshness: "unknown",
      reason: "No clinic selected.",
      reporterName: "No reporter",
      lastReportedAt: new Date(0).toISOString(),
      distanceLabel: "0 km",
      positionLabel: "Stop 0 of 0",
      isSelected: true,
      queueLabel: null,
      tone: "info",
    } satisfies FieldVisitItineraryRow);
  const selectedVisitIndex = itineraryRows.findIndex(
    (row) => row.clinicId === selectedVisit.clinicId,
  );
  const routePositionPercent =
    clinics.length === 0 || selectedVisitIndex < 0
      ? 0
      : Math.round(((selectedVisitIndex + 1) / clinics.length) * 100);

  const savedOnDeviceCount = offlineReports.filter((item) =>
    ["queued", "syncing", "retry_wait", "failed", "conflict"].includes(
      item.syncStatus,
    ),
  ).length;
  const needsRetryCount = offlineReports.filter((item) =>
    ["retry_wait", "failed", "conflict"].includes(item.syncStatus),
  ).length;
  const sentForReviewCount = offlineReports.filter(
    (item) => item.syncStatus === "synced",
  ).length;

  return {
    selectedVisit: {
      ...selectedVisit,
      primaryActionLabel: selectedVisit.queueLabel ? "Continue report" : "Start report",
      secondaryActionLabel: "Change clinic",
    },
    itineraryRows,
    taskQueue: buildTaskQueue({
      selectedVisit,
      savedOnDeviceCount,
      needsRetryCount,
      sentForReviewCount,
      isOnline,
      selectedVisitVerification,
    }),
    routePositionPercent,
    routePositionLabel: selectedVisit.positionLabel,
    deviceStrip: {
      connectionLabel: isOnline ? "Online" : "Offline",
      savedOnDeviceCount,
      needsRetryCount,
      sentForReviewCount,
      lastSyncedLabel: formatLastSynced(lastSyncedAt),
    },
  };
}
