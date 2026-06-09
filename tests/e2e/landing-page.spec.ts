import { expect, test, type Page } from "@playwright/test";

async function gotoLanding(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

async function gotoLandingInDarkMode(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme", "dark");
  });
  await gotoLanding(page);
  await expect(page.locator("html")).toHaveClass(/(?:^|\s)dark(?:\s|$)/);
}

async function readSurfaceColors(locator: ReturnType<Page["locator"]>) {
  return locator.evaluate((element) => {
    const primaryProbe = document.createElement("div");
    primaryProbe.style.backgroundColor = "var(--primary)";
    document.body.append(primaryProbe);

    const foregroundProbe = document.createElement("div");
    foregroundProbe.style.backgroundColor = "var(--foreground)";
    document.body.append(foregroundProbe);

    const colors = {
      actual: getComputedStyle(element).backgroundColor,
      foreground: getComputedStyle(foregroundProbe).backgroundColor,
      primary: getComputedStyle(primaryProbe).backgroundColor,
    };

    primaryProbe.remove();
    foregroundProbe.remove();

    return colors;
  });
}

test.describe("landing page 2026", () => {
  test("keeps required navigation and walkthrough actions reachable", async ({ page }) => {
    await gotoLanding(page);

    const header = page.locator("header");

    // Redesign nav links
    await expect(header.getByRole("link", { name: "Impact" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Trust" })).toBeVisible();
    await expect(header.getByRole("link", { name: "FAQ" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Book walkthrough" })).toBeVisible();
  });

  test("uses dark-native brand surfaces for public CTAs and booking selections", async ({
    page,
  }) => {
    await gotoLandingInDarkMode(page);

    const headerBook = page.locator("header").getByRole("link", {
      name: "Book walkthrough",
    }).last();
    const heroBook = page.getByRole("link", { name: "Book walkthrough" }).first();

    // Check both CTAs are visible
    await expect(headerBook).toBeVisible();
    await expect(heroBook).toBeVisible();

    await heroBook.click();

    const dialog = page.getByRole("dialog", {
      name: "Book a Clinic Pulse walkthrough",
    });
    await expect(dialog).toBeVisible();
  });

  test("opens with the live operations incident narrative", async ({ page }) => {
    await gotoLanding(page);

    // Hero has the district console visible
    const console = page.locator("[data-hero-console='true']");

    await expect(console).toBeVisible();
    await expect(console).toContainText("Mabopane");
    await expect(console).toContainText("Akasia Hills");
    await expect(console).toContainText("Tshwane North");
    await expect(console).toContainText("Non-functional");
    await expect(console).toContainText("AUD-OPS-MAB-001");
    await expect(page.getByRole("link", { name: "Book walkthrough" }).first()).toBeVisible();
  });

  test("keeps hero incident proof owned by the console", async ({ page }) => {
    for (const viewport of [
      { width: 1800, height: 1100 },
      { width: 900, height: 1200 },
      { width: 390, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoLanding(page);

      const console = page.locator("[data-hero-console='true']");
      await expect(console).toBeAttached();
      await expect(console).toContainText("Akasia Hills");
      await expect(console).toContainText("AUD-OPS-MAB-001");
    }
  });

  test("keeps responsive surfaces inside the viewport", async ({ page }) => {
    await gotoLanding(page);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;

      return Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
    });

    expect(overflow).toBe(false);
    await expect(page.getByRole("link", { name: "Book walkthrough" }).first()).toBeVisible();
    await expect(page.locator("[data-hero-console='true']")).toBeVisible();
    await expect(
      page.locator("footer").filter({ visible: true }),
    ).toBeAttached();
  });

  test("connects real-world stakeholders to the status gap", async ({ page }) => {
    await gotoLanding(page);

    const manifesto = page.locator("#manifesto");
    await expect(manifesto).toBeAttached();
    await expect(manifesto).toContainText("Community health worker");
  });

  test("aligns the desktop stakeholder chapter without dead space", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only layout check");
    await page.setViewportSize({ width: 1440, height: 1200 });
    await gotoLanding(page);

    const overview = page.locator("#manifesto");
    await expect(overview).toBeVisible();
  });

  test("shows one connected incident flow from report to audit", async ({ page }) => {
    await gotoLanding(page);

    const flow = page.locator("#flow");
    await expect(flow).toBeVisible();
    await expect(flow).toContainText("Mabopane Station");
    await expect(flow).toContainText("AUD-OPS-MAB-001");
  });

  test("presents product surfaces with a clear operations hierarchy", async ({ page }) => {
    await gotoLanding(page);

    const product = page.locator("#product");
    await expect(product).toBeVisible();
    await expect(product).toContainText("Field report");
    await expect(product).toContainText("District console");
    await expect(product).toContainText("Patient reroute");
    await expect(product).toContainText("Audit trail");
  });

  test("keeps the desktop product surfaces in a compact grid", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only layout check");
    await page.setViewportSize({ width: 1440, height: 1200 });
    await gotoLanding(page);

    const product = page.locator("#product");
    // Product cards use motion.div wrappers, not article
    const headings = product.locator("h3");
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(4);
    await expect(product.getByText("Field report")).toBeVisible();
    await expect(product.getByText("District console")).toBeVisible();
  });

  test("ends with public-sector evidence and an incident-specific CTA", async ({
    page,
  }) => {
    await gotoLanding(page);

    await expect(page.locator("#faq")).toBeVisible();
    await expect(page.locator("#faq")).toContainText("POPIA");
    await expect(page.locator("#final")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /walkthrough/i }).first(),
    ).toBeVisible();
  });
});
