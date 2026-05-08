import { describe, expect, it } from "vitest";

import type { AlternativeRecommendation } from "@/lib/demo/alternatives";
import {
  buildPatientJourneyImpact,
  formatImpactDistance,
  formatImpactMinutes,
} from "@/lib/demo/patient-journey";
import { createInitialDemoState } from "@/lib/demo/scenarios";
import { getClinicRows } from "@/lib/demo/selectors";
import type { ClinicRow } from "@/lib/demo/types";

function getRows() {
  return getClinicRows(createInitialDemoState());
}

function cloneClinic(row: ClinicRow, overrides: Partial<ClinicRow> = {}): ClinicRow {
  return {
    ...row,
    services: [...row.services],
    ...overrides,
  };
}

function recommendation(
  clinic: ClinicRow,
  overrides: Partial<AlternativeRecommendation> = {},
): AlternativeRecommendation {
  return {
    clinic,
    distanceKm: 6.4,
    estimatedMinutes: 18,
    compatibilityServices: ["Primary care", "Pharmacy"],
    reason: "Operational and fresh with requested service.",
    ...overrides,
  };
}

describe("buildPatientJourneyImpact", () => {
  it("builds a successful journey for an unavailable source and top recommendation", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      freshness: "fresh",
      reason: "Pharmacy stockout reported by field worker.",
    });
    const recommended = cloneClinic(rows[7], {
      id: "clinic-akasia-hills",
      name: "Akasia Hills Clinic",
      status: "operational",
      freshness: "fresh",
      services: ["Primary care", "Pharmacy", "Immunization"],
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(recommended)],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.sourceClinic.id).toBe(source.id);
    expect(impact.recommendedClinic?.id).toBe("clinic-akasia-hills");
    expect(impact.beforeOutcome).toBe("Wasted trip likely");
    expect(impact.afterOutcome).toBe("Best nearby compatible clinic chosen");
    expect(impact.impactMetrics.wastedTripAvoided).toBe(true);
    expect(impact.impactMetrics.estimatedWastedTravelMinutesSaved).toBeGreaterThan(0);
    expect(impact.impactMetrics.compatibleServices).toEqual(["Primary care", "Pharmacy"]);
    expect(impact.trustSignals.reason).toBe(source.reason);
    expect(impact.trustSignals.lastReportedAt).toBe(source.lastReportedAt);
    expect(impact.trustSignals.recommendation).toEqual({
      status: recommended.status,
      freshness: recommended.freshness,
      lastReportedAt: recommended.lastReportedAt,
      reason: "Operational and fresh with requested service.",
    });
  });

  it("uses the first eligible service-compatible recommendation without re-ranking alternatives", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const first = cloneClinic(rows[1], {
      id: "first-ranked",
      status: "unknown",
      freshness: "fresh",
    });
    const second = cloneClinic(rows[2], {
      id: "second-ranked",
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [
        recommendation(first, { distanceKm: 30 }),
        recommendation(second, { distanceKm: 1 }),
      ],
    });

    expect(impact.recommendedClinic?.id).toBe("second-ranked");
  });

  it("uses an existing ranked fallback recommendation when it covers the requested service", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const staleOperational = cloneClinic(rows[1], {
      id: "stale-ranked-fallback",
      status: "operational",
      freshness: "stale",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(staleOperational)],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.recommendedClinic?.id).toBe("stale-ranked-fallback");
  });

  it("returns no safe recommendation for non-functional or unknown targets", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const unknown = cloneClinic(rows[1], {
      status: "unknown",
      freshness: "fresh",
    });
    const nonFunctional = cloneClinic(rows[2], {
      status: "non_functional",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(unknown), recommendation(nonFunctional)],
    });

    expect(impact.state).toBe("no_safe_recommendation");
    expect(impact.recommendedClinic).toBeNull();
  });

  it("returns no safe recommendation when alternatives do not cover the requested service", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const incompatible = cloneClinic(rows[2], {
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [
        recommendation(incompatible, { compatibilityServices: [] }),
      ],
    });

    expect(impact.state).toBe("no_safe_recommendation");
    expect(impact.recommendedClinic).toBeNull();
    expect(impact.impactMetrics.wastedTripAvoided).toBe(false);
  });

  it("requires compatibility with the resolved requested service", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      services: ["Primary care", "Pharmacy"],
    });
    const partialMatch = cloneClinic(rows[1], {
      id: "partial-match",
      status: "operational",
      freshness: "fresh",
    });
    const fullMatch = cloneClinic(rows[2], {
      id: "full-match",
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Pharmacy",
      recommendations: [
        recommendation(partialMatch, {
          compatibilityServices: ["Primary care"],
        }),
        recommendation(fullMatch, {
          compatibilityServices: ["Pharmacy"],
        }),
      ],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.recommendedClinic?.id).toBe("full-match");
    expect(impact.impactMetrics.compatibleServices).toEqual(["Pharmacy"]);
  });

  it("matches requested service despite case and whitespace differences", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      services: ["Primary care", "Pharmacy"],
    });
    const recommended = cloneClinic(rows[1], {
      id: "normalized-match",
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "  pharmacy  ",
      recommendations: [
        recommendation(recommended, {
          compatibilityServices: [" Pharmacy "],
        }),
      ],
    });

    expect(impact.state).toBe("reroute_recommended");
    expect(impact.requestedService).toBe("pharmacy");
    expect(impact.recommendedClinic?.id).toBe("normalized-match");
  });

  it("does not claim a wasted trip avoided when the source clinic is available", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [recommendation(rows[1])],
    });

    expect(impact.state).toBe("available");
    expect(impact.recommendedClinic).toBeNull();
    expect(impact.impactMetrics.wastedTripAvoided).toBe(false);
    expect(impact.impactMetrics.estimatedWastedTravelMinutesSaved).toBeNull();
    expect(impact.afterOutcome).toBe("Source clinic available for routing");
  });

  it("returns a no-safe-recommendation state when an unavailable source has no alternatives", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [],
    });

    expect(impact.state).toBe("no_safe_recommendation");
    expect(impact.recommendedClinic).toBeNull();
    expect(impact.afterOutcome).toBe("No compatible safe recommendation available");
    expect(impact.impactMetrics.wastedTripAvoided).toBe(false);
  });

  it("preserves null recommendation distance and ETA without misleading text", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], {
      status: "non_functional",
      freshness: "fresh",
    });
    const recommended = cloneClinic(rows[1], {
      status: "operational",
      freshness: "fresh",
    });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "",
      recommendations: [
        recommendation(recommended, {
          distanceKm: null,
          estimatedMinutes: null,
          compatibilityServices: ["Primary care"],
        }),
      ],
    });

    expect(impact.requestedService).toBe(source.services[0]);
    expect(impact.impactMetrics.recommendedDistanceKm).toBeNull();
    expect(impact.impactMetrics.recommendedEstimatedMinutes).toBeNull();
    expect(formatImpactDistance(null)).toBe("Distance unavailable");
    expect(formatImpactMinutes(null)).toBe("Minutes unavailable");
  });

  it("labels saved minutes as avoided wasted travel instead of a shorter route", () => {
    expect(formatImpactMinutes(18)).toBe("18 min avoided wasted travel");
  });
});
