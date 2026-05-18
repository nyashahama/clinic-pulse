import { expect, test, type Page } from "@playwright/test";

import { signInAs } from "./helpers/auth";

type NavigationBudget = {
  domContentLoadedMs: number;
  loadMs: number;
};

const budget: NavigationBudget = {
  domContentLoadedMs: 12_000,
  loadMs: 18_000,
};

async function expectRouteWithinBudget(page: Page, path: string, label: string) {
  await page.goto(path, { waitUntil: "load" });
  await expect(page.locator("main").first()).toBeVisible();

  const timing = await page.evaluate(() => {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];

    if (!entry) {
      throw new Error("Missing navigation timing entry");
    }

    return {
      domContentLoadedMs: Math.round(entry.domContentLoadedEventEnd - entry.startTime),
      loadMs: Math.round(entry.loadEventEnd - entry.startTime),
    };
  });

  expect(timing.domContentLoadedMs, `${label} DOMContentLoaded budget`).toBeLessThanOrEqual(
    budget.domContentLoadedMs,
  );
  expect(timing.loadMs, `${label} load event budget`).toBeLessThanOrEqual(budget.loadMs);
}

test.describe("phase 5 performance smoke", () => {
  test("public pilot routes stay within local smoke budgets", async ({ page }) => {
    await expectRouteWithinBudget(page, "/", "landing");
    await expectRouteWithinBudget(page, "/finder", "finder");
    await expectRouteWithinBudget(page, "/login", "login");
  });

  test("admin pilot handoff routes stay within local smoke budgets", async ({ page }) => {
    await signInAs(page, "org-admin@clinicpulse.local", "/admin");
    await expect(page.locator("main").first()).toBeVisible();
    await expectRouteWithinBudget(page, "/admin", "admin");
    await expectRouteWithinBudget(page, "/admin/integrations", "admin integrations");
  });
});
