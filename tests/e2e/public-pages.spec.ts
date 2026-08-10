import { expect, test } from "@playwright/test";

const routes = ["/", "/login", "/register"] as const;

async function expectVisibleThroughAncestors(
  locator: ReturnType<import("@playwright/test").Page["locator"]>,
) {
  const isOpaque = await locator.evaluate((element) => {
    let current: Element | null = element;
    while (current) {
      if (Number.parseFloat(getComputedStyle(current).opacity) < 0.99) {
        return false;
      }
      current = current.parentElement;
    }
    return true;
  });

  expect(isOpaque).toBe(true);
}

test.describe("public landing and auth experience", () => {
  test("uses one dark public design system across every route", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      const shell = page.locator("[data-public-shell]").first();
      await expect(shell).toBeVisible();
      await expect(shell).toHaveAttribute("data-public-theme", "dark-editorial");

      const background = await shell.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      );
      expect(background).toMatch(/^rgb\((?:[0-9]|1[0-8]), (?:[0-9]|1[0-8]), (?:[0-9]|1[0-8])\)$/);
    }
  });

  test("labels the product story honestly and removes unsupported scale claims", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Illustrative operational scenario").first()).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    ).toBeVisible();

    for (const route of ["/login", "/register"] as const) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByText("Illustrative workspace scenario")).toBeVisible();
      await expect(page.getByText("3,500+", { exact: true })).toHaveCount(0);
      await expect(page.getByText("<30s", { exact: true })).toHaveCount(0);
    }
  });

  test("preserves the public actions and auth controls", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const header = page.locator("header");
    await expect(header.getByRole("link", { name: "Problem" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Flow" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Trust" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Book walkthrough" })).toBeVisible();

    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loginEmail = page.getByLabel("Email address");
    const loginPassword = page.getByRole("textbox", {
      name: "Password",
      exact: true,
    });
    const loginButton = page.getByRole("button", { name: "Log in" });
    await expect(loginEmail).toBeVisible();
    await expect(loginPassword).toBeVisible();
    await expect(loginButton).toBeVisible();
    await expectVisibleThroughAncestors(loginEmail);
    await expectVisibleThroughAncestors(loginPassword);
    await expectVisibleThroughAncestors(loginButton);
    await expect(page.getByRole("link", { name: "Request access" })).toBeVisible();

    await page.goto("/register", { waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Full name")).toBeVisible();
    await expect(page.getByLabel("Role")).toBeVisible();
    await expect(page.getByLabel("Work email")).toBeVisible();
    await expect(page.getByLabel("Organisation")).toBeVisible();
    await expect(page.getByText("Accounts are provisioned by administrators.")).toBeVisible();
  });

  test("keeps every public route inside the viewport", async ({ page }) => {
    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      if (route === "/") {
        await page.waitForTimeout(1_800);
      }
      const overflow = await page.evaluate(
        () =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) >
          document.documentElement.clientWidth + 1,
      );
      expect(overflow).toBe(false);
    }
  });

  test("keeps the mobile landing story compact", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-chrome", "mobile-only contract");
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(pageHeight).toBeLessThanOrEqual(9_000);
  });
});

test.describe("server-rendered auth fallback", () => {
  test.use({ javaScriptEnabled: false });

  test("keeps the login and access-request controls visible without hydration", async ({
    page,
  }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    const loginControls = [
      page.getByLabel("Email address"),
      page.getByRole("textbox", { name: "Password", exact: true }),
      page.getByRole("button", { name: "Log in" }),
    ];
    for (const control of loginControls) {
      await expect(control).toBeVisible();
      await expectVisibleThroughAncestors(control);
    }

    await page.goto("/register", { waitUntil: "domcontentloaded" });
    const registerControls = [
      page.getByLabel("Full name"),
      page.getByLabel("Role"),
      page.getByLabel("Work email"),
      page.getByLabel("Organisation"),
      page.getByRole("button", { name: "Request access review" }),
    ];
    for (const control of registerControls) {
      await expect(control).toBeVisible();
      await expectVisibleThroughAncestors(control);
    }
  });
});
