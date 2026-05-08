import { expect, test } from "@playwright/test";

async function customMotionAnimationCount(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    document
      .getAnimations()
      .filter((animation) => {
        const target =
          animation.effect && "target" in animation.effect ? animation.effect.target : null;
        return (
          animation.playState === "running" &&
          target instanceof Element &&
          Boolean(target.closest("[data-motion-layer='true']"))
        );
      }).length,
  );
}

test.describe("landing motion system", () => {
  test("adds active operational motion on desktop", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only motion check");

    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    await expect(page.locator("[data-motion-layer='true']").first()).toBeVisible({
      timeout: 10000,
    });
    await expect
      .poll(() => page.locator("[data-motion-layer='true']").count(), {
        timeout: 10000,
      })
      .toBeGreaterThanOrEqual(5);
    await expect
      .poll(() => page.locator("[data-motion-object='true']").count(), {
        timeout: 10000,
      })
      .toBeGreaterThanOrEqual(18);
    await expect
      .poll(() => customMotionAnimationCount(page), {
        timeout: 10000,
      })
      .toBeGreaterThanOrEqual(8);
  });

  test("keeps reduced motion calm", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only motion check");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    await expect(page.locator("[data-motion-layer='true']").first()).toBeVisible();
    await expect
      .poll(() => customMotionAnimationCount(page), {
        timeout: 10000,
      })
      .toBe(0);
  });

  test("keeps animated landing surfaces inside mobile viewport", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-chrome", "mobile-only overflow check");

    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto("/");

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
    });

    expect(overflow).toBe(false);
    await expect(page.locator("[data-hero-console='true']")).toBeVisible();
  });
});
