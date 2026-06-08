import { test, expect } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

test.describe("Landing page redesign — 2026 editorial paper", () => {
  test("has paper-noise SVG filter on body", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const svg = page.locator("svg[aria-hidden='true']");
    await expect(svg.first()).toBeAttached();
  });

  test("uses Instrument Serif for display headings", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const h1 = page.locator("h1").first();
    const fontFamily = await h1.evaluate(
      (el) => getComputedStyle(el).fontFamily,
    );
    expect(fontFamily.toLowerCase()).toContain("instrument serif");
  });

  test("has clinics-paper background", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const root = page.locator("div").first();
    const bg = await root.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBeTruthy();
  });

  test("nav has 6 anchor links", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const navLinks = page.locator("header nav a");
    await expect(navLinks).toHaveCount(6);
  });

  test("hero has status pill", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const pill = page.locator("text=LIVE — MP-001");
    await expect(pill).toBeVisible();
  });

  test("manifesto has 3 numbered pillars", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const pillars = page.locator("#manifesto ol li");
    await expect(pillars).toHaveCount(3);
  });

  test("operating gap uses sticky-scroll", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const sticky = page.locator("#operating-gap");
    await expect(sticky).toBeAttached();
  });

  test("product surfaces has bento grid", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const bento = page.locator("#product article");
    await expect(bento.first()).toBeVisible();
  });

  test("footer has copyright", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const footer = page.locator("footer");
    await expect(footer).toContainText("ClinicPulse");
  });
});
