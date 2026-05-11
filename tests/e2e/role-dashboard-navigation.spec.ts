import { expect, test, type Locator, type Page } from "@playwright/test";

type SeededRole = "reporter" | "district_manager" | "org_admin" | "system_admin";

const password = "ClinicPulseDemo123!";

const roleScenarios: Array<{
  role: SeededRole;
  email: string;
  home: string;
  heading: string;
  sidebarLabels: string[];
  landmarks: string[];
}> = [
  {
    role: "reporter",
    email: "reporter@clinicpulse.local",
    home: "/field",
    heading: "Field workbench",
    sidebarLabels: ["Field Workbench", "Submit report", "Drafts and sync", "Recent reports"],
    landmarks: ["submit-report", "drafts-sync", "recent-reports"],
  },
  {
    role: "district_manager",
    email: "district-manager@clinicpulse.local",
    home: "/district",
    heading: "Unified severity queue",
    sidebarLabels: [
      "Command Center",
      "Severity queue",
      "Clinic network",
      "Clinic evidence",
      "Interventions",
    ],
    landmarks: [
      "severity-queue",
      "clinic-network",
      "clinic-evidence",
      "interventions",
      "verification-handoff",
      "report-review",
    ],
  },
  {
    role: "org_admin",
    email: "org-admin@clinicpulse.local",
    home: "/admin",
    heading: "Operations admin deck",
    sidebarLabels: [
      "Admin Overview",
      "Reporting coverage",
      "Users and roles",
      "Partner readiness",
      "Audit evidence",
      "Exports",
    ],
    landmarks: [
      "reporting-coverage",
      "users-roles",
      "admin-review-pressure",
      "partner-readiness",
      "audit-evidence",
      "exports",
    ],
  },
  {
    role: "system_admin",
    email: "system-admin@clinicpulse.local",
    home: "/admin",
    heading: "Platform operations deck",
    sidebarLabels: [
      "Platform Overview",
      "Tenant health",
      "Data ingestion",
      "Security",
      "Demo controls",
      "Audit evidence",
    ],
    landmarks: [
      "tenant-health",
      "data-ingestion",
      "admin-review-pressure",
      "security",
      "demo-controls",
      "audit-evidence",
    ],
  },
];

const hiddenStandaloneHrefs = [
  "/field/submit-report",
  "/field/drafts-sync",
  "/field/recent-reports",
  "/field/sync-queue",
  "/district/severity-queue",
  "/district/clinic-network",
  "/district/clinic-evidence",
  "/district/interventions",
  "/admin/reporting-coverage",
  "/admin/users-roles",
  "/admin/access-review",
  "/admin/partner-readiness",
  "/admin/audit-evidence",
  "/admin/exports",
  "/admin/tenant-health",
  "/admin/data-ingestion",
  "/admin/security",
  "/admin/demo-controls",
  "/admin/integrations",
];

const publicDashboardHrefs = [
  "/",
  "/book-demo",
  "/book-demo/thanks",
  "/finder",
  "/clinics",
  "/login",
  "/register",
];

async function signInAs(page: Page, email: string, home: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`${home.replace("/", "\\/")}$`));
}

async function openDashboardSidebar(page: Page): Promise<Locator> {
  const viewport = page.viewportSize();

  if (viewport && viewport.width < 768) {
    await page.getByRole("button", { name: "Toggle dashboard navigation" }).click();
    const mobileSidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]').first();
    await expect(mobileSidebar).toBeVisible();
    return mobileSidebar;
  }

  const desktopSidebar = page.locator('[data-slot="sidebar-inner"]').first();
  await expect(desktopSidebar).toBeVisible();
  return desktopSidebar;
}

function normalizeHrefPath(href: string | null) {
  if (!href) {
    return "";
  }

  return new URL(href, "http://clinicpulse.local").pathname;
}

function routeMatchesBaseOrSubpath(href: string | null, baseRoute: string) {
  const pathname = normalizeHrefPath(href);

  if (baseRoute === "/") {
    return pathname === "/";
  }

  return pathname === baseRoute || pathname.startsWith(`${baseRoute}/`);
}

async function getSidebarHrefs(sidebar: Locator) {
  return sidebar.locator("a[href]").evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href)),
  );
}

async function expectNoRouteMatches(sidebar: Locator, routes: string[]) {
  const hrefs = await getSidebarHrefs(sidebar);

  for (const route of routes) {
    expect(
      hrefs.filter((href) => routeMatchesBaseOrSubpath(href, route)),
      `${route} should be absent from sidebar hrefs`,
    ).toEqual([]);
  }
}

test.describe("phase 1 role dashboard navigation", () => {
  for (const scenario of roleScenarios) {
    test(`${scenario.role} lands on the correct home and sees the right sidebar`, async ({
      page,
    }) => {
      await signInAs(page, scenario.email, scenario.home);

      await expect(page.locator(`[data-role-dashboard="${scenario.role}"]`)).toBeVisible();
      await expect(page.getByRole("heading", { name: scenario.heading })).toBeVisible();

      const sidebar = await openDashboardSidebar(page);
      const navLinks = sidebar.locator('[data-slot="sidebar-content"] a[href]');

      await expect(navLinks).toHaveText(scenario.sidebarLabels);
      await expectNoRouteMatches(sidebar, hiddenStandaloneHrefs);
      await expectNoRouteMatches(sidebar, publicDashboardHrefs);
    });

    test(`${scenario.role} exposes role dashboard landmarks`, async ({ page }) => {
      await signInAs(page, scenario.email, scenario.home);

      for (const landmark of scenario.landmarks) {
        await expect(page.locator(`#${landmark}`)).toBeVisible();
      }
    });
  }

  test("demo showcase does not expose report review", async ({ page }) => {
    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    await page.goto("/demo");

    await expect(
      page.locator('[data-role-dashboard="district_manager"]').filter({ visible: true }),
    ).toBeVisible();
    await expect(page.locator("#report-review")).toHaveCount(0);
  });
});
