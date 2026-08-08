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

    await expect(header.getByRole("link", { name: "Problem" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Flow" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Product" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Trust" })).toBeVisible();
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
    const heroBook = page.getByRole("button", { name: "Book walkthrough" }).first();

    for (const target of [headerBook, heroBook]) {
      const colors = await readSurfaceColors(target);

      expect(colors.actual).toBe(colors.primary);
      expect(colors.actual).not.toBe(colors.foreground);
    }

    await heroBook.click();

    const dialog = page.getByRole("dialog", {
      name: "Book a Clinic Pulse walkthrough",
    });
    await expect(dialog).toBeVisible();

    const enabledDays = dialog.locator("button:not([disabled])").filter({ hasText: /^\d+$/ });
    const selectedDay = enabledDays.first();
    const selectedTime = dialog.getByRole("button", { name: "10:30" });

    for (const target of [selectedDay, selectedTime]) {
      const colors = await readSurfaceColors(target);

      expect(colors.actual).toBe(colors.primary);
      expect(colors.actual).not.toBe(colors.foreground);
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
        name: /clinic entrance used to frame a live service availability incident/i,
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
        name: /clinic status context for a public availability update/i,
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

  test("opens with an honestly labeled district operating scenario", async ({ page }) => {
    await gotoLanding(page);

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
    await expect(ledger).toContainText("Offline field report");
    await expect(ledger).toContainText("Operational → Non-functional");
    await expect(ledger).toContainText("Akasia Hills Clinic");
    await expect(ledger).toContainText("CSV export available");
    await expect(ledger).toContainText("Status endpoint contract");
    await expect(ledger).toContainText("Partner handoff preview");
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

  test("keeps the mobile navigation to one row", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoLanding(page);

    const header = page.getByRole("banner");
    const headerHeight = await header.evaluate((node) => node.getBoundingClientRect().height);
    expect(Math.round(headerHeight)).toBeLessThanOrEqual(72);
    await expect(header.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Walkthrough", exact: true })).toBeVisible();
  });
});
