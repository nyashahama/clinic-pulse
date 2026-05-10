import { expect, test, type Page } from "@playwright/test";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

const DARK_THEME_COLOR = "hsl(240deg 10% 3.92%)";
const LIGHT_THEME_COLOR = "hsl(0 0% 100%)";

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(demoAccount.email);
  await page.getByLabel("Password").fill(demoAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function expectDarkTheme(page: Page) {
  await expect(page.locator("html")).toHaveClass(/(?:^|\s)dark(?:\s|$)/);
}

async function expectLightTheme(page: Page) {
  await expect(page.locator("html")).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/);
}

async function expectThemeColor(page: Page, color: string) {
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", color);
}

test.describe("authenticated dashboard theme controls", () => {
  test("persists selected dark theme across authenticated demo dashboard routes", async ({
    page,
  }) => {
    await signIn(page);

    await page.getByRole("button", { name: "Use dark theme" }).click();
    await expectDarkTheme(page);
    await expectThemeColor(page, DARK_THEME_COLOR);
    await expect(
      page.getByRole("heading", { name: "Operations admin deck" }),
    ).toBeVisible();

    await page.reload();
    await expectDarkTheme(page);
    await expectThemeColor(page, DARK_THEME_COLOR);
    await expect(
      page.getByRole("heading", { name: "Operations admin deck" }),
    ).toBeVisible();

    await page.goto("/demo");
    await expectDarkTheme(page);
    await expect(
      page.getByRole("heading", { name: "Unified severity queue" }),
    ).toBeVisible();

    await page.goto("/field");
    await expectDarkTheme(page);
    await expect(page.getByRole("heading", { name: "Field workbench" })).toBeVisible();

    await page.goto("/demo/clinics/clinic-mamelodi-east");
    await expectDarkTheme(page);
    await expect(
      page.getByRole("heading", { name: "Mamelodi East Community Clinic" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Use light theme" }).click();
    await expectLightTheme(page);
    await expectThemeColor(page, LIGHT_THEME_COLOR);
  });

  test("keeps the authenticated dashboard usable when system theme is selected", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await signIn(page);

    const systemTheme = page.getByRole("button", { name: "Use system theme" });
    await expect(systemTheme).toBeVisible();
    await systemTheme.click();
    await expect(systemTheme).toHaveAttribute("aria-pressed", "true");
    await expectDarkTheme(page);
    await expectThemeColor(page, DARK_THEME_COLOR);
    await expect(
      page.getByRole("heading", { name: "Operations admin deck" }),
    ).toBeVisible();
  });
});
