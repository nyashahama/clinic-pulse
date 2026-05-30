import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDir = path.join(process.cwd(), "app");
const publicFinderPage = path.join(appDir, "finder", "page.tsx");
const publicFinderClient = path.join(appDir, "finder", "page-client.tsx");
const publicFinderComponent = path.join(process.cwd(), "components", "workspace", "clinic-finder.tsx");
const workspaceFinderPage = path.join(appDir, "(workspace)", "finder", "page.tsx");
const workspaceLayout = path.join(appDir, "(workspace)", "layout.tsx");
const publicClinicDetailPage = path.join(appDir, "clinics", "[clinicId]", "page.tsx");
const legacyWorkspaceClinicDetailPage = path.join(
  appDir,
  "(workspace)",
  "clinics",
  "[clinicId]",
  "page.tsx",
);
const restrictedWorkspaceClinicDetailPage = path.join(
  appDir,
  "(workspace)",
  "district",
  "clinics",
  "[clinicId]",
  "page.tsx",
);
const restrictedWorkspaceClinicDetailClient = path.join(
  appDir,
  "(workspace)",
  "district",
  "clinics",
  "[clinicId]",
  "page-client.tsx",
);
const workspaceRunbook = path.join(process.cwd(), "lib", "workspace", "operations-runbook.ts");

describe("public finder route boundary", () => {
  it("keeps /finder outside the authenticated workspace route group", () => {
    expect(existsSync(publicFinderPage)).toBe(true);
    expect(existsSync(workspaceFinderPage)).toBe(false);
  });

  it("hydrates the public finder without workspace-store or restricted clinic data", () => {
    expect(existsSync(publicFinderPage)).toBe(true);
    expect(existsSync(publicFinderClient)).toBe(true);

    const pageSource = readFileSync(publicFinderPage, "utf8");
    const clientSource = readFileSync(publicFinderClient, "utf8");

    expect(pageSource).toContain("fetchClinics");
    expect(pageSource).toContain("mapApiClinicDetailToClinicRow");
    expect(pageSource).not.toContain("fetchClinicReports");
    expect(pageSource).not.toContain("fetchClinicAuditEvents");
    expect(clientSource).not.toContain("useWorkspaceStore");
    expect(clientSource).not.toContain("WorkspaceShell");
  });

  it("uses role-aware authenticated hydration for the workspace shell", () => {
    expect(existsSync(workspaceLayout)).toBe(true);

    const layoutSource = readFileSync(workspaceLayout, "utf8");

    expect(layoutSource).toContain("loadWorkspaceHydrationForRole");
    expect(layoutSource).toContain("getSessionCookieHeader");
    expect(layoutSource).not.toContain("fetchClinics");
  });

  it("separates public clinic detail from authenticated operational clinic detail", () => {
    expect(existsSync(publicClinicDetailPage)).toBe(true);
    expect(existsSync(legacyWorkspaceClinicDetailPage)).toBe(false);
    expect(existsSync(restrictedWorkspaceClinicDetailPage)).toBe(true);
  });

  it("guards the operational clinic detail route while keeping client interactivity separate", () => {
    expect(existsSync(restrictedWorkspaceClinicDetailPage)).toBe(true);
    expect(existsSync(restrictedWorkspaceClinicDetailClient)).toBe(true);

    const pageSource = readFileSync(restrictedWorkspaceClinicDetailPage, "utf8");
    const clientSource = readFileSync(restrictedWorkspaceClinicDetailClient, "utf8");

    expect(pageSource).toContain('requireDashboardWorkflowAccess("district")');
    expect(pageSource).toContain("connection()");
    expect(pageSource).toContain("ClinicDetailPageClient");
    expect(pageSource).not.toContain('"use client"');
    expect(clientSource).toContain('"use client"');
    expect(clientSource).toContain("useWorkspaceStore");
  });

  it("keeps the public clinic detail source free of restricted seeded operating data", () => {
    expect(existsSync(publicClinicDetailPage)).toBe(true);

    const detailSource = readFileSync(publicClinicDetailPage, "utf8");

    expect(detailSource).toContain("fetchClinic");
    expect(detailSource).toContain("mapApiClinicDetailToClinicRow");
    expect(detailSource).not.toContain("useWorkspaceStore");
    expect(detailSource).not.toContain("WorkspaceShell");
    expect(detailSource).not.toContain("fetchClinicReports");
    expect(detailSource).not.toContain("fetchClinicAuditEvents");
    expect(detailSource).not.toMatch(/from\s+["']@\/lib\/workspace\/reports/);
  });

  it("keeps public finder navigation public while operational clinic links use /district", () => {
    expect(existsSync(publicFinderClient)).toBe(true);
    expect(existsSync(workspaceRunbook)).toBe(true);

    const clientSource = readFileSync(publicFinderClient, "utf8");
    const runbookSource = readFileSync(workspaceRunbook, "utf8");

    expect(clientSource).toContain("router.push(`/clinics/${clinicId}`)");
    expect(runbookSource).toContain('path: "/district/clinics/clinic-mabopane-station"');
    expect(runbookSource).not.toContain('path: "/clinics/clinic-mabopane-station"');
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
      "workspace",
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
    expect(componentSource).toContain("buildRecommendationInputKey");
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
    const clientSource = readFileSync(restrictedWorkspaceClinicDetailClient, "utf8");
    const impactPanelIndex = clientSource.indexOf("<PatientJourneyImpactPanel");
    const reroutePanelIndex = clientSource.indexOf("<ReroutePanel");

    expect(clientSource).toContain("buildPatientJourneyImpact");
    expect(clientSource).toContain("buildRecommendationInputKey");
    expect(clientSource).toContain("PatientJourneyImpactPanel");
    expect(clientSource).toContain("displayClinicRow");
    expect(clientSource).toContain("sourceClinic: displayClinicRow");
    expect(clientSource).toContain("requestedService: displayClinicRow.services[0]");
    expect(clientSource).toContain("recommendations");
    expect(clientSource).toContain('variant="evidence"');
    expect(clientSource).toContain("recommendationsReady");
    expect(clientSource).toContain("displayClinicRow && recommendationsReady");
    expect(clientSource).toContain("Checking alternatives");
    expect(clientSource).toContain("Recommendation data is still loading");
    expect(clientSource).toContain("recommendationsReady || !unavailableClinic");
    expect(impactPanelIndex).toBeGreaterThanOrEqual(0);
    expect(reroutePanelIndex).toBeGreaterThanOrEqual(0);
    expect(impactPanelIndex).toBeLessThan(reroutePanelIndex);
  });
});
