import { expect, test, type Page } from "@playwright/test";

async function gotoLanding(page: Page) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
}

async function gotoLandingWithDarkPreference(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("theme", "dark");
  });
  await gotoLanding(page);
  await expect(page.locator('[data-public-shell="landing"]')).toHaveAttribute(
    "data-public-theme",
    "clinical-light",
  );
}

async function readSurfaceColors(locator: ReturnType<Page["locator"]>) {
  return locator.evaluate((element) => {
    const readRgb = (value: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return [];
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
    };
    const primaryProbe = document.createElement("div");
    primaryProbe.style.backgroundColor = "var(--primary)";
    element.append(primaryProbe);

    const foregroundProbe = document.createElement("div");
    foregroundProbe.style.backgroundColor = "var(--foreground)";
    element.append(foregroundProbe);

    const colors = {
      actual: readRgb(getComputedStyle(element).backgroundColor),
      foreground: readRgb(getComputedStyle(foregroundProbe).backgroundColor),
      primary: readRgb(getComputedStyle(primaryProbe).backgroundColor),
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

    await expect(header.getByRole("link", { name: "Problem" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Flow" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Trust" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Book walkthrough" })).toBeVisible();
  });

  test("keeps the clinical action hierarchy when a dark preference is stored", async ({
    page,
  }) => {
    await gotoLandingWithDarkPreference(page);

    const headerBook = page.locator("header").getByRole("link", {
      name: "Book walkthrough",
    }).last();
    const heroBook = page.getByRole("button", { name: "Book walkthrough" }).first();

    for (const target of [headerBook, heroBook]) {
      const colors = await readSurfaceColors(target);

      expect(colors.actual).toEqual(colors.primary);
      expect(colors.actual).not.toEqual(colors.foreground);
    }

    const nestedLightPreviews = page.locator("[data-public-light-preview]");
    expect(await nestedLightPreviews.count()).toBeGreaterThanOrEqual(12);
    for (const preview of await nestedLightPreviews.all()) {
      const background = await preview.evaluate((element) => {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) return [];
        context.fillStyle = getComputedStyle(element).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3));
      });

      expect(background).toHaveLength(3);
      expect(Math.min(...background)).toBeGreaterThanOrEqual(230);
    }

    await heroBook.click();

    const dialog = page.getByRole("dialog", {
      name: "Book a Clinic Pulse walkthrough",
    });
    await expect(dialog).toBeVisible();

    const enabledDays = dialog.locator("button:not([disabled])").filter({ hasText: /^\d+$/ });
    const selectedDay = enabledDays.first();
    const selectedTime = dialog.getByRole("button", { name: "10:30" });

    await selectedDay.click();
    await selectedTime.click();
    await page.waitForTimeout(300);

    for (const target of [selectedDay, selectedTime]) {
      const colors = await readSurfaceColors(target);

      expect(colors.actual).toHaveLength(3);
      expect(Math.max(...colors.actual)).toBeLessThanOrEqual(55);
    }
  });

  test("opens with the live operations incident narrative", async ({ page }) => {
    await gotoLanding(page);

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
    await expect(console).toContainText("Mabopane Station Clinic");
    await expect(console).toContainText("Akasia Hills Clinic");
    await expect(console).toContainText("Offline field report");
    await expect(console).toContainText("Pharmacy");
    await expect(console).toContainText("AUD-OPS-MAB-001");
    await expect(
      page.getByRole("img", {
        name: /clinician in a white coat checking a smartphone/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Book walkthrough" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Watch the incident flow" })).toBeVisible();
  });

  test("keeps hero incident proof owned by the console", async ({ page }) => {
    for (const viewport of [
      { width: 1800, height: 1100 },
      { width: 900, height: 1200 },
      { width: 390, height: 1000 },
    ]) {
      await page.setViewportSize(viewport);
      await gotoLanding(page);

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
    await expect(page.getByRole("button", { name: "Book walkthrough" }).first()).toBeVisible();
    await expect(page.locator("[data-hero-console='true']")).toBeVisible();
    await expect(
      page.locator("#product").getByRole("heading", {
        name: "The operating surfaces behind the decision.",
      }),
    ).toBeVisible();
  });

  test("keeps the mobile hero compact enough to reach the story", async ({ page }) => {
    await gotoLanding(page);

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
    await gotoLanding(page);

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
        name: /person outdoors holding a folder while checking a smartphone/i,
      }),
    ).toBeVisible();
  });

  test("aligns the desktop stakeholder chapter without dead space", async ({ page }) => {
    await gotoLanding(page);

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
    await gotoLanding(page);
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
    await gotoLanding(page);

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
    await gotoLanding(page);

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
    await gotoLanding(page);

    const trust = page.locator("#trust");
    const cta = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Walk through the Mabopane Station incident." }),
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
      cta.getByRole("heading", { name: "Walk through the Mabopane Station incident." }),
    ).toBeVisible();
    await expect(cta.getByText("Mabopane Station Clinic")).toBeVisible();
    await expect(cta.getByText("Akasia Hills Clinic")).toBeVisible();
    await expect(cta.getByText("AUD-OPS-MAB-001")).toBeVisible();
    await expect(
      cta.getByRole("link", { name: "Sign in to operations workspace" }),
    ).toHaveAttribute("href", "/login");
    await cta.getByRole("link", { name: "Book walkthrough" }).click();
    await expect(
      page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" }),
    ).toBeVisible();
  });
});
