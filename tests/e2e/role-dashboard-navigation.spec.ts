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
      "Access review",
      "Partner readiness",
      "Integrations",
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
      "Reporting coverage",
      "Data ingestion",
      "Security",
      "Partner readiness",
      "Integrations",
      "Scenario controls",
      "Audit evidence",
    ],
    landmarks: [
      "tenant-health",
      "reporting-coverage",
      "data-ingestion",
      "admin-review-pressure",
      "security",
      "partner-readiness",
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
  "/district/clinic-network",
  "/district/clinic-evidence",
  "/district/interventions",
  "/admin/exports",
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

  test("district manager opens severity queue as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Severity queue", exact: true });

    await expect(link).toHaveAttribute("href", "/district/severity-queue");
    await Promise.all([
      page.waitForURL(/\/district\/severity-queue$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-district-module="severity-queue"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unified severity queue" })).toBeVisible();
    await expect(page.locator("[data-district-severity-metrics]")).toBeVisible();
    await expect(page.locator("[data-district-severity-toolbar]")).toBeVisible();
    await expect(page.getByRole("button", { name: /Status filter/i })).toBeVisible();
    await expect(page.getByText("Selected clinic decision")).toBeVisible();
    await expect(page.getByText("Next step", { exact: true })).toBeVisible();
    await expect(page.getByText("Evidence", { exact: true })).toBeVisible();
    await expect(page.getByText("Recommended action")).toHaveCount(0);
    await expect(page.getByText("Signal summary")).toHaveCount(0);
    await expect(page.getByText("Operational timeline")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "View report evidence" })).toBeVisible();
    await expect(page.getByLabel("Severity queue worklist")).toBeVisible();
    const nextStepCallout = page.locator(
      "[data-district-severity-next-step]:visible",
    );
    await expect(nextStepCallout).toHaveAttribute("data-tone", "watch");
    const watchToneColor = await nextStepCallout.evaluate(
      (element) => getComputedStyle(element).borderLeftColor,
    );

    await page
      .getByLabel("Severity queue worklist")
      .getByRole("button", {
        name: /Akasia Hills Clinic, stable severity score 0/i,
      })
      .click();
    await expect(nextStepCallout).toHaveAttribute("data-tone", "stable");
    await expect
      .poll(() =>
        nextStepCallout.evaluate((element) => getComputedStyle(element).borderLeftColor),
      )
      .not.toBe(watchToneColor);

    const firstClinic = page.getByLabel("Severity queue worklist").getByRole("button").first();
    await expect(firstClinic).toBeVisible();
    await firstClinic.click();
    await expect(
      page.locator('[data-district-severity-row][aria-pressed="true"]'),
    ).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/district\/clinics\/[^?]+\?from=district-severity-queue$/),
      page.getByRole("link", { name: "Open clinic detail" }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  });

  test("demo showcase does not expose report review", async ({ page }) => {
    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    await page.goto("/demo");

    await expect(
      page.locator('[data-role-dashboard="district_manager"]').filter({ visible: true }),
    ).toBeVisible();
    await expect(page.locator("#report-review")).toHaveCount(0);
  });

  test("system admin opens scenario controls as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "system-admin@clinicpulse.local", "/admin");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Scenario controls", exact: true });

    await expect(link).toHaveAttribute("href", "/admin/demo-controls");
    await Promise.all([
      page.waitForURL(/\/admin\/demo-controls$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-admin-module="scenario-controls"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset scenario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trigger stockout" })).toBeVisible();
  });
});
