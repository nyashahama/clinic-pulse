import { expect, test, type Locator, type Page } from "@playwright/test";

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

type VisibleActionBackground = {
  actual: string;
  foreground: string;
  primary: string;
  text: string;
};

type ComputedSurface = {
  background: string;
  border: string;
  boxShadow: string;
  card: string;
  foreground: string;
  muted: string;
  popover: string;
  text: string;
};

async function readComputedSurface(locator: Locator): Promise<ComputedSurface> {
  await expect(locator).toBeVisible();

  return locator.evaluate((element) => {
    const readTokenColor = (token: string) => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = `var(${token})`;
      document.body.append(probe);
      const color = getComputedStyle(probe).backgroundColor;
      probe.remove();

      return color;
    };
    const styles = getComputedStyle(element);

    return {
      background: styles.backgroundColor,
      border: styles.borderColor,
      boxShadow: styles.boxShadow,
      card: readTokenColor("--card"),
      foreground: readTokenColor("--foreground"),
      muted: readTokenColor("--muted"),
      popover: readTokenColor("--popover"),
      text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
    };
  });
}

async function openUserMenu(page: Page) {
  const userMenuTrigger = page.locator('[data-slot="dropdown-menu-trigger"]').first();

  if ((await userMenuTrigger.count()) === 0) {
    await page.getByRole("button", { name: "Toggle dashboard navigation" }).click();
  }

  await expect(userMenuTrigger).toBeVisible();
  await userMenuTrigger.click();
}

async function readVisibleActionBackgrounds(
  page: Page,
  name: RegExp,
): Promise<VisibleActionBackground[]> {
  const actions = page.getByRole("link", { name });

  await expect(actions.first()).toBeVisible();

  return actions.evaluateAll((elements) => {
    const primaryProbe = document.createElement("div");
    primaryProbe.style.backgroundColor = "var(--primary)";
    document.body.append(primaryProbe);

    const foregroundProbe = document.createElement("div");
    foregroundProbe.style.backgroundColor = "var(--foreground)";
    document.body.append(foregroundProbe);

    const primary = getComputedStyle(primaryProbe).backgroundColor;
    const foreground = getComputedStyle(foregroundProbe).backgroundColor;

    const colors = elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const styles = getComputedStyle(element);

        return (
          rect.width > 0 &&
          rect.height > 0 &&
          styles.display !== "none" &&
          styles.visibility !== "hidden"
        );
      })
      .map((element) => ({
        actual: getComputedStyle(element).backgroundColor,
        foreground,
        primary,
        text: element.textContent?.replace(/\s+/g, " ").trim() ?? "",
      }));

    primaryProbe.remove();
    foregroundProbe.remove();

    return colors;
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

    await page.goto("/district");
    await expectDarkTheme(page);
    await expect(
      page.getByRole("heading", { name: "Unified severity queue" }),
    ).toBeVisible();

    await page.goto("/field");
    await expectDarkTheme(page);
    await expect(page.getByRole("heading", { name: "Field workbench" })).toBeVisible();

    await page.goto("/district/clinics/clinic-mamelodi-east");
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

  test("uses the dark primary surface on admin detail actions", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Use dark theme" }).click();
    await expectDarkTheme(page);

    const actionRoutes = [
      {
        path: "/admin/audit-evidence",
        name: /Open source evidence for/i,
      },
      {
        path: "/admin/data-ingestion",
        name: /Open clinic context for/i,
      },
      {
        path: "/admin/integrations",
        name: /Open source evidence for/i,
      },
      {
        path: "/admin/security",
        name: /Open source evidence for/i,
      },
    ];

    for (const actionRoute of actionRoutes) {
      await page.goto(actionRoute.path);

      const colors = await readVisibleActionBackgrounds(page, actionRoute.name);

      expect(colors.length).toBeGreaterThan(0);

      for (const color of colors) {
        expect(color.actual).not.toBe(color.foreground);

        if (/Open (source evidence|clinic context)/i.test(color.text)) {
          expect(color.actual).toBe(color.primary);
        }
      }
    }
  });

  test("keeps command palette and user menu overlays dark-native", async ({ page }) => {
    await signIn(page);
    await page.getByRole("button", { name: "Use dark theme" }).click();
    await expectDarkTheme(page);

    await page.getByRole("button", { name: "Open command palette" }).click();
    const palette = page.getByRole("dialog", {
      name: "ClinicPulse command palette",
    });
    await expect(palette).toBeVisible();

    const paletteSurface = await readComputedSurface(page.locator('[role="document"]'));
    expect(paletteSurface.background).toBe(paletteSurface.popover);
    expect(paletteSurface.background).not.toBe(paletteSurface.foreground);
    expect(paletteSurface.border).toBe("rgb(46, 46, 46)");
    expect(paletteSurface.boxShadow).toContain("/ 0.35");

    await page.keyboard.press("Escape");
    await expect(palette).toBeHidden();

    await openUserMenu(page);
    const menu = page.locator('[data-slot="dropdown-menu-content"]').first();
    const menuSurface = await readComputedSurface(menu);
    expect(menuSurface.background).toBe(menuSurface.popover);
    expect(menuSurface.background).not.toBe(menuSurface.foreground);
    expect(menuSurface.border).toBe("rgb(46, 46, 46)");
    expect(menuSurface.boxShadow).toContain("/ 0.35");

    const firstItem = page.locator('[data-slot="dropdown-menu-item"]').first();
    await firstItem.focus();
    const focusedItemSurface = await readComputedSurface(firstItem);
    expect(focusedItemSurface.background).toBe(focusedItemSurface.muted);
    expect(focusedItemSurface.text).toContain("Admin Overview");
  });
});
