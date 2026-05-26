import { describe, expect, it } from "vitest";

import {
  HIDDEN_DASHBOARD_PRIMARY_NAV_ROUTES,
  PUBLIC_DASHBOARD_NAV_EXCLUSIONS,
  getDashboardWorkspace,
} from "@/lib/product/workspace-config";
import type { AuthRole } from "@/lib/auth/api";

const roleHomes = {
  reporter: "/field",
  district_manager: "/district",
  org_admin: "/admin",
  system_admin: "/admin",
} satisfies Record<AuthRole, string>;

const expectedHiddenDashboardPrimaryNavRoutes = [
  "/field/submit-report",
  "/field/drafts-sync",
  "/field/recent-reports",
  "/field/sync-queue",
  "/admin/exports",
] as const;

const expectedPublicDashboardNavExclusions = [
  "/",
  "/book-demo",
  "/book-demo/thanks",
  "/finder",
  "/clinics",
  "/login",
  "/register",
] as const;

const expectedSidebarLabels = {
  reporter: ["Field Workbench", "Submit report", "Drafts and sync", "Recent reports"],
  district_manager: [
    "Command Center",
    "Severity queue",
    "Clinic network",
    "Clinic evidence",
    "Interventions",
  ],
  org_admin: [
    "Admin Overview",
    "Reporting coverage",
    "Users and roles",
    "Access review",
    "Partner readiness",
    "Integrations",
    "Audit evidence",
    "Exports",
  ],
  system_admin: [
    "Platform Overview",
    "Tenant health",
    "Reporting coverage",
    "Data ingestion",
    "Security",
    "Partner readiness",
    "Integrations",
    "Scenario controls",
    "Audit evidence",
  ],
} satisfies Record<AuthRole, string[]>;

function normalizeDashboardUrl(url: string) {
  return url.split(/[?#]/, 1)[0] ?? url;
}

function routeMatchesBaseOrSubpath(url: string | undefined, baseRoute: string) {
  if (!url) {
    return false;
  }

  const normalizedUrl = normalizeDashboardUrl(url);

  if (baseRoute === "/") {
    return normalizedUrl === "/";
  }

  return normalizedUrl === baseRoute || normalizedUrl.startsWith(`${baseRoute}/`);
}

function sidebarUrlsForRole(role: AuthRole) {
  const workspace = getDashboardWorkspace(role);

  return workspace.groups.flatMap((group) =>
    group.items.flatMap((item) => [
      item.url,
      ...(item.items?.map((subItem) => subItem.url) ?? []),
    ]),
  );
}

function sidebarLabelsForRole(role: AuthRole) {
  const workspace = getDashboardWorkspace(role);

  return workspace.groups.flatMap((group) =>
    group.items.flatMap((item) => [
      item.title,
      ...(item.items?.map((subItem) => subItem.title) ?? []),
    ]),
  );
}

function workspaceUrlsForRole(role: AuthRole) {
  const workspace = getDashboardWorkspace(role);

  return [
    workspace.homeUrl,
    workspace.primaryAction.url,
    ...sidebarUrlsForRole(role),
  ];
}

describe("product workspace navigation config", () => {
  it("exports the approved hidden primary nav routes", () => {
    expect(HIDDEN_DASHBOARD_PRIMARY_NAV_ROUTES).toEqual(expectedHiddenDashboardPrimaryNavRoutes);
  });

  it("exports the approved public sidebar exclusions", () => {
    expect(PUBLIC_DASHBOARD_NAV_EXCLUSIONS).toEqual(expectedPublicDashboardNavExclusions);
  });

  it.each(Object.entries(roleHomes) as Array<[AuthRole, string]>)(
    "keeps %s on the approved Phase 1 home",
    (role, homeUrl) => {
      expect(getDashboardWorkspace(role).homeUrl).toBe(homeUrl);
    },
  );

  it.each(Object.entries(expectedSidebarLabels) as Array<[AuthRole, string[]]>)(
    "exposes only the approved %s sidebar labels",
    (role, labels) => {
      expect(sidebarLabelsForRole(role)).toEqual(labels);
    },
  );

  it.each(Object.keys(roleHomes) as AuthRole[])(
    "hides unfinished standalone routes from %s primary navigation",
    (role) => {
      const urls = workspaceUrlsForRole(role);

      for (const hiddenRoute of expectedHiddenDashboardPrimaryNavRoutes) {
        expect(urls.some((url) => routeMatchesBaseOrSubpath(url, hiddenRoute))).toBe(false);
      }
    },
  );

  it.each(Object.keys(roleHomes) as AuthRole[])(
    "keeps public routes out of the authenticated %s workspace navigation",
    (role) => {
      const urls = workspaceUrlsForRole(role);

      for (const publicRoute of expectedPublicDashboardNavExclusions) {
        expect(urls.some((url) => routeMatchesBaseOrSubpath(url, publicRoute))).toBe(false);
      }
    },
  );

  it("keeps partner readiness visible to admin roles only", () => {
    expect(sidebarLabelsForRole("org_admin")).toContain("Partner readiness");
    expect(sidebarLabelsForRole("system_admin")).toContain("Partner readiness");
    expect(sidebarLabelsForRole("district_manager")).not.toContain("Partner readiness");
    expect(sidebarLabelsForRole("reporter")).not.toContain("Partner readiness");
  });

  it("links productized admin modules to their standalone pages", () => {
    expect(workspaceUrlsForRole("reporter")).toEqual(
      expect.arrayContaining([
        "/field#submit-report",
        "/field#drafts-sync",
        "/field#recent-reports",
      ]),
    );
    expect(workspaceUrlsForRole("district_manager")).toEqual(
      expect.arrayContaining([
        "/district/severity-queue",
        "/district/clinic-network",
        "/district/clinic-evidence",
        "/district/interventions",
      ]),
    );
    expect(workspaceUrlsForRole("org_admin")).toEqual(
      expect.arrayContaining([
        "/admin/reporting-coverage",
        "/admin/users-roles",
        "/admin/access-review",
        "/admin/partner-readiness",
        "/admin/integrations",
        "/admin/audit-evidence",
        "/admin/export-schema?from=admin",
      ]),
    );
    expect(workspaceUrlsForRole("system_admin")).toEqual(
      expect.arrayContaining([
        "/admin/tenant-health",
        "/admin/reporting-coverage",
        "/admin/data-ingestion",
        "/admin/security",
        "/admin/partner-readiness",
        "/admin/integrations",
        "/admin/demo-controls",
        "/admin/audit-evidence",
      ]),
    );
  });
});
