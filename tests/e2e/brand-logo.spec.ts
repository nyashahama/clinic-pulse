import { expect, test, type Page } from "@playwright/test";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

function collectConsoleErrors(page: Page) {
  const messages: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });

  return messages;
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(demoAccount.email);
  await page.getByLabel("Password").fill(demoAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function openDashboardSidebar(page: Page) {
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

test.describe("ClinicPulse premium brand identity", () => {
  test("renders the shared brand mark on public and auth surfaces", async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await page.goto("/");
    const landingBrandLink = page.getByRole("link", { name: "ClinicPulse" }).first();
    await expect(landingBrandLink).toBeVisible();
    await expect(
      landingBrandLink.locator('[data-brand-mark="clinicpulse"]'),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-landing.png",
      fullPage: true,
      caret: "initial",
    });

    await page.goto("/login");
    await expect(page.getByRole("link", { name: "ClinicPulse" })).toBeVisible();
    await expect(
      page.getByRole("main").locator('[data-brand-mark="clinicpulse"]'),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-login.png",
      fullPage: true,
      caret: "initial",
    });

    await page.goto("/register");
    await expect(page.getByRole("link", { name: "ClinicPulse" })).toBeVisible();
    await expect(
      page.getByRole("main").locator('[data-brand-mark="clinicpulse"]'),
    ).toBeVisible();
    await page.screenshot({
      path: "test-results/brand-logo-register.png",
      fullPage: true,
      caret: "initial",
    });

    expect(consoleErrors).toEqual([]);
  });

  test("renders the shared brand mark in the dashboard sidebar", async ({ page }) => {
    const consoleErrors = collectConsoleErrors(page);

    await signIn(page);

    const sidebar = await openDashboardSidebar(page);
    const sidebarMark = sidebar.locator('[data-brand-mark="clinicpulse"]');
    await expect(sidebarMark).toBeVisible();
    await expect(sidebar.getByText("ClinicPulse").first()).toBeVisible();
    const markSvgBox = await sidebarMark.locator("svg").boundingBox();
    expect(markSvgBox).not.toBeNull();
    expect(markSvgBox?.width).toBeGreaterThan(20);
    await page.screenshot({
      path: "test-results/brand-logo-dashboard.png",
      fullPage: true,
      caret: "initial",
    });

    expect(consoleErrors).toEqual([]);
  });
});
