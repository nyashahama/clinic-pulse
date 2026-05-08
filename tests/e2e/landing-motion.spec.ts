import { expect, test } from "@playwright/test";

async function customMotionAnimationCount(page: import("@playwright/test").Page) {
  return page.evaluate(() =>
    document
      .getAnimations({ subtree: true })
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
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");
    await page.waitForTimeout(1600);

    await expect(page.locator("[data-motion-layer='true']").first()).toBeVisible({
      timeout: 10000,
    });
    const motionLayerCount = await page.locator("[data-motion-layer='true']").count();
    expect(motionLayerCount).toBeGreaterThanOrEqual(5);
    expect(await page.locator("[data-motion-object='true']").count()).toBeGreaterThanOrEqual(18);
    expect(await customMotionAnimationCount(page)).toBeGreaterThanOrEqual(8);
  });

  test("keeps reduced motion calm", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");
    await page.waitForTimeout(1600);

    await expect(page.locator("[data-motion-layer='true']").first()).toBeVisible();
    expect(await customMotionAnimationCount(page)).toBe(0);
  });

  test("keeps animated landing surfaces inside mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto("/");
    await page.waitForTimeout(1000);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
    });

    expect(overflow).toBe(false);
    await expect(page.locator("[data-hero-console='true']")).toBeVisible();
  });
});
