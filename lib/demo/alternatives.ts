import {
  fetchAlternatives,
  type ClinicPulseApiClientOptions,
} from "@/lib/demo/api-client";
import { mapApiAlternative } from "@/lib/demo/api-mappers";
import { buildFinderAlternatives } from "@/lib/demo/finder";
import type { ClinicRow } from "@/lib/demo/types";

export type AlternativeRecommendation = {
  clinic: ClinicRow;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  compatibilityServices: string[];
  reason: string;
};

type LoadAlternativeRecommendationsOptions = {
  sourceClinic: ClinicRow;
  localClinics: ClinicRow[];
  requestedService?: string;
  apiOptions?: ClinicPulseApiClientOptions;
  allowLocalFallback?: boolean;
  localFallback?: () => AlternativeRecommendation[];
  onFetchError?: (error: unknown) => void;
};

function allowsDevelopmentAlternativeFallback() {
  return process.env.NODE_ENV !== "production";
}

function findLocalClinic(clinics: ClinicRow[], clinicId: string) {
  return clinics.find((clinic) => clinic.id === clinicId);
}

function isCancelledRequest(error: unknown, signal: AbortSignal | null | undefined) {
  return signal?.aborted === true || (error instanceof Error && error.name === "AbortError");
}

export function resolveAlternativeService(
  sourceClinic: ClinicRow,
  requestedService: string | undefined,
) {
  const normalizedService = requestedService?.trim();

  return normalizedService || sourceClinic.services[0] || "";
}

export function buildFinderAlternativeFallback(
  clinics: ClinicRow[],
  sourceClinic: ClinicRow,
): AlternativeRecommendation[] {
  return buildFinderAlternatives(clinics, sourceClinic);
}

export async function fetchBackendAlternativeRecommendations({
  sourceClinic,
  localClinics,
  requestedService,
  apiOptions,
}: Omit<
  LoadAlternativeRecommendationsOptions,
  "allowLocalFallback" | "localFallback" | "onFetchError"
>): Promise<AlternativeRecommendation[]> {
  const service = resolveAlternativeService(sourceClinic, requestedService);

  if (!service) {
    return [];
  }

  const alternatives = await fetchAlternatives(sourceClinic.id, service, apiOptions);

  return alternatives.map((alternative) => {
    const localClinic = findLocalClinic(localClinics, alternative.clinic.clinic.id);
    const mapped = mapApiAlternative(alternative, {
      imageKey: localClinic?.imageKey,
    });

    return {
      clinic: mapped.clinic,
      distanceKm: mapped.distanceKm,
      estimatedMinutes: mapped.estimatedMinutes,
      compatibilityServices: mapped.compatibilityServices,
      reason: mapped.reason,
    };
  });
}

export async function loadAlternativeRecommendations({
  sourceClinic,
  localClinics,
  requestedService,
  apiOptions,
  allowLocalFallback = allowsDevelopmentAlternativeFallback(),
  localFallback,
  onFetchError,
}: LoadAlternativeRecommendationsOptions): Promise<AlternativeRecommendation[]> {
  try {
    return await fetchBackendAlternativeRecommendations({
      sourceClinic,
      localClinics,
      requestedService,
      apiOptions,
    });
  } catch (error) {
    if (isCancelledRequest(error, apiOptions?.init?.signal)) {
      return [];
    }

    onFetchError?.(error);

    // Development recovery only: keep the old client-side ranking available
    // while running the demo against a local or temporarily unavailable API.
    if (allowLocalFallback) {
      return localFallback?.() ?? buildFinderAlternativeFallback(localClinics, sourceClinic);
    }

    return [];
  }
}
