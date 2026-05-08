import { describe, expect, it } from "vitest";

import {
  demoCta,
  featureCards,
  incidentDemoCta,
  incidentFlowSteps,
  landingHero,
  liveIncidentHero,
  productSurfacePreviewRows,
  productOperationsModules,
  stakeholderImpactItems,
  statusGapTimeline,
  trustEvidencePanels,
  trustObjects,
} from "./openpanel-refactor-content";

import { landingPhotos } from "@/components/landing/photo-assets";

describe("landing page 2026 content", () => {
  it("anchors the page around the approved live operations incident", () => {
    expect(liveIncidentHero.title).toBe(
      "Know which clinics can help before patients travel.",
    );
    expect(liveIncidentHero.incident.clinic).toBe("Mamelodi East Community Clinic");
    expect(liveIncidentHero.incident.recommendedRoute).toBe("Akasia Hills Clinic");
    expect(liveIncidentHero.incident.auditId).toMatch(/^AUD-2026-/);
  });

  it("keeps every main landing chapter populated", () => {
    expect(stakeholderImpactItems).toHaveLength(4);
    expect(statusGapTimeline).toHaveLength(4);
    expect(incidentFlowSteps).toHaveLength(4);
    expect(productOperationsModules).toHaveLength(4);
    expect(trustEvidencePanels).toHaveLength(4);
  });

  it("uses local real-image assets for landing imagery", () => {
    expect(Object.values(landingPhotos).every((photo) => photo.src.startsWith("/"))).toBe(
      true,
    );
    expect(landingPhotos.heroClinic.alt).toContain("clinic");
    expect(landingPhotos.fieldWorker.alt).toContain("field");
    expect(landingPhotos.patientCare.alt).toContain("patient");
    stakeholderImpactItems.forEach((item) => {
      expect(item.photo in landingPhotos).toBe(true);
    });
  });

  it("does not invent customer logos or testimonials", () => {
    const serialized = JSON.stringify({
      incidentDemoCta,
      stakeholderImpactItems,
      trustEvidencePanels,
    }).toLowerCase();

    expect(serialized).not.toContain("trusted by");
    expect(serialized).not.toContain("testimonial");
    expect(serialized).not.toContain("customer logo");
  });

  it("routes public demo workspace access through sign in", () => {
    expect(incidentDemoCta.secondaryCta).toEqual({
      label: "Sign in to demo workspace",
      href: "/login",
    });
  });

  it("keeps current landing content available during migration", () => {
    expect(landingHero.title).toBe("Clinic Pulse");
    expect(landingHero.primaryCta.label).toBe("Book demo");
    expect(featureCards).toHaveLength(3);
    expect(Object.keys(productSurfacePreviewRows)).toEqual(
      expect.arrayContaining([
        "field-report",
        "district-console",
        "patient-reroute",
        "audit-ledger",
      ]),
    );
    expect(productSurfacePreviewRows["field-report"].length).toBeGreaterThan(0);
    expect(productSurfacePreviewRows["district-console"].length).toBeGreaterThan(0);
    expect(productSurfacePreviewRows["patient-reroute"].length).toBeGreaterThan(0);
    expect(productSurfacePreviewRows["audit-ledger"].length).toBeGreaterThan(0);
    expect(trustObjects.length).toBeGreaterThan(0);
    expect(demoCta.cta.label).toBe("Book demo");
  });
});
