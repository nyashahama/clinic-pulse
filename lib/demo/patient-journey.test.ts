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
    expect(impact.trustSignals.reason).toBe("Operational and fresh with requested service.");
  });

  it("uses the first existing recommendation without re-ranking alternatives", () => {
    const rows = getRows();
    const source = cloneClinic(rows[0], { status: "non_functional" });
    const first = cloneClinic(rows[1], { id: "first-ranked" });
    const second = cloneClinic(rows[2], { id: "second-ranked" });

    const impact = buildPatientJourneyImpact({
      sourceClinic: source,
      requestedService: "Primary care",
      recommendations: [
        recommendation(first, { distanceKm: 30 }),
        recommendation(second, { distanceKm: 1 }),
      ],
    });

    expect(impact.recommendedClinic?.id).toBe("first-ranked");
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
