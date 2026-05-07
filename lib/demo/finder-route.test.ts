import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDir = path.join(process.cwd(), "app");
const publicFinderPage = path.join(appDir, "finder", "page.tsx");
const publicFinderClient = path.join(appDir, "finder", "page-client.tsx");
const publicFinderComponent = path.join(process.cwd(), "components", "demo", "clinic-finder.tsx");
const demoFinderPage = path.join(appDir, "(demo)", "finder", "page.tsx");
const demoLayout = path.join(appDir, "(demo)", "layout.tsx");
const publicClinicDetailPage = path.join(appDir, "clinics", "[clinicId]", "page.tsx");
const legacyDemoClinicDetailPage = path.join(
  appDir,
  "(demo)",
  "clinics",
  "[clinicId]",
  "page.tsx",
);
const restrictedDemoClinicDetailPage = path.join(
  appDir,
  "(demo)",
  "demo",
  "clinics",
  "[clinicId]",
  "page.tsx",
);
const restrictedDemoClinicDetailClient = path.join(
  appDir,
  "(demo)",
  "demo",
  "clinics",
  "[clinicId]",
  "page-client.tsx",
);
const demoRunbook = path.join(process.cwd(), "lib", "demo", "demo-runbook.ts");

describe("public finder route boundary", () => {
  it("keeps /finder outside the authenticated demo route group", () => {
    expect(existsSync(publicFinderPage)).toBe(true);
    expect(existsSync(demoFinderPage)).toBe(false);
  });

  it("hydrates the public finder without demo-store or restricted clinic data", () => {
    expect(existsSync(publicFinderPage)).toBe(true);
    expect(existsSync(publicFinderClient)).toBe(true);

    const pageSource = readFileSync(publicFinderPage, "utf8");
    const clientSource = readFileSync(publicFinderClient, "utf8");

    expect(pageSource).toContain("fetchClinics");
    expect(pageSource).toContain("mapApiClinicDetailToClinicRow");
    expect(pageSource).not.toContain("fetchClinicReports");
    expect(pageSource).not.toContain("fetchClinicAuditEvents");
    expect(clientSource).not.toContain("useDemoStore");
    expect(clientSource).not.toContain("DemoShell");
  });

  it("uses role-aware authenticated hydration for the demo shell", () => {
    expect(existsSync(demoLayout)).toBe(true);

    const layoutSource = readFileSync(demoLayout, "utf8");

    expect(layoutSource).toContain("loadDemoHydrationForRole");
    expect(layoutSource).toContain("getSessionCookieHeader");
    expect(layoutSource).not.toContain("fetchClinics");
  });

  it("separates public clinic detail from authenticated operational clinic detail", () => {
    expect(existsSync(publicClinicDetailPage)).toBe(true);
    expect(existsSync(legacyDemoClinicDetailPage)).toBe(false);
    expect(existsSync(restrictedDemoClinicDetailPage)).toBe(true);
  });

  it("guards the operational clinic detail route while keeping client interactivity separate", () => {
    expect(existsSync(restrictedDemoClinicDetailPage)).toBe(true);
    expect(existsSync(restrictedDemoClinicDetailClient)).toBe(true);

    const pageSource = readFileSync(restrictedDemoClinicDetailPage, "utf8");
    const clientSource = readFileSync(restrictedDemoClinicDetailClient, "utf8");

    expect(pageSource).toContain('requireDemoWorkflowAccess("demo")');
    expect(pageSource).toContain("connection()");
    expect(pageSource).toContain("ClinicDetailPageClient");
    expect(pageSource).not.toContain('"use client"');
    expect(clientSource).toContain('"use client"');
    expect(clientSource).toContain("useDemoStore");
  });

  it("keeps the public clinic detail source free of restricted demo data", () => {
    expect(existsSync(publicClinicDetailPage)).toBe(true);

    const detailSource = readFileSync(publicClinicDetailPage, "utf8");

    expect(detailSource).toContain("fetchClinic");
    expect(detailSource).toContain("mapApiClinicDetailToClinicRow");
    expect(detailSource).not.toContain("useDemoStore");
    expect(detailSource).not.toContain("DemoShell");
    expect(detailSource).not.toContain("fetchClinicReports");
    expect(detailSource).not.toContain("fetchClinicAuditEvents");
    expect(detailSource).not.toMatch(/from\s+["']@\/lib\/demo\/reports/);
  });

  it("keeps public finder navigation public while operational clinic links use /demo", () => {
    expect(existsSync(publicFinderClient)).toBe(true);
    expect(existsSync(demoRunbook)).toBe(true);

    const clientSource = readFileSync(publicFinderClient, "utf8");
    const runbookSource = readFileSync(demoRunbook, "utf8");

    expect(clientSource).toContain("router.push(`/clinics/${clinicId}`)");
    expect(runbookSource).toContain('path: "/demo/clinics/clinic-mamelodi-east"');
    expect(runbookSource).not.toContain('path: "/clinics/clinic-mamelodi-east"');
  });

  it("uses a real map link for finder directions instead of inert row copy", () => {
    const componentSource = readFileSync(publicFinderComponent, "utf8");

    expect(componentSource).toContain("buildDirectionsUrl(selectedClinicRow)");
    expect(componentSource).toContain('target="_blank"');
    expect(componentSource).not.toContain('"Get directions"');
    expect(componentSource).not.toContain('"Directions reroute"');
  });

  it("defines a reusable patient journey impact component with patient and evidence variants", () => {
    const componentPath = path.join(
      process.cwd(),
      "components",
      "demo",
      "patient-journey-impact.tsx",
    );

    expect(existsSync(componentPath)).toBe(true);

    const componentSource = readFileSync(componentPath, "utf8");

    expect(componentSource).toContain("PatientJourneyImpactPanel");
    expect(componentSource).toContain('variant?: "patient" | "evidence"');
    expect(componentSource).toContain("Wasted trip avoided");
    expect(componentSource).toContain("No compatible safe recommendation");
    expect(componentSource).toContain("formatImpactDistance");
    expect(componentSource).toContain("formatImpactMinutes");
    expect(componentSource).toContain("trustSignals.reason");
    expect(componentSource).toContain("trustSignals.recommendation?.reason");
    expect(componentSource).toContain("afterDescription");
    expect(componentSource).toContain("is currently available for routing.");
    expect(componentSource).toContain("No alternative should be shown as safe");
  });

  it("shows patient journey impact in the finder before reroute recommendations", () => {
    const componentSource = readFileSync(publicFinderComponent, "utf8");
    const impactPanelIndex = componentSource.indexOf("<PatientJourneyImpactPanel");
    const reroutePanelIndex = componentSource.indexOf("<ReroutePanel");

    expect(componentSource).toContain("buildPatientJourneyImpact");
    expect(componentSource).toContain("PatientJourneyImpactPanel");
    expect(componentSource).toContain("sourceClinic: selectedClinicRow");
    expect(componentSource).toContain("requestedService: service");
    expect(componentSource).toContain("recommendations={recommendations}");
    expect(componentSource).toContain("recommendedDirectionsUrl");
    expect(componentSource).toContain("buildDirectionsUrl(patientJourneyImpact.recommendedClinic)");
    expect(componentSource).toContain("Open recommended directions");
    expect(componentSource).toContain("recommendationsReady");
    expect(componentSource).toContain("selectedClinicRow && recommendationsReady");
    expect(componentSource).toContain('variant: "default"');
    expect(componentSource).toContain("Checking alternatives");
    expect(componentSource).toContain("Recommendation data is still loading");
    expect(componentSource).toContain("recommendationsReady || !isClinicUnavailable(selectedClinicRow)");
    expect(impactPanelIndex).toBeGreaterThanOrEqual(0);
    expect(reroutePanelIndex).toBeGreaterThanOrEqual(0);
    expect(impactPanelIndex).toBeLessThan(reroutePanelIndex);
  });

  it("shows patient journey evidence in operational clinic detail before reroute recommendations", () => {
    const clientSource = readFileSync(restrictedDemoClinicDetailClient, "utf8");
    const impactPanelIndex = clientSource.indexOf("<PatientJourneyImpactPanel");
    const reroutePanelIndex = clientSource.indexOf("<ReroutePanel");

    expect(clientSource).toContain("buildPatientJourneyImpact");
    expect(clientSource).toContain("PatientJourneyImpactPanel");
    expect(clientSource).toContain("sourceClinic: clinicRow");
    expect(clientSource).toContain("requestedService: clinicRow.services[0]");
    expect(clientSource).toContain("recommendations");
    expect(clientSource).toContain('variant="evidence"');
    expect(clientSource).toContain("recommendationsReady");
    expect(clientSource).toContain("clinicRow && recommendationsReady");
    expect(clientSource).toContain("Checking alternatives");
    expect(clientSource).toContain("Recommendation data is still loading");
    expect(clientSource).toContain("recommendationsReady || !unavailableClinic");
    expect(impactPanelIndex).toBeGreaterThanOrEqual(0);
    expect(reroutePanelIndex).toBeGreaterThanOrEqual(0);
    expect(impactPanelIndex).toBeLessThan(reroutePanelIndex);
  });
});
