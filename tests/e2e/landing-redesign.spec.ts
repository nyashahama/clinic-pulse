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

  test("nav has 5 anchor links", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const navLinks = page.locator("header nav a:not([href='#'])");
    await expect(navLinks).toHaveCount(5);
  });

  test("hero has district console", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const console = page.locator("[data-hero-console]");
    await expect(console).toBeAttached();
  });

  test("manifesto section is rendered as stakeholder impact", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const section = page.locator("#manifesto");
    await expect(section).toBeAttached();
  });

  test("operating gap section exists", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const flow = page.locator("#flow");
    await expect(flow).toBeAttached();
  });

  test("product surfaces has 4 visible cards", async ({ page }) => {
    await page.goto(`${BASE}/`);
    // Product cards use motion.div wrappers, check for h3 headings
    const headings = page.locator("#product h3");
    await expect(headings).toHaveCount(4);
  });

  test("footer has copyright", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const footer = page.locator("footer");
    await expect(footer).toContainText("ClinicPulse");
  });

  test("features section uses dark theme", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const features = page.locator("#features");
    await expect(features).toBeAttached();
    const bg = await features.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBeTruthy();
  });

  test("scale section shows animated counters", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const heading = page.locator("text=Built to operate at national scale");
    await expect(heading).toBeAttached();
  });

  test("FAQ section has accordion questions", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const faq = page.locator("#faq");
    await expect(faq).toBeAttached();
    const questions = page.locator("#faq button");
    await expect(questions.first()).toBeVisible();
  });

  test("social proof shows testimonials", async ({ page }) => {
    await page.goto(`${BASE}/`);
    const proof = page.locator("#proof");
    await expect(proof).toBeAttached();
  });
});
