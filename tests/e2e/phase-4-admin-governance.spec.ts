import { expect, test, type Page } from "@playwright/test";

const password = "ClinicPulseDemo123!";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/(admin|field|district)$/);
}

async function clickSidebarLink(page: Page, name: string, path: string) {
  const link = page
    .locator('[data-sidebar="sidebar"]')
    .getByRole("link", { name, exact: true })
    .first();

  await expect(link).toHaveAttribute("href", path);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
}

test("organisation admin sees real governance modules", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  for (const path of [
    "/admin/users-roles",
    "/admin/access-review",
    "/admin/reporting-coverage",
    "/admin/audit-evidence",
  ]) {
    await page.goto(path);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator("[data-admin-module]").first()).toBeVisible();
  }
});

test("desktop admin navigation opens standalone governance modules", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

  await signIn(page, "org-admin@clinicpulse.local");
  for (const [name, path] of [
    ["Reporting coverage", "/admin/reporting-coverage"],
    ["Users and roles", "/admin/users-roles"],
    ["Access review", "/admin/access-review"],
    ["Partner readiness", "/admin/partner-readiness"],
    ["Audit evidence", "/admin/audit-evidence"],
  ] as const) {
    await page.goto("/admin");
    await clickSidebarLink(page, name, path);
  }

  await signIn(page, "system-admin@clinicpulse.local");
  for (const [name, path] of [
    ["Tenant health", "/admin/tenant-health"],
    ["Data ingestion", "/admin/data-ingestion"],
    ["Security", "/admin/security"],
    ["Audit evidence", "/admin/audit-evidence"],
  ] as const) {
    await page.goto("/admin");
    await clickSidebarLink(page, name, path);
  }
});

test("organisation admin sees productized partner readiness module", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/partner-readiness");

  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  await expect(page.locator('[data-admin-module="partner-readiness"]')).toBeVisible();
  await expect(page.getByText("API key state")).toBeVisible();
  await expect(page.getByText("Export package state")).toBeVisible();
  await expect(page.getByText("Webhook preview state")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Integration checks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create key" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate export" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create webhook|Test webhook/ })).toBeVisible();
});

test("system admin sees productized platform governance modules", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");

  for (const adminModule of [
    {
      path: "/admin/tenant-health",
      marker: "tenant-health",
      content: [
        "Current tenant estate",
        "Clinic coverage",
        "Partner readiness evidence",
      ],
    },
    {
      path: "/admin/data-ingestion",
      marker: "data-ingestion",
      content: [
        "Ingestion pressure",
        "Offline queue",
        "Pending report evidence",
      ],
    },
    {
      path: "/admin/security",
      marker: "security",
      content: [
        "Security posture",
        "API key evidence",
        "Privileged access evidence",
      ],
    },
  ]) {
    await page.goto(adminModule.path);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator(`[data-admin-module="${adminModule.marker}"]`)).toBeVisible();

    for (const text of adminModule.content) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
  }
});
