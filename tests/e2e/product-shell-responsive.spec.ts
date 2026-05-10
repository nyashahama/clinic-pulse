import { expect, test, type Page } from "@playwright/test";

const password = "ClinicPulseDemo123!";

async function signInAsDistrictManager(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("district-manager@clinicpulse.local");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/district$/);
}

test.describe("product shell responsive behavior", () => {
  test("mobile header keeps shell actions reachable without horizontal overflow", async ({
    page,
  }) => {
    await signInAsDistrictManager(page);

    await expect(page.getByRole("button", { name: "Open command palette" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Toggle dashboard navigation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    const headerOverflows = await page
      .locator('[data-slot="workspace-header"]')
      .evaluate((node) => node.scrollWidth > node.clientWidth);

    expect(headerOverflows).toBe(false);
  });

  test("mobile sidebar closes after navigating to a workspace anchor", async ({
    page,
  }) => {
    await signInAsDistrictManager(page);

    await page.getByRole("button", { name: "Toggle dashboard navigation" }).click();
    const mobileSidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]').first();
    await expect(mobileSidebar).toBeVisible();

    await mobileSidebar.getByRole("link", { name: "Severity queue" }).click();

    await expect(page).toHaveURL(/\/district#severity-queue$/);
    await expect(mobileSidebar).toBeHidden();
  });

  test("keeps demo showcase and district product routes separate", async ({ page }) => {
    await signInAsDistrictManager(page);
    await expect(page).toHaveURL(/\/district$/);

    await page.goto("/demo");
    await expect(page).toHaveURL(/\/demo$/);
    await expect(page.getByRole("heading", { name: "Unified severity queue" })).toBeVisible();

    await page.goto("/district");
    await expect(page).toHaveURL(/\/district$/);
    await expect(page.getByRole("heading", { name: "Unified severity queue" })).toBeVisible();
  });
});
