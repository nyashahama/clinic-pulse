import { expect, test } from "@playwright/test";

test.describe("landing motion system", () => {
  test("hero console renders on desktop", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only check");

    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    await expect(page.locator("[data-hero-console='true']")).toBeVisible({ timeout: 10000 });
  });

  test("keeps animated landing surfaces inside mobile viewport", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-chrome", "mobile-only overflow check");

    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto("/");
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
    });

    expect(overflow).toBe(false);
  });

  test("product surfaces render on desktop", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only layout check");

    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    const product = page.locator("#product");
    await expect(product).toBeVisible();
    await expect(product.locator("h3").first()).toBeVisible();
  });
});
