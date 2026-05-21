import type { ClientAuthSession } from "@/lib/auth/api";
import {
  buildDistrictCommandCenter,
  type DistrictCommandClinicInput,
  type DistrictCommandFreshness,
  type DistrictCommandStatus,
  type DistrictSeverityQueueItem,
} from "@/lib/demo/district-command-center";
import { buildDistrictCommandClinicInputs } from "@/lib/demo/district-command-center-adapter";
import { getRecentReportStream } from "@/lib/demo/selectors";
import type { DemoState, ReportEvent } from "@/lib/demo/types";

export type DistrictSeverityQueueFilters = {
  status: DistrictCommandStatus | "all";
  freshness: DistrictCommandFreshness | "all";
  alertState: "all" | "active";
  offlineState: "all" | "queued";
  service: string | "all";
};

export type DistrictSeverityMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "clear" | "attention" | "blocked" | "info";
};

export type DistrictSeverityReportLink = {
  id: string;
  label: string;
  detail: string;
  href: string;
};

export type DistrictSeverityQueueItemWithFlags = DistrictSeverityQueueItem & {
  hasActiveAlert: boolean;
  isInOfflineQueue: boolean;
};

export type DistrictSeveritySelectedAction = {
  clinicHref: string;
  recommendedAction: string;
  verificationNeed: string;
  patientImpact: string;
  availableAlternatives: number;
  reportLinks: DistrictSeverityReportLink[];
};

export type DistrictSeverityQueueViewModel = {
  metrics: DistrictSeverityMetric[];
  filterOptions: {
    services: string[];
  };
  queue: DistrictSeverityQueueItemWithFlags[];
  selectedItem: DistrictSeverityQueueItemWithFlags | null;
  selectedAction: DistrictSeveritySelectedAction | null;
  emptyState: {
    title: string;
    description: string;
  };
};

export type BuildDistrictSeverityQueueViewModelInput = {
  state: DemoState;
  session: ClientAuthSession | null;
  filters: DistrictSeverityQueueFilters;
  selectedClinicId: string | null;
};

const RETURN_SOURCE = "district-severity-queue";

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA").format(value);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function encodeRouteId(value: string) {
  return encodeURIComponent(value);
}

function toQueueItemWithFlags(
  item: DistrictSeverityQueueItem,
  clinicInputsById: Map<string, DistrictCommandClinicInput>,
): DistrictSeverityQueueItemWithFlags {
  const input = clinicInputsById.get(item.clinicId);

  return {
    ...item,
    hasActiveAlert: Boolean(input?.hasActiveAlert),
    isInOfflineQueue: Boolean(input?.isInOfflineQueue),
  };
}

function clinicMatchesFilters(
  clinic: DistrictCommandClinicInput,
  filters: DistrictSeverityQueueFilters,
) {
  return (
    (filters.status === "all" || clinic.status === filters.status) &&
    (filters.freshness === "all" || clinic.freshness === filters.freshness) &&
    (filters.alertState === "all" || clinic.hasActiveAlert) &&
    (filters.offlineState === "all" || clinic.isInOfflineQueue) &&
    (filters.service === "all" || clinic.services.includes(filters.service))
  );
}

function buildMetrics(
  queue: DistrictSeverityQueueItemWithFlags[],
  state: DemoState,
): DistrictSeverityMetric[] {
  const criticalCount = queue.filter((item) => item.severityLabel === "critical").length;
  const freshnessRiskCount = queue.filter((item) => item.freshness !== "fresh").length;
  const offlineQueueCount = state.offlineQueue.length;

  return [
    {
      label: "Critical clinics",
      value: formatCount(criticalCount),
      detail: "Need same-day district action",
      tone: criticalCount > 0 ? "blocked" : "clear",
    },
    {
      label: "Freshness risk",
      value: formatCount(freshnessRiskCount),
      detail: "Stale, unknown, or needs-confirmation signals",
      tone: freshnessRiskCount > 0 ? "attention" : "clear",
    },
    {
      label: "Offline backlog",
      value: formatCount(offlineQueueCount),
      detail: "Queued reports waiting for sync",
      tone: offlineQueueCount > 0 ? "attention" : "clear",
    },
    {
      label: "Last sync",
      value: formatDate(state.lastSyncAt),
      detail: `${formatCount(state.reports.length)} reports in current scenario state`,
      tone: "info",
    },
  ];
}

function buildReportLinks(
  selectedClinicId: string,
  reports: ReportEvent[],
): DistrictSeverityReportLink[] {
  return reports
    .filter((report) => report.clinicId === selectedClinicId)
    .slice(0, 3)
    .map((report) => ({
      id: report.id,
      label: report.reason,
      detail: `${report.reporterName} - ${formatDate(report.receivedAt)}`,
      href: `/district/reports/${encodeRouteId(report.id)}?from=${RETURN_SOURCE}`,
    }));
}

export function buildDistrictSeverityQueueViewModel({
  filters,
  selectedClinicId,
  session,
  state,
}: BuildDistrictSeverityQueueViewModelInput): DistrictSeverityQueueViewModel {
  const clinicInputs = buildDistrictCommandClinicInputs(state);
  const clinicInputsById = new Map(clinicInputs.map((clinic) => [clinic.id, clinic]));
  const allCommandCenter = buildDistrictCommandCenter({
    session,
    clinics: clinicInputs,
    activeAlertCount: state.alerts.filter((alert) => alert.status !== "resolved").length,
    offlineQueueCount: state.offlineQueue.length,
    lastSyncAt: state.lastSyncAt,
    selectedClinicId,
  });
  const filteredClinicInputs = clinicInputs.filter((clinic) =>
    clinicMatchesFilters(clinic, filters),
  );
  const filteredCommandCenter = buildDistrictCommandCenter({
    session,
    clinics: filteredClinicInputs,
    activeAlertCount: filteredClinicInputs.filter((clinic) => clinic.hasActiveAlert).length,
    offlineQueueCount: filteredClinicInputs.filter((clinic) => clinic.isInOfflineQueue).length,
    lastSyncAt: state.lastSyncAt,
    selectedClinicId,
  });
  const queue = filteredCommandCenter.queue.map((item) =>
    toQueueItemWithFlags(item, clinicInputsById),
  );
  const selectedItem = filteredCommandCenter.selectedItem
    ? toQueueItemWithFlags(filteredCommandCenter.selectedItem, clinicInputsById)
    : null;
  const reports = getRecentReportStream(state);
  const selectedAction = selectedItem
    ? {
        clinicHref: `/district/clinics/${encodeRouteId(selectedItem.clinicId)}?from=${RETURN_SOURCE}`,
        recommendedAction: filteredCommandCenter.intervention.primaryAction.description,
        verificationNeed: filteredCommandCenter.intervention.verificationStep,
        patientImpact: selectedItem.patientImpact,
        availableAlternatives: selectedItem.availableAlternatives,
        reportLinks: buildReportLinks(selectedItem.clinicId, reports),
      }
    : null;

  return {
    metrics: buildMetrics(
      allCommandCenter.queue.map((item) => toQueueItemWithFlags(item, clinicInputsById)),
      state,
    ),
    filterOptions: {
      services: Array.from(new Set(clinicInputs.flatMap((clinic) => clinic.services))).sort(),
    },
    queue,
    selectedItem,
    selectedAction,
    emptyState: {
      title: clinicInputs.length === 0 ? "No clinic signal loaded" : "No clinics match these filters",
      description:
        clinicInputs.length === 0
          ? "The severity queue will populate when district clinic signals are available."
          : "Clear filters or broaden the service line to return to the full district queue.",
    },
  };
}
