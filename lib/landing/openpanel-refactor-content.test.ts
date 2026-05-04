import { describe, expect, it } from "vitest";

import {
  demoCta,
  featureCards,
  heroClinicRows,
  heroStats,
  landingHero,
  operatingGap,
  stakeholderProofItems,
  trustObjects,
  workflowSteps,
} from "@/lib/landing/openpanel-refactor-content";

function collectText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(collectText).join(" ");
  }

  if (value && typeof value === "object") {
    return Object.values(value).map(collectText).join(" ");
  }

  return "";
}

describe("OpenPanel-first landing content", () => {
  it("keeps the approved Clinic Pulse hero and booking CTAs", () => {
    expect(landingHero.title).toBe("Clinic Pulse");
    expect(landingHero.primaryCta.href).toBe("/?booking=1");
    expect(landingHero.secondaryCta.href).toBe("#flow");
    expect(landingHero.description).toContain("Live clinic availability");
  });

  it("covers the approved stakeholder, workflow, feature, and trust sections", () => {
    expect(stakeholderProofItems.map((item) => item.title)).toEqual([
      "District teams",
      "Field workers",
      "Clinic coordinators",
      "Patients",
    ]);
    expect(workflowSteps).toHaveLength(5);
    expect(workflowSteps.map((step) => step.title)).toEqual([
      "Field report",
      "Status update",
      "Coordinator review",
      "Patient reroute",
      "Audit record",
    ]);
    expect(featureCards.map((card) => card.title)).toEqual([
      "Field reports",
      "District console",
      "Patient rerouting",
    ]);
    expect(trustObjects.map((object) => object.label)).toEqual([
      "Freshness",
      "Source and permissions",
      "Audit ledger",
      "Exports and API",
      "Webhook readiness",
      "Offline queue",
    ]);
  });

  it("gives every product feature card a product miniature contract", () => {
    const miniatures = featureCards.map(
      (card) =>
        (
          card as {
            miniature?: {
              type: string;
              rows: readonly string[];
            };
          }
        ).miniature,
    );

    expect(miniatures.map((miniature) => miniature?.type)).toEqual([
      "field-report",
      "district-console",
      "patient-reroute",
    ]);
    miniatures.forEach((miniature) => {
      expect(miniature?.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("does not leak OpenPanel reference copy or unsupported claims", () => {
    const text = collectText([
      landingHero,
      stakeholderProofItems,
      workflowSteps,
      featureCards,
      trustObjects,
      heroClinicRows,
      heroStats,
      operatingGap,
      demoCta,
    ]);

    expect(text).not.toMatch(/OpenPanel|Mixpanel|GDPR|SOC 2|customers love us/i);
    expect(text).toMatch(/Clinic Pulse|ClinicPulse/);
  });
});
