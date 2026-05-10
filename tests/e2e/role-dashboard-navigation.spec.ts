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
    home: "/demo",
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
      "security",
      "demo-controls",
      "audit-evidence",
    ],
  },
];

const hiddenStandaloneHrefs = [
  "/demo/severity-queue",
  "/demo/clinic-network",
  "/demo/clinic-evidence",
  "/demo/interventions",
  "/field/submit-report",
  "/field/drafts-sync",
  "/field/recent-reports",
  "/field/sync-queue",
  "/admin/access-review",
  "/admin/audit-evidence",
  "/admin/data-ingestion",
  "/admin/demo-controls",
  "/admin/exports",
  "/admin/integrations",
  "/admin/partner-readiness",
  "/admin/reporting-coverage",
  "/admin/security",
  "/admin/tenant-health",
  "/admin/users-roles",
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

test.describe("phase 1 role dashboard navigation", () => {
  for (const scenario of roleScenarios) {
    test(`${scenario.role} lands on the correct home and sees the right sidebar`, async ({
      page,
    }) => {
      await signInAs(page, scenario.email, scenario.home);

      await expect(page.locator(`[data-role-dashboard="${scenario.role}"]`)).toBeVisible();
      await expect(page.getByRole("heading", { name: scenario.heading })).toBeVisible();

      const sidebar = await openDashboardSidebar(page);

      for (const label of scenario.sidebarLabels) {
        await expect(sidebar.getByText(label, { exact: true })).toBeVisible();
      }

      for (const hiddenHref of hiddenStandaloneHrefs) {
        await expect(sidebar.locator(`a[href="${hiddenHref}"]`)).toHaveCount(0);
      }

      await expect(sidebar.locator('a[href="/finder"]')).toHaveCount(0);
      await expect(sidebar.locator('a[href="/book-demo"]')).toHaveCount(0);
    });

    test(`${scenario.role} exposes role dashboard landmarks`, async ({ page }) => {
      await signInAs(page, scenario.email, scenario.home);

      for (const landmark of scenario.landmarks) {
        await expect(page.locator(`#${landmark}`)).toBeVisible();
      }
    });
  }
});
