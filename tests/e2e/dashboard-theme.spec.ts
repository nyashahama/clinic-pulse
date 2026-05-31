import { expect, test, type Page } from "@playwright/test";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

const DARK_THEME_COLOR = "hsl(0 0% 7.1%)";
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

async function readDarkThemeSurfaceTokens(page: Page) {
  return page.evaluate(() => {
    const htmlStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);

    return {
      background: htmlStyles.getPropertyValue("--background").trim(),
      card: htmlStyles.getPropertyValue("--card").trim(),
      muted: htmlStyles.getPropertyValue("--muted").trim(),
      border: htmlStyles.getPropertyValue("--border").trim(),
      sidebar: htmlStyles.getPropertyValue("--sidebar").trim(),
      bgDefault: htmlStyles.getPropertyValue("--bg-default").trim(),
      bgMuted: htmlStyles.getPropertyValue("--bg-muted").trim(),
      bgSubtle: htmlStyles.getPropertyValue("--bg-subtle").trim(),
      borderDefault: htmlStyles.getPropertyValue("--border-default").trim(),
      contentDefault: htmlStyles.getPropertyValue("--content-default").trim(),
      bodyBackground: bodyStyles.backgroundColor,
    };
  });
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
      page.getByRole("heading", { name: "Organisation Governance Workbench" }),
    ).toBeVisible();

    await page.reload();
    await expectDarkTheme(page);
    await expectThemeColor(page, DARK_THEME_COLOR);
    await expect(
      page.getByRole("heading", { name: "Organisation Governance Workbench" }),
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
      page.getByRole("heading", { name: "Organisation Governance Workbench" }),
    ).toBeVisible();
  });

  test("uses Supabase Studio-style dark surface tiers on the authenticated dashboard", async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Use dark theme" }).click();
    await expectDarkTheme(page);

    const tokens = await readDarkThemeSurfaceTokens(page);

    expect(tokens).toMatchObject({
      background: "#121212",
      card: "#1f1f1f",
      muted: "#242424",
      border: "#2e2e2e",
      sidebar: "#171717",
      bgDefault: "31 31 31",
      bgMuted: "23 23 23",
      bgSubtle: "36 36 36",
      borderDefault: "46 46 46",
      contentDefault: "224 224 224",
    });
    expect(tokens.bodyBackground).toBe("rgb(18, 18, 18)");
  });
});
