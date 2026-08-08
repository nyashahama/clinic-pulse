import { expect, test } from "@playwright/test";

test.describe("landing incident motion", () => {
  test("reveals the route only when native scroll reaches patient routing", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop progression contract");

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const canvas = page.locator("#how-it-works [data-progressive-canvas='true']");
    const route = canvas.locator(".landing-route-path");
    await expect(canvas).toHaveAttribute("data-active-stage", "field-report");
    await expect(canvas).toHaveAttribute("data-route-active", "false");

    await page.locator("[data-incident-stage='patient-route']").scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute("data-active-stage", "patient-route");
    await expect(canvas).toHaveAttribute("data-route-active", "true");
    await expect(route).toHaveCSS("animation-name", "landing-route-reveal");
  });

  test("shows the route immediately and calmly with reduced motion", async ({ page }) => {
    test.skip(test.info().project.name !== "desktop-chrome", "desktop progression contract");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const canvas = page.locator("#how-it-works [data-progressive-canvas='true']");
    await page.locator("[data-incident-stage='patient-route']").scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute("data-active-stage", "patient-route");
    await expect(canvas).toHaveAttribute("data-route-active", "true");

    const motionState = await canvas.locator(".landing-route-path").evaluate((route) => ({
      runningAnimations: route
        .getAnimations()
        .filter((animation) => animation.playState === "running").length,
      strokeDashoffset: getComputedStyle(route).strokeDashoffset,
    }));
    expect(motionState.runningAnimations).toBe(0);
    expect(motionState.strokeDashoffset).toMatch(/^0(?:px)?$/);

    await expect(page.locator("html")).toHaveAttribute("data-booking-enhanced", "true");
    await page.getByRole("link", { name: "Book a walkthrough" }).first().click();

    const dialog = page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" });
    const backdrop = page.locator("[data-booking-backdrop='true']");
    await expect(dialog).toBeVisible();
    await expect(backdrop).toBeVisible();

    for (const surface of [dialog, backdrop]) {
      const motion = await surface.evaluate((node) => ({
        animationCount: node
          .getAnimations()
          .filter((animation) => animation.playState === "running").length,
        transitionDurations: getComputedStyle(node).transitionDuration.split(", "),
      }));
      expect(motion.animationCount).toBe(0);
      expect(motion.transitionDurations.every((duration) => duration === "0s")).toBe(true);
    }
  });
});
