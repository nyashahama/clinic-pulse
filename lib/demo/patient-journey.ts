import type { AlternativeRecommendation } from "@/lib/demo/alternatives";
import { estimateDistanceKm, isClinicUnavailable } from "@/lib/demo/finder";
import type { ClinicRow } from "@/lib/demo/types";

export type PatientJourneyState =
  | "available"
  | "reroute_recommended"
  | "no_safe_recommendation";

export type PatientJourneyImpact = {
  state: PatientJourneyState;
  sourceClinic: ClinicRow;
  requestedService: string;
  recommendedClinic: ClinicRow | null;
  beforeOutcome: string;
  afterOutcome: string;
  impactMetrics: {
    wastedTripAvoided: boolean;
    sourceDistanceKm: number | null;
    recommendedDistanceKm: number | null;
    recommendedEstimatedMinutes: number | null;
    estimatedWastedTravelMinutesSaved: number | null;
    compatibleServices: string[];
  };
  trustSignals: {
    sourceStatus: ClinicRow["status"];
    sourceFreshness: ClinicRow["freshness"];
    recommendedStatus: ClinicRow["status"] | null;
    recommendedFreshness: ClinicRow["freshness"] | null;
    lastReportedAt: string | null;
    reason: string;
  };
};

export type BuildPatientJourneyImpactInput = {
  sourceClinic: ClinicRow;
  requestedService?: string;
  recommendations: AlternativeRecommendation[];
};

function isValidRecommendation(
  recommendation: AlternativeRecommendation,
  requestedService: string,
) {
  return (
    recommendation.compatibilityServices.length > 0 &&
    recommendation.compatibilityServices.includes(requestedService) &&
    !isClinicUnavailable(recommendation.clinic)
  );
}

function resolveRequestedService(sourceClinic: ClinicRow, requestedService?: string) {
  return requestedService?.trim() || sourceClinic.services[0] || "";
}

function estimateTravelMinutes(distanceKm: number | null) {
  if (distanceKm === null) {
    return null;
  }

  return Math.max(5, Math.round(distanceKm * 2.8));
}

function buildBaseImpact({
  sourceClinic,
  requestedService,
}: {
  sourceClinic: ClinicRow;
  requestedService: string;
}): Omit<PatientJourneyImpact, "state" | "recommendedClinic" | "beforeOutcome" | "afterOutcome"> {
  const sourceDistanceKm = estimateDistanceKm(sourceClinic.latitude, sourceClinic.longitude);

  return {
    sourceClinic,
    requestedService,
    impactMetrics: {
      wastedTripAvoided: false,
      sourceDistanceKm,
      recommendedDistanceKm: null,
      recommendedEstimatedMinutes: null,
      estimatedWastedTravelMinutesSaved: null,
      compatibleServices: [],
    },
    trustSignals: {
      sourceStatus: sourceClinic.status,
      sourceFreshness: sourceClinic.freshness,
      recommendedStatus: null,
      recommendedFreshness: null,
      lastReportedAt: sourceClinic.lastReportedAt,
      reason: sourceClinic.reason,
    },
  };
}

export function buildPatientJourneyImpact({
  sourceClinic,
  requestedService,
  recommendations,
}: BuildPatientJourneyImpactInput): PatientJourneyImpact {
  const resolvedService = resolveRequestedService(sourceClinic, requestedService);
  const base = buildBaseImpact({ sourceClinic, requestedService: resolvedService });

  if (!isClinicUnavailable(sourceClinic)) {
    return {
      ...base,
      state: "available",
      recommendedClinic: null,
      beforeOutcome: "Source clinic available",
      afterOutcome: "Source clinic available for routing",
    };
  }

  const topRecommendation = recommendations.find((recommendation) =>
    isValidRecommendation(recommendation, resolvedService),
  );

  if (!topRecommendation) {
    return {
      ...base,
      state: "no_safe_recommendation",
      recommendedClinic: null,
      beforeOutcome: "Wasted trip likely",
      afterOutcome: "No compatible safe recommendation available",
    };
  }

  return {
    ...base,
    state: "reroute_recommended",
    recommendedClinic: topRecommendation.clinic,
    beforeOutcome: "Wasted trip likely",
    afterOutcome: "Best nearby compatible clinic chosen",
    impactMetrics: {
      ...base.impactMetrics,
      wastedTripAvoided: true,
      recommendedDistanceKm: topRecommendation.distanceKm,
      recommendedEstimatedMinutes: topRecommendation.estimatedMinutes,
      estimatedWastedTravelMinutesSaved: estimateTravelMinutes(base.impactMetrics.sourceDistanceKm),
      compatibleServices: topRecommendation.compatibilityServices,
    },
    trustSignals: {
      ...base.trustSignals,
      recommendedStatus: topRecommendation.clinic.status,
      recommendedFreshness: topRecommendation.clinic.freshness,
      lastReportedAt: topRecommendation.clinic.lastReportedAt,
      reason: topRecommendation.reason,
    },
  };
}

export function formatImpactDistance(distanceKm: number | null) {
  return distanceKm === null ? "Distance unavailable" : `${distanceKm.toFixed(1)} km`;
}

export function formatImpactMinutes(minutes: number | null) {
  return minutes === null ? "Minutes unavailable" : `${minutes} min avoided wasted travel`;
}
