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
  test("updates the desktop canvas as native scroll reaches each stage", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only progression check");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const canvas = page.locator("#how-it-works [data-progressive-canvas='true']");
    const target = page.locator("[data-incident-stage='patient-route']");
    await target.scrollIntoViewIfNeeded();

    await expect(canvas).toHaveAttribute("data-active-stage", "patient-route");
  });

  test("uses four compact incident canvases on mobile", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-chrome", "mobile-only progression check");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const story = page.locator("#how-it-works");
    await expect(story.locator("[data-incident-stage] [data-district-canvas='true']")).toHaveCount(
      4,
    );
    const progressiveCanvas = story.locator("[data-progressive-canvas='true']");
    await expect(progressiveCanvas).toHaveCount(1);
    await expect(progressiveCanvas).toBeHidden();
  });

  test("adds active operational motion on desktop", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only motion check");

    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    await expect(page.locator("[data-motion-layer='true']").first()).toBeVisible({
      timeout: 10000,
    });
    await page.waitForTimeout(1500);

    const motionLayerCount = await page.locator("[data-motion-layer='true']").count();
    const motionObjectCount = await page.locator("[data-motion-object='true']").count();
    const runningAnimationCount = await customMotionAnimationCount(page);

    expect(motionLayerCount).toBeGreaterThanOrEqual(5);
    expect(motionObjectCount).toBeGreaterThanOrEqual(18);
    expect(runningAnimationCount).toBeGreaterThanOrEqual(8);
  });

  test("keeps reduced motion calm", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only motion check");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

    await expect(page.locator("[data-motion-layer='true']").first()).toBeVisible();
    await page.waitForTimeout(1500);

    const motionLayerCount = await page.locator("[data-motion-layer='true']").count();
    const motionObjectCount = await page.locator("[data-motion-object='true']").count();
    const runningAnimationCount = await customMotionAnimationCount(page);

    expect(motionLayerCount).toBeGreaterThanOrEqual(5);
    expect(motionObjectCount).toBeGreaterThanOrEqual(18);
    expect(runningAnimationCount).toBe(0);
  });

  test("keeps animated landing surfaces inside mobile viewport", async ({ page }) => {
    test.skip(test.info().project.name !== "mobile-chrome", "mobile-only overflow check");

    await page.setViewportSize({ width: 390, height: 1000 });
    await page.goto("/");
    await expect(page.locator("[data-hero-console='true']")).toBeVisible();
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      return Math.max(doc.scrollWidth, body.scrollWidth) > doc.clientWidth + 1;
    });

    expect(overflow).toBe(false);

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

  test("keeps the desktop product surfaces in a compact grid", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop-only product layout check");

    await page.setViewportSize({ width: 1440, height: 1200 });
    await page.goto("/");

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
});
