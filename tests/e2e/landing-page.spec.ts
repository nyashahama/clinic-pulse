import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function gotoLanding(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

async function expectNoCriticalOrSeriousViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  expect(blockingViolations, `${label} has blocking accessibility violations`).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

test.describe("landing operational narrative", () => {
  test("handles the unavailable API without an unhandled page error", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "single runtime error check");
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await gotoLanding(page);
    await expect(page.locator("html")).toHaveAttribute("data-booking-enhanced", "true");
    await page.waitForTimeout(500);

    expect(pageErrors).toEqual([]);
  });

  test("opens with an honestly labeled district scenario and one-row navigation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoLanding(page);

    const header = page.getByRole("banner");
    for (const link of ["How it works", "Product surfaces", "Trust and evidence"]) {
      await expect(header.getByRole("link", { name: link })).toBeVisible();
    }
    await expect(header.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );

    const hero = page.locator("[data-landing-hero='true']");
    await expect(hero.getByText("District clinic operations", { exact: true })).toBeVisible();
    await expect(
      hero.getByRole("heading", { name: "Know which clinics can serve patients now." }),
    ).toBeVisible();
    await expect(
      hero.getByText(/Illustrative operating scenario using seeded product data/i).first(),
    ).toBeVisible();
    await expect(hero.locator("[data-district-canvas='true']")).toBeVisible();
    await expect(hero).toContainText("Mabopane Station Clinic");
    await expect(hero).toContainText("Generator failure");
    await expect(hero).toContainText("08:42");
    await expect(hero.locator("img")).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const headerHeight = await header.evaluate((node) => node.getBoundingClientRect().height);
    expect(Math.round(headerHeight)).toBeLessThanOrEqual(72);
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Walkthrough", exact: true })).toBeVisible();
  });

  test("enhances a real walkthrough link with an accessible dialog", async ({ page }) => {
    await gotoLanding(page);

    const trigger = page.getByRole("link", { name: "Book a walkthrough" }).first();
    await expect(trigger).toHaveAttribute("href", "/request-walkthrough");
    await expect(page.locator("html")).toHaveAttribute("data-booking-enhanced", "true");
    await trigger.click();
    await expect(
      page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test("shows one complete incident from field report to operating record", async ({
    page,
  }) => {
    await gotoLanding(page);
    await page.getByRole("link", { name: "Follow the incident" }).click();

    await expect(page).toHaveURL(/#how-it-works$/);
    const story = page.locator("#how-it-works");
    for (const heading of [
      "Field report received",
      "District response formed",
      "Patient route updated",
      "Operating record sealed",
    ]) {
      await expect(story.getByRole("heading", { name: heading })).toBeVisible();
    }
    await expect(story).toContainText("08:42");
    await expect(story).toContainText("08:47");
  });

  test("shows the evidence ledger behind the district decision", async ({ page }) => {
    await gotoLanding(page);

    const ledger = page.locator("#trust-and-evidence");
    await expect(ledger.getByRole("heading", { name: "AUD-OPS-MAB-001" })).toBeVisible();
    for (const time of ["08:42", "08:44", "08:46", "08:47"]) {
      await expect(ledger.getByText(time, { exact: true })).toBeVisible();
    }
    for (const evidence of [
      "Offline field report",
      "Operational → Non-functional",
      "Akasia Hills Clinic",
      "CSV export available",
      "Status endpoint contract",
      "Partner handoff preview",
    ]) {
      await expect(ledger).toContainText(evidence);
    }
  });

  test("switches product surfaces with accessible tabs", async ({ page }) => {
    await gotoLanding(page);

    const product = page.locator("#product-surfaces");
    const district = product.getByRole("tab", { name: "District console" });
    const field = product.getByRole("tab", { name: "Field report" });
    const audit = product.getByRole("tab", { name: "Audit record" });

    await expect(product.locator("[data-product-explorer-enhanced='true']")).toBeVisible();
    await expect(district).toHaveAttribute("aria-selected", "true");
    await district.focus();
    await page.keyboard.press("ArrowRight");
    await expect(field).toBeFocused();
    await expect(field).toHaveAttribute("aria-selected", "true");
    await expect(product.getByRole("tabpanel")).toContainText("Queued offline, then synced");
    await page.keyboard.press("End");
    await expect(audit).toBeFocused();
    await expect(product.getByRole("tabpanel")).toContainText("AUD-OPS-MAB-001");
    await page.keyboard.press("ArrowRight");
    await expect(district).toBeFocused();
  });

  test("keeps the approved chapter order through the final walkthrough close", async ({
    page,
  }) => {
    await gotoLanding(page);

    const chapterOrder = await page.locator("[data-landing-chapter]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-landing-chapter")),
    );
    expect(chapterOrder).toEqual([
      "hero",
      "signal-rail",
      "incident-narrative",
      "evidence-ledger",
      "product-explorer",
      "walkthrough-close",
    ]);

    const close = page.locator("[data-landing-chapter='walkthrough-close']");
    await expect(
      close.getByRole("heading", {
        name: "Walk through one district incident from report to record.",
      }),
    ).toBeVisible();
    await expect(close.getByRole("link", { name: "Book a walkthrough" })).toHaveAttribute(
      "href",
      "/request-walkthrough",
    );
    await expect(close.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    await expect(page.getByRole("contentinfo")).toContainText("Seeded walkthrough data");
  });

  test("keeps every approved viewport inside the document width", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "single responsive matrix");
    const lifecycleErrors: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /state update on a component that hasn't mounted|state update on an unmounted component/i.test(
          message.text(),
        )
      ) {
        lifecycleErrors.push(message.text());
      }
    });

    for (const viewport of [
      { width: 320, height: 720 },
      { width: 390, height: 844 },
      { width: 768, height: 900 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoLanding(page);
      await expectNoHorizontalOverflow(page);

      const story = page.locator("#how-it-works");
      const compactCanvases = story.locator(
        "[data-incident-stage] [data-district-canvas='true']",
      );
      const progressiveCanvas = story.locator("[data-progressive-canvas='true']");
      await expect(compactCanvases).toHaveCount(4);
      await expect(progressiveCanvas).toHaveCount(1);

      if (viewport.width < 1024) {
        for (const canvas of await compactCanvases.all()) await expect(canvas).toBeVisible();
        await expect(progressiveCanvas).toBeHidden();
      } else {
        for (const canvas of await compactCanvases.all()) await expect(canvas).toBeHidden();
        await expect(progressiveCanvas).toBeVisible();
      }
    }

    expect(lifecycleErrors).toEqual([]);
  });

  test("keeps the tablet hero balanced", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "single layout audit");

    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoLanding(page);
    const tabletHeading = await page.getByRole("heading", {
      name: "Know which clinics can serve patients now.",
    }).boundingBox();
    expect(tabletHeading).not.toBeNull();
    expect(tabletHeading?.height ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(400);
  });

  test("keeps mobile stage canvases focused on the map", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "single layout audit");

    await page.setViewportSize({ width: 390, height: 844 });
    await gotoLanding(page);
    const compactCanvas = page
      .locator("[data-incident-stage='field-report'] [data-district-canvas='true']")
      .first();
    await expect(compactCanvas).toBeVisible();
    await expect(
      compactCanvas.getByText("Field report received", { exact: true }),
    ).toHaveCount(0);
  });

  test("has no blocking accessibility violations across product panels", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "single axe matrix");
    await gotoLanding(page);

    const product = page.locator("#product-surfaces");
    await expect(product.locator("[data-product-explorer-enhanced='true']")).toBeVisible();
    await expectNoCriticalOrSeriousViolations(page, "district console panel");

    for (const tabName of ["Field report", "Public routing", "Audit record"]) {
      await product.getByRole("tab", { name: tabName }).click();
      await expect(product.getByRole("tab", { name: tabName })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await expectNoCriticalOrSeriousViolations(page, `${tabName} panel`);
    }
  });
});
