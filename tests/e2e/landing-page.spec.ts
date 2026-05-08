import { expect, test } from "@playwright/test";

test.describe("landing page 2026", () => {
  test("keeps required navigation and demo actions reachable", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");

    await expect(header.getByRole("link", { name: "Problem" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Flow" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Trust" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Book demo" })).toBeVisible();
  });

  test("opens with the live operations incident narrative", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    });

    await expect(
      page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    ).toBeVisible();
    const console = hero.locator("[data-hero-console='true']");

    await expect(console).toBeVisible();
    await expect(console).toContainText("Mamelodi East Community Clinic");
    await expect(console).toContainText("Akasia Hills Clinic");
    await expect(console).toContainText("Offline field report");
    await expect(console).toContainText("ARV pickup");
    await expect(console).toContainText("AUD-2026-0504-017");
    await expect(
      page.getByRole("img", {
        name: /clinic entrance used to frame a live service availability incident/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Book demo" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Watch the incident flow" })).toBeVisible();
  });

  test("keeps hero incident proof owned by the console", async ({ page }) => {
    for (const viewport of [
      { width: 1800, height: 1100 },
      { width: 900, height: 1200 },
      { width: 390, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/");

      const hero = page.locator("section").filter({
        has: page.getByRole("heading", {
          name: "Know which clinics can help before patients travel.",
        }),
      });
      const console = hero.locator("[data-hero-console='true']");

      await expect(
        hero.getByText("Active incident", { exact: true }).filter({ visible: true }),
      ).toHaveCount(1);
      await expect(
        hero.locator("[data-incident-proof='true']").filter({ visible: true }),
      ).toHaveCount(0);
      await expect(console).toContainText("Akasia Hills Clinic");
      await expect(console).toContainText("AUD-2026-0504-017");
    }
  });

  test("keeps responsive surfaces inside the viewport", async ({ page }) => {
    await page.goto("/");

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;

      return Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
    });

    expect(overflow).toBe(false);
    await expect(page.getByRole("button", { name: "Book demo" }).first()).toBeVisible();
    await expect(page.locator("[data-hero-console='true']")).toBeVisible();
    await expect(
      page.locator("#product").getByRole("heading", {
        name: "The operating surfaces behind the decision.",
      }),
    ).toBeVisible();
  });

  test("keeps the mobile hero compact enough to reach the story", async ({ page }) => {
    await page.goto("/");

    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width > 500, "mobile-only hero compactness check");

    const hero = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    });
    const heroHeight = await hero.evaluate((element) =>
      Math.round(element.getBoundingClientRect().height),
    );

    expect(heroHeight).toBeLessThanOrEqual(1900);
  });

  test("connects real-world stakeholders to the status gap", async ({ page }) => {
    await page.goto("/");

    const impactStrip = page.locator("section").filter({
      has: page.getByRole("heading", { name: "One status change affects everyone." }),
    });
    const statusGap = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Clinic status changes before district systems catch up.",
      }),
    });

    await expect(
      impactStrip.getByRole("heading", { name: "One status change affects everyone." }),
    ).toBeVisible();
    await expect(impactStrip.getByRole("heading", { name: "District team" })).toBeVisible();
    await expect(impactStrip.getByRole("heading", { name: "Field worker" })).toBeVisible();
    await expect(
      impactStrip.getByRole("heading", { name: "Clinic coordinator" }),
    ).toBeVisible();
    await expect(impactStrip.getByRole("heading", { name: "Patient" })).toBeVisible();

    await expect(
      statusGap.getByRole("heading", {
        name: "Clinic status changes before district systems catch up.",
      }),
    ).toBeVisible();
    await expect(statusGap.getByText("Stale public data creates risk")).toBeVisible();
    await expect(
      statusGap.getByRole("img", {
        name: /clinic status context for a public availability update/i,
      }),
    ).toBeVisible();
  });

  test("aligns the desktop stakeholder chapter without dead space", async ({ page }) => {
    await page.goto("/");

    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width < 1024, "desktop-only composition check");

    const impactStrip = page.locator("section").filter({
      has: page.getByRole("heading", { name: "One status change affects everyone." }),
    });
    const headingBox = await impactStrip
      .getByRole("heading", { name: "One status change affects everyone." })
      .boundingBox();
    const firstCardBox = await impactStrip.locator("article").first().boundingBox();

    expect(headingBox).not.toBeNull();
    expect(firstCardBox).not.toBeNull();
    expect(Math.abs((headingBox?.y ?? 0) - (firstCardBox?.y ?? 0))).toBeLessThanOrEqual(140);
  });

  test("shows one connected incident flow from report to audit", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Watch the incident flow" }).click();

    const flow = page.locator("#flow");

    await expect(page).toHaveURL(/#flow$/);
    await expect(
      flow.getByRole("heading", { name: "From field signal to operating record." }),
    ).toBeVisible();
    await expect(flow.getByText("Offline report queued")).toBeVisible();
    await expect(flow.getByText("Clinic status changed")).toBeVisible();
    await expect(flow.getByText("Wasted trip avoided")).toBeVisible();
    await expect(flow.getByText("Operating record sealed")).toBeVisible();
  });

  test("presents product surfaces with a clear operations hierarchy", async ({ page }) => {
    await page.goto("/");

    const product = page.locator("#product");

    await expect(
      product.getByRole("heading", { name: "The operating surfaces behind the decision." }),
    ).toBeVisible();
    await expect(product.getByRole("heading", { name: "District command center" })).toBeVisible();
    await expect(product.getByRole("heading", { name: "Offline field reports" })).toBeVisible();
    await expect(product.getByRole("heading", { name: "Patient rerouting" })).toBeVisible();
    await expect(
      product.getByRole("heading", { name: "Audit and export readiness" }),
    ).toBeVisible();
  });

  test("keeps the desktop product surfaces in a compact grid", async ({ page }) => {
    await page.goto("/");

    const viewport = page.viewportSize();
    test.skip(!viewport || viewport.width < 1024, "desktop-only product layout check");

    const product = page.locator("#product");
    const districtBox = await product
      .getByRole("heading", { name: "District command center" })
      .locator("xpath=ancestor::article[1]")
      .boundingBox();
    const patientBox = await product
      .getByRole("heading", { name: "Patient rerouting" })
      .locator("xpath=ancestor::article[1]")
      .boundingBox();
    const auditBox = await product
      .getByRole("heading", { name: "Audit and export readiness" })
      .locator("xpath=ancestor::article[1]")
      .boundingBox();

    expect(districtBox).not.toBeNull();
    expect(patientBox).not.toBeNull();
    expect(auditBox).not.toBeNull();
    expect(patientBox?.x ?? 0).toBeLessThan((districtBox?.x ?? 0) + 80);
    expect(Math.abs((patientBox?.y ?? 0) - (auditBox?.y ?? 0))).toBeLessThanOrEqual(80);
  });

  test("ends with public-sector evidence and an incident-specific CTA", async ({ page }) => {
    await page.goto("/");

    const trust = page.locator("#trust");
    const cta = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Walk through a live clinic status incident." }),
    });

    await expect(
      trust.getByRole("heading", { name: "Public-sector trust lives in the evidence chain." }),
    ).toBeVisible();
    await expect(trust.getByText("Source and permissions")).toBeVisible();
    await expect(trust.getByText("Freshness and audit")).toBeVisible();
    await expect(trust.getByText("Offline queue")).toBeVisible();
    await expect(trust.getByText("District export")).toBeVisible();
    await expect(trust.getByText("API/status endpoint")).toBeVisible();
    await expect(trust.getByText("Webhook preview")).toBeVisible();

    await expect(
      cta.getByRole("heading", { name: "Walk through a live clinic status incident." }),
    ).toBeVisible();
    await expect(cta.getByText("Mamelodi East Community Clinic")).toBeVisible();
    await expect(cta.getByText("Akasia Hills Clinic")).toBeVisible();
    await expect(cta.getByText("AUD-2026-0504-017")).toBeVisible();
    await expect(cta.getByRole("link", { name: "Sign in to demo workspace" })).toHaveAttribute(
      "href",
      "/login",
    );
    await cta.getByRole("link", { name: "Book demo" }).click();
    await expect(page.getByRole("dialog", { name: "Book a Clinic Pulse demo" })).toBeVisible();
  });
});
