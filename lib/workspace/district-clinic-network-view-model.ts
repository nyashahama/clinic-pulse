import type { ClientAuthSession } from "@/lib/auth/api";
import {
  getActiveAlerts,
  getAlternativeClinics,
  getClinicRows,
  getRecentReportStream,
} from "@/lib/workspace/selectors";
import type {
  ClinicRow,
  ClinicStatus,
  WorkspaceState,
  Freshness,
} from "@/lib/workspace/types";

const RETURN_SOURCE = "district-clinic-network";

export type DistrictClinicNetworkFilters = {
  status: ClinicStatus | "all";
  freshness: Freshness | "all";
  source: ClinicRow["source"] | "all";
  service: string;
  query: string;
};

export type DistrictClinicNetworkTone = "clear" | "attention" | "blocked" | "info";

export type DistrictClinicNetworkMetric = {
  label: string;
  value: string;
  detail: string;
  tone: DistrictClinicNetworkTone;
};

export type DistrictClinicNetworkClinic = {
  id: string;
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  district: string;
  status: ClinicStatus;
  freshness: Freshness;
  source: ClinicRow["source"];
  services: string[];
  reason: string;
  reporterName: string;
  lastReportedAt: string;
  staffPressure: ClinicRow["staffPressure"];
  stockPressure: ClinicRow["stockPressure"];
  queuePressure: ClinicRow["queuePressure"];
  activeAlertCount: number;
  reportCount: number;
  alternativeCapacity: number;
  coverageLabel: string;
  clinicHref: string;
  latitude: number;
  longitude: number;
};

export type DistrictClinicNetworkRoutingAlternative = {
  clinicId: string;
  clinicName: string;
  facilityCode: string;
  status: ClinicStatus;
  freshness: Freshness;
  coverageLabel: string;
  matchedService: string;
  distanceLabel: string;
  clinicHref: string;
};

export type DistrictClinicNetworkSelectedClinic = DistrictClinicNetworkClinic & {
  recommendedAction: string;
  verificationNeed: string;
  networkRole: string;
  primaryService: string;
  routingAlternatives: DistrictClinicNetworkRoutingAlternative[];
};

export type DistrictClinicNetworkViewModel = {
  metrics: DistrictClinicNetworkMetric[];
  clinics: DistrictClinicNetworkClinic[];
  selectedClinic: DistrictClinicNetworkSelectedClinic | null;
  filterOptions: {
    services: string[];
    sources: ClinicRow["source"][];
  };
  coverage: {
    totalClinics: number;
    visibleClinics: number;
    routingReadyClinics: number;
    constrainedClinics: number;
    freshnessRiskClinics: number;
    alertClinics: number;
  };
  emptyState: {
    title: string;
    description: string;
  } | null;
};

type BuildDistrictClinicNetworkViewModelInput = {
  state: WorkspaceState;
  session: Pick<ClientAuthSession, "district" | "organisationName">;
  filters: DistrictClinicNetworkFilters;
  selectedClinicId: string | null;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(value);
}

function encodeRouteId(value: string) {
  return encodeURIComponent(value);
}

function estimateClinicDistanceKm(
  left: Pick<DistrictClinicNetworkClinic, "latitude" | "longitude">,
  right: Pick<ClinicRow, "latitude" | "longitude">,
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(right.latitude - left.latitude);
  const dLng = toRadians(right.longitude - left.longitude);
  const leftLat = toRadians(left.latitude);
  const rightLat = toRadians(right.latitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(dLng / 2) ** 2;

  return Math.max(0.1, 2 * earthRadiusKm * Math.asin(Math.sqrt(a)));
}

function formatDistanceLabel(distanceKm: number) {
  return `${new Intl.NumberFormat("en-ZA", {
    maximumFractionDigits: distanceKm < 10 ? 1 : 0,
  }).format(distanceKm)} km`;
}

function getStatusRiskRank(status: ClinicStatus) {
  if (status === "non_functional") {
    return 4;
  }

  if (status === "degraded") {
    return 3;
  }

  if (status === "unknown") {
    return 2;
  }

  return 1;
}

function getFreshnessRiskRank(freshness: Freshness) {
  if (freshness === "stale") {
    return 3;
  }

  if (freshness === "needs_confirmation") {
    return 2;
  }

  if (freshness === "unknown") {
    return 1;
  }

  return 0;
}

function clinicMatchesQuery(clinic: DistrictClinicNetworkClinic, query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return true;
  }

  const haystack = [
    clinic.clinicName,
    clinic.facilityCode,
    clinic.district,
    clinic.reason,
    clinic.reporterName,
    clinic.source,
    ...clinic.services,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function getCoverageLabel(clinic: ClinicRow, alternativeCapacity: number) {
  if (clinic.status === "operational" && clinic.freshness === "fresh") {
    return "Routing ready";
  }

  if (clinic.status === "non_functional") {
    return alternativeCapacity > 0 ? "Requires reroute" : "No spare capacity";
  }

  if (clinic.status === "degraded") {
    return "Overflow watch";
  }

  if (clinic.freshness !== "fresh") {
    return "Needs confirmation";
  }

  return "Watch";
}

function getSelectedAction(clinic: DistrictClinicNetworkClinic) {
  if (clinic.status === "non_functional") {
    return clinic.alternativeCapacity > 0
      ? "Keep public routing pointed to available alternatives and verify restoration timing."
      : "Escalate capacity coverage because no compatible alternative is currently ready.";
  }

  if (clinic.status === "degraded") {
    return "Monitor service pressure and prepare overflow routing before the clinic drops out.";
  }

  if (clinic.freshness !== "fresh") {
    return "Confirm the latest clinic state before changing routing or clearing intervention notes.";
  }

  return "Keep this clinic available for district routing and monitor normal reporting cadence.";
}

function getVerificationNeed(clinic: DistrictClinicNetworkClinic) {
  if (clinic.activeAlertCount > 0) {
    return "Confirm whether the open alert still reflects current service capacity.";
  }

  if (clinic.freshness !== "fresh") {
    return "Ask the clinic coordinator for a fresh service-state confirmation.";
  }

  return "No extra verification is needed beyond normal reporting cadence.";
}

function getNetworkRole(clinic: DistrictClinicNetworkClinic) {
  if (clinic.status === "operational" && clinic.alternativeCapacity > 0) {
    return "Alternative capacity node";
  }

  if (clinic.status === "non_functional") {
    return "Source of reroute demand";
  }

  if (clinic.status === "degraded") {
    return "Fragile capacity node";
  }

  return "Monitoring node";
}

function getRoutingAlternatives(
  state: WorkspaceState,
  clinic: DistrictClinicNetworkClinic,
): DistrictClinicNetworkRoutingAlternative[] {
  const alternatives = new Map<
    string,
    DistrictClinicNetworkRoutingAlternative & { distanceKm: number }
  >();

  for (const service of clinic.services) {
    for (const alternative of getAlternativeClinics(state, clinic.clinicId, service)) {
      const existing = alternatives.get(alternative.id);

      if (existing) {
        continue;
      }

      const distanceKm = estimateClinicDistanceKm(clinic, alternative);

      alternatives.set(alternative.id, {
        clinicId: alternative.id,
        clinicName: alternative.name,
        facilityCode: alternative.facilityCode,
        status: alternative.status,
        freshness: alternative.freshness,
        coverageLabel: getCoverageLabel(alternative, 0),
        matchedService: service,
        distanceKm,
        distanceLabel: formatDistanceLabel(distanceKm),
        clinicHref: `/district/clinics/${encodeRouteId(alternative.id)}?from=${RETURN_SOURCE}`,
      });
    }
  }

  return [...alternatives.values()]
    .sort((left, right) => {
      const statusDelta = getStatusRiskRank(left.status) - getStatusRiskRank(right.status);

      if (statusDelta !== 0) {
        return statusDelta;
      }

      return left.distanceKm - right.distanceKm;
    })
    .slice(0, 3)
    .map((alternative) => ({
      clinicId: alternative.clinicId,
      clinicName: alternative.clinicName,
      facilityCode: alternative.facilityCode,
      status: alternative.status,
      freshness: alternative.freshness,
      coverageLabel: alternative.coverageLabel,
      matchedService: alternative.matchedService,
      distanceLabel: alternative.distanceLabel,
      clinicHref: alternative.clinicHref,
    }));
}

function toNetworkClinic({
  activeAlertCounts,
  reportCounts,
  state,
}: {
  activeAlertCounts: Map<string, number>;
  reportCounts: Map<string, number>;
  state: WorkspaceState;
}) {
  return (clinic: ClinicRow): DistrictClinicNetworkClinic => {
    const alternativeClinicIds = new Set<string>();

    for (const service of clinic.services) {
      for (const alternative of getAlternativeClinics(state, clinic.id, service)) {
        alternativeClinicIds.add(alternative.id);
      }
    }

    const alternativeCapacity = alternativeClinicIds.size;

    return {
      id: clinic.id,
      clinicId: clinic.id,
      clinicName: clinic.name,
      facilityCode: clinic.facilityCode,
      district: clinic.district,
      status: clinic.status,
      freshness: clinic.freshness,
      source: clinic.source,
      services: clinic.services,
      reason: clinic.reason,
      reporterName: clinic.reporterName,
      lastReportedAt: clinic.lastReportedAt,
      staffPressure: clinic.staffPressure,
      stockPressure: clinic.stockPressure,
      queuePressure: clinic.queuePressure,
      activeAlertCount: activeAlertCounts.get(clinic.id) ?? 0,
      reportCount: reportCounts.get(clinic.id) ?? 0,
      alternativeCapacity,
      coverageLabel: getCoverageLabel(clinic, alternativeCapacity),
      clinicHref: `/district/clinics/${encodeRouteId(clinic.id)}?from=${RETURN_SOURCE}`,
      latitude: clinic.latitude,
      longitude: clinic.longitude,
    };
  };
}

function sortNetworkClinics(
  left: DistrictClinicNetworkClinic,
  right: DistrictClinicNetworkClinic,
) {
  const riskDelta =
    getStatusRiskRank(right.status) +
    getFreshnessRiskRank(right.freshness) +
    right.activeAlertCount * 2 -
    (getStatusRiskRank(left.status) +
      getFreshnessRiskRank(left.freshness) +
      left.activeAlertCount * 2);

  if (riskDelta !== 0) {
    return riskDelta;
  }

  return left.clinicName.localeCompare(right.clinicName);
}

function buildMetrics({
  alertClinics,
  constrainedClinics,
  freshnessRiskClinics,
  routingReadyClinics,
  totalClinics,
}: DistrictClinicNetworkViewModel["coverage"], scopeLabel: string): DistrictClinicNetworkMetric[] {
  return [
    {
      label: "Network coverage",
      value: formatCount(totalClinics),
      detail: `Clinics in ${scopeLabel}.`,
      tone: "info",
    },
    {
      label: "Routing ready",
      value: formatCount(routingReadyClinics),
      detail: "Fresh clinics available for patient routing.",
      tone: routingReadyClinics > 0 ? "clear" : "attention",
    },
    {
      label: "Constrained clinics",
      value: formatCount(constrainedClinics),
      detail: "Degraded or non-functional facilities.",
      tone: constrainedClinics > 0 ? "attention" : "clear",
    },
    {
      label: "Signals to verify",
      value: formatCount(freshnessRiskClinics + alertClinics),
      detail: "Stale signals plus clinics with open alerts.",
      tone: freshnessRiskClinics + alertClinics > 0 ? "blocked" : "clear",
    },
  ];
}

export function buildDistrictClinicNetworkViewModel({
  filters,
  selectedClinicId,
  session,
  state,
}: BuildDistrictClinicNetworkViewModelInput): DistrictClinicNetworkViewModel {
  const activeAlerts = getActiveAlerts(state);
  const activeAlertClinicIds = new Set(activeAlerts.map((alert) => alert.clinicId));
  const activeAlertCounts = new Map<string, number>();

  for (const alert of activeAlerts) {
    activeAlertCounts.set(alert.clinicId, (activeAlertCounts.get(alert.clinicId) ?? 0) + 1);
  }

  const reportCounts = new Map<string, number>();
  for (const report of getRecentReportStream(state)) {
    reportCounts.set(report.clinicId, (reportCounts.get(report.clinicId) ?? 0) + 1);
  }

  const allClinics = getClinicRows(state)
    .map(
      toNetworkClinic({
        activeAlertCounts,
        reportCounts,
        state,
      }),
    )
    .sort(sortNetworkClinics);

  const services = Array.from(new Set(allClinics.flatMap((clinic) => clinic.services))).sort(
    (left, right) => left.localeCompare(right),
  );
  const sources = Array.from(new Set(allClinics.map((clinic) => clinic.source))).sort(
    (left, right) => left.localeCompare(right),
  );

  const filteredClinics = allClinics.filter(
    (clinic) =>
      (filters.status === "all" || clinic.status === filters.status) &&
      (filters.freshness === "all" || clinic.freshness === filters.freshness) &&
      (filters.source === "all" || clinic.source === filters.source) &&
      (filters.service === "all" || clinic.services.includes(filters.service)) &&
      clinicMatchesQuery(clinic, filters.query),
  );

  const selectedBase =
    filteredClinics.find((clinic) => clinic.clinicId === selectedClinicId) ??
    filteredClinics[0] ??
    null;

  const selectedClinic: DistrictClinicNetworkSelectedClinic | null = selectedBase
    ? {
        ...selectedBase,
        recommendedAction: getSelectedAction(selectedBase),
        verificationNeed: getVerificationNeed(selectedBase),
        networkRole: getNetworkRole(selectedBase),
        primaryService: selectedBase.services[0] ?? "Primary care",
        routingAlternatives: getRoutingAlternatives(state, selectedBase),
      }
    : null;

  const routingReadyClinics = allClinics.filter(
    (clinic) => clinic.status === "operational" && clinic.freshness === "fresh",
  ).length;
  const constrainedClinics = allClinics.filter(
    (clinic) => clinic.status === "non_functional" || clinic.status === "degraded",
  ).length;
  const freshnessRiskClinics = allClinics.filter((clinic) => clinic.freshness !== "fresh").length;
  const alertClinics = activeAlertClinicIds.size;
  const scopeLabel = session.district ?? session.organisationName ?? state.district;
  const coverage = {
    totalClinics: allClinics.length,
    visibleClinics: filteredClinics.length,
    routingReadyClinics,
    constrainedClinics,
    freshnessRiskClinics,
    alertClinics,
  };

  return {
    metrics: buildMetrics(coverage, scopeLabel),
    clinics: filteredClinics,
    selectedClinic,
    filterOptions: {
      services,
      sources,
    },
    coverage,
    emptyState:
      filteredClinics.length === 0
        ? {
            title: "No clinics match these filters",
            description:
              "Clear filters or broaden the service line to return to the full district clinic network.",
          }
        : null,
  };
}
