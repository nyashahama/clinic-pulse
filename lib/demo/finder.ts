import type { ClinicRow, ClinicStatus } from "@/lib/demo/types";

const BASE_COORDS: [number, number] = [-25.74, 28.13];
const VALID_STATUSES: ClinicStatus[] = [
  "operational",
  "degraded",
  "non_functional",
  "unknown",
];

export type FinderFilters = {
  query?: string;
  service?: string;
  status?: string;
};

export type FinderClinicDistance = {
  clinic: ClinicRow;
  distanceKm: number;
};

export type FinderAlternative = FinderClinicDistance & {
  estimatedMinutes: number;
  compatibilityServices: string[];
  reason: string;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function isValidStatus(value: string): value is ClinicStatus {
  return VALID_STATUSES.includes(value as ClinicStatus);
}

export function estimateDistanceKm(lat: number, lng: number) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const [baseLat, baseLng] = BASE_COORDS;
  const dLat = toRadians(lat - baseLat);
  const dLng = toRadians(lng - baseLng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(baseLat)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) ** 2;

  return Math.max(0.3, 2 * 6371 * Math.asin(Math.sqrt(a)));
}

export function isClinicUnavailable(clinic: ClinicRow) {
  return (
    clinic.status === "non_functional" ||
    clinic.status === "unknown" ||
    clinic.freshness === "stale" ||
    clinic.freshness === "needs_confirmation"
  );
}

export function filterClinicRows(clinics: ClinicRow[], filters: FinderFilters) {
  const normalizedQuery = normalize(filters.query ?? "");
  const normalizedService = normalize(filters.service ?? "");
  const normalizedStatus = normalize(filters.status ?? "");
  const statusFilter = isValidStatus(normalizedStatus) ? normalizedStatus : null;

  return clinics.filter((clinic) => {
    if (statusFilter && clinic.status !== statusFilter) {
      return false;
    }

    if (
      normalizedService &&
      !clinic.services.some((item) => normalize(item).includes(normalizedService))
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const haystack = [
      clinic.name,
      clinic.district,
      clinic.facilityCode,
      clinic.services.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function sortClinicRowsByDistance(
  clinics: ClinicRow[],
): FinderClinicDistance[] {
  return clinics
    .map((clinic) => ({
      clinic,
      distanceKm: estimateDistanceKm(clinic.latitude, clinic.longitude),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm);
}

function getAlternativeRank(clinic: ClinicRow) {
  if (clinic.status === "operational" && clinic.freshness === "fresh") {
    return 0;
  }

  if (clinic.status === "operational") {
    return 1;
  }

  if (clinic.status === "degraded" && clinic.freshness !== "stale") {
    return 2;
  }

  return 3;
}

function getAlternativeReason(clinic: ClinicRow) {
  if (clinic.status === "operational" && clinic.freshness === "fresh") {
    return "Fresh operational report and compatible services are available.";
  }

  if (clinic.status === "operational") {
    return "Operational clinic with compatible services; latest freshness needs confirmation.";
  }

  return "Degraded fallback with compatible services when stronger options are unavailable.";
}

export function buildFinderAlternatives(
  clinics: ClinicRow[],
  sourceClinic: ClinicRow,
): FinderAlternative[] {
  if (!sourceClinic.services[0]) {
    return [];
  }

  return clinics
    .filter((candidate) => candidate.id !== sourceClinic.id)
    .filter((candidate) => candidate.status !== "non_functional")
    .filter((candidate) => candidate.status !== "unknown")
    .map((candidate) => {
      const compatibilityServices = candidate.services.filter((service) =>
        sourceClinic.services.includes(service),
      );

      if (compatibilityServices.length === 0) {
        return null;
      }

      const distanceKm = estimateDistanceKm(
        candidate.latitude,
        candidate.longitude,
      );

      return {
        clinic: candidate,
        distanceKm,
        estimatedMinutes: Math.max(5, Math.round(distanceKm * 2.8)),
        compatibilityServices,
        reason: getAlternativeReason(candidate),
      };
    })
    .filter((candidate): candidate is FinderAlternative => candidate !== null)
    .sort((left, right) => {
      const rankDelta =
        getAlternativeRank(left.clinic) - getAlternativeRank(right.clinic);

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return left.distanceKm - right.distanceKm;
    })
    .slice(0, 4);
}
