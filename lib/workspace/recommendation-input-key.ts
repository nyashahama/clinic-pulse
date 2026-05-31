import type { ClinicRow } from "@/lib/workspace/types";

type RecommendationInputKeyOptions = {
  localClinics: ClinicRow[];
  requestedService: string;
  sourceClinic: ClinicRow;
};

function clinicSignature(clinic: ClinicRow) {
  return {
    freshness: clinic.freshness,
    id: clinic.id,
    lastReportedAt: clinic.lastReportedAt,
    reason: clinic.reason,
    services: [...clinic.services].sort(),
    status: clinic.status,
  };
}

export function buildRecommendationInputKey({
  localClinics,
  requestedService,
  sourceClinic,
}: RecommendationInputKeyOptions) {
  return JSON.stringify({
    candidates: localClinics
      .map(clinicSignature)
      .sort((left, right) => left.id.localeCompare(right.id)),
    requestedService,
    source: clinicSignature(sourceClinic),
  });
}
