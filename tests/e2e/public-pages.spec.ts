import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
    await expect(
      page.getByRole("heading", {
        name: "Access is provisioned by your organisation.",
      }),
    ).toBeVisible();
    await expect(page.locator("form")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Book an access walkthrough" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to sign in" })).toBeVisible();
  });

  test("contains booking focus and restores it to the opener", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const opener = page.getByRole("button", { name: "Book walkthrough" }).first();
    await opener.focus();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", {
      name: "Book a Clinic Pulse walkthrough",
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close booking" })).toBeFocused();

    const dialogBackground = await dialog.locator("#booking").evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(dialogBackground).toMatch(
      /^rgb\((?:[0-3]?\d), (?:[0-3]?\d), (?:[0-3]?\d)\)$/,
    );

    const dialogA11y = await new AxeBuilder({ page })
      .include("[data-booking-dialog-portal]")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      dialogA11y.violations.filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      ),
    ).toEqual([]);

    const backgroundIsInert = await page.locator("[data-public-shell]").evaluate((shell) => {
      let current: HTMLElement | null = shell as HTMLElement;
      while (current && current !== document.body) {
        if (current.inert) return true;
        current = current.parentElement;
      }
      return false;
    });
    expect(backgroundIsInert).toBe(true);

    await page.keyboard.press("Shift+Tab");
    expect(
      await dialog.evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  });

  test("only makes swipe rails keyboard-scrollable on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const productRail = page.getByRole("region", { name: "Product surfaces" });
    const isMobile = test.info().project.name === "mobile-chrome";

    if (!isMobile) {
      await expect(productRail).not.toHaveAttribute("tabindex", "0");
      return;
    }

    await expect(productRail).toHaveAttribute("tabindex", "0");
    await productRail.focus();
    await expect(productRail).toBeFocused();

    const focusIndicator = await productRail.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        color: styles.outlineColor,
        style: styles.outlineStyle,
        width: styles.outlineWidth,
      };
    });
    expect(focusIndicator.style).not.toBe("none");
    expect(focusIndicator.width).not.toBe("0px");

    const before = await productRail.evaluate((element) => element.scrollLeft);
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() => productRail.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(before);
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

  test("has no serious or critical accessibility violations", async ({ page }) => {
    test.setTimeout(90_000);

    for (const route of routes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main").first()).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blockingViolations = results.violations.filter(
        (violation) =>
          violation.impact === "critical" || violation.impact === "serious",
      );

      expect(
        blockingViolations,
        `${route} has blocking accessibility violations`,
      ).toEqual([]);
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

  test("keeps login and provision-only access controls visible without hydration", async ({
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
      page.getByRole("heading", {
        name: "Access is provisioned by your organisation.",
      }),
      page.getByRole("link", { name: "Book an access walkthrough" }),
      page.getByRole("link", { name: "Return to sign in" }),
    ];
    for (const control of registerControls) {
      await expect(control).toBeVisible();
      await expectVisibleThroughAncestors(control);
    }
  });
});
