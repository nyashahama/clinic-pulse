import { expect, test, type Locator, type Page } from "@playwright/test";

const password = "ClinicPulseDemo123!";

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
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

async function clickSidebarLink(page: Page, name: string, path: string) {
  const sidebar = await openDashboardSidebar(page);
  const link = sidebar.getByRole("link", { name, exact: true }).first();

  await expect(link).toHaveAttribute("href", path);
  await link.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
}

async function expectIntegrationsModule(page: Page) {
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  await expect(page.locator('[data-admin-module="integrations"]')).toBeVisible();
  await expect(page.getByText("Partner API contract", { exact: true })).toBeVisible();
  await expect(page.getByText("Credential scope coverage", { exact: true })).toBeVisible();
  await expect(page.getByText("Webhook delivery evidence", { exact: true })).toBeVisible();
  await expect(page.getByText("Export package evidence", { exact: true })).toBeVisible();
}

test("organisation admin opens partner integrations from navigation", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await clickSidebarLink(page, "Integrations", "/admin/integrations");
  await expectIntegrationsModule(page);
});

test("system admin opens partner integrations from navigation", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await clickSidebarLink(page, "Integrations", "/admin/integrations");
  await expectIntegrationsModule(page);
});

test("partner integrations route exposes handoff evidence directly", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/integrations");
  await expectIntegrationsModule(page);
  await expect(page.getByText("$CLINICPULSE_PARTNER_API_KEY").first()).toBeVisible();
});
