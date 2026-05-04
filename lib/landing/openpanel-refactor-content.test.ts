import { describe, expect, it } from "vitest";

import {
  demoCta,
  featureCards,
  heroClinicRows,
  heroConsoleMetrics,
  heroConsoleNavItems,
  heroIncident,
  heroStats,
  landingHero,
  operatingGap,
  productSurfacePreviewRows,
  stakeholderProofItems,
  trustObjects,
  trustSystemPanels,
  workflowIncidentStages,
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
  const allowedPreviewTones = ["critical", "healthy", "neutral", "warning"];

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
    const previewRowKeys = Object.keys(productSurfacePreviewRows);

    expect(miniatures.map((miniature) => miniature?.type)).toEqual([
      "field-report",
      "district-console",
      "patient-reroute",
    ]);
    miniatures.forEach((miniature) => {
      expect(miniature?.rows.length).toBeGreaterThanOrEqual(2);
      expect(previewRowKeys).toContain(miniature?.type);
      miniature?.rows.forEach((row) => {
        expect(row).toMatch(/^[^:]+: .+$/);
      });
    });
  });

  it("defines richer product-reality preview data for landing surfaces", () => {
    expect(heroConsoleNavItems.map((item) => item.label)).toEqual([
      "District console",
      "Field reports",
      "Public finder",
      "Audit trail",
    ]);
    expect(heroConsoleMetrics.map((metric) => metric.label)).toEqual([
      "Clinics monitored",
      "Reports synced",
      "Freshness target",
    ]);
    expect(heroIncident.clinic).toBe("Mamelodi East Community Clinic");
    expect(heroIncident.recommendedRoute).toBe("Akasia Hills Clinic");
    expect(workflowIncidentStages.map((stage) => stage.surface)).toEqual([
      "Field report",
      "District alert",
      "Public finder",
      "Audit ledger",
    ]);
    expect(productSurfacePreviewRows["field-report"]).toHaveLength(4);
    expect(productSurfacePreviewRows["district-console"]).toHaveLength(4);
    expect(productSurfacePreviewRows["patient-reroute"]).toHaveLength(3);
    Object.values(productSurfacePreviewRows).forEach((rows) => {
      rows.forEach((row) => {
        expect(row).toEqual({
          label: expect.any(String),
          value: expect.any(String),
          tone: expect.any(String),
        });
        expect(row.label).not.toHaveLength(0);
        expect(row.value).not.toHaveLength(0);
        expect(allowedPreviewTones).toContain(row.tone);
      });
    });
    expect(trustSystemPanels.map((panel) => panel.title)).toEqual([
      "Audit event",
      "District export",
      "API response",
      "Webhook delivery",
    ]);
  });

  it("does not leak OpenPanel reference copy or unsupported claims", () => {
    const text = collectText([
      landingHero,
      stakeholderProofItems,
      workflowSteps,
      workflowIncidentStages,
      featureCards,
      productSurfacePreviewRows,
      trustObjects,
      trustSystemPanels,
      heroClinicRows,
      heroConsoleNavItems,
      heroConsoleMetrics,
      heroIncident,
      heroStats,
      operatingGap,
      demoCta,
    ]);

    expect(text).not.toMatch(/OpenPanel|Mixpanel|GDPR|SOC 2|customers love us/i);
    expect(text).toMatch(/Clinic Pulse|ClinicPulse/);
  });
});
