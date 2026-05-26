import { expect, test, type Page, type TestInfo } from "@playwright/test";

const password = "ClinicPulseDemo123!";

async function signInAsDistrictManager(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("district-manager@clinicpulse.local");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/district$/);
}

function skipUnlessMobileProject(testInfo: TestInfo) {
  test.skip(
    testInfo.project.name !== "mobile-chrome",
    "Mobile shell behavior is covered by the mobile-chrome project.",
  );
}

test.describe("product shell responsive behavior", () => {
  test("mobile header keeps shell actions reachable without horizontal overflow", async ({
    page,
  }, testInfo) => {
    skipUnlessMobileProject(testInfo);

    await signInAsDistrictManager(page);

    await expect(page.getByRole("button", { name: "Open command palette" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Toggle dashboard navigation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

    const headerOverflows = await page
      .locator('[data-slot="workspace-header"]')
      .evaluate((node) => node.scrollWidth > node.clientWidth);

    expect(headerOverflows).toBe(false);
  });

  test("mobile sidebar closes after navigating to a workspace module", async ({
    page,
  }, testInfo) => {
    skipUnlessMobileProject(testInfo);

    await signInAsDistrictManager(page);

    await page.getByRole("button", { name: "Toggle dashboard navigation" }).click();
    const mobileSidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]').first();
    await expect(mobileSidebar).toBeVisible();

    await mobileSidebar.getByRole("link", { name: "Severity queue" }).click();

    await expect(page).toHaveURL(/\/district\/severity-queue$/);
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
    await expect(
      page.getByRole("heading", { name: "Tshwane North District operating picture" }),
    ).toBeVisible();
    await expect(page.locator('[data-district-home="command-page"]')).toBeVisible();
    await expect(page.locator("[data-district-command-map]")).toBeVisible();
    await expect(page.locator("[data-district-route-map]")).toBeVisible();
    await expect(page.locator("[data-district-route-line]")).toHaveCount(3);
    await expect(page.locator("[data-district-route-summary]")).toContainText(
      "Recommended route",
    );
    await expect(page.locator("[data-district-command-queue]")).toBeVisible();
    await expect(page.locator("[data-district-decision-packet]")).toBeVisible();
    await expect(
      page.getByText("Supporting operations", { exact: true }),
    ).toHaveCount(1);
    await expect(page.locator("[data-district-map-pin-label]")).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "Console controls" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "District operations map" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Clinic table" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Clinic roster" })).toBeVisible();
    await expect(
      page
        .locator("#field-signal-stream")
        .getByRole("link", { name: /Open report detail/i }),
    ).toHaveCount(3);
    await expect(
      page.locator("#clinic-roster").getByRole("button", { name: /^Open$/ }),
    ).toHaveCount(4);
    await expect(page.getByRole("heading", { name: "Unified severity queue" })).toBeHidden();
  });

  test("district command home stays compact on mobile", async ({ page }, testInfo) => {
    skipUnlessMobileProject(testInfo);

    await signInAsDistrictManager(page);

    const mainScrollHeight = await page
      .locator("main.min-w-0.flex-1.overflow-y-auto")
      .evaluate((node) => node.scrollHeight);

    expect(mainScrollHeight).toBeLessThan(9000);
    await expect(page.locator("[data-district-map-pin-label]:visible")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Clinic table" })).toHaveCount(0);
  });
});
