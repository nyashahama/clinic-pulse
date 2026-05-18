import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import { signInAs } from "./helpers/auth";

async function expectNoCriticalOrSeriousViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blockingViolations = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

  expect(blockingViolations, `${label} has blocking accessibility violations`).toEqual([]);
}

async function expectMainContent(page: Page) {
  await expect(page.locator("main").first()).toBeVisible();
}

test.describe("phase 5 accessibility smoke", () => {
  test("public and legal routes have no blocking axe violations", async ({ page }) => {
    const routes = ["/", "/login", "/finder", "/legal/privacy", "/legal/terms", "/legal/safety"];

    for (const route of routes) {
      await page.goto(route);
      await expectMainContent(page);
      await expectNoCriticalOrSeriousViolations(page, route);
    }
  });

  test("reporter field route has no blocking axe violations", async ({ page }) => {
    await signInAs(page, "reporter@clinicpulse.local", "/field");
    await expectMainContent(page);
    await expectNoCriticalOrSeriousViolations(page, "/field");
  });

  test("district route has no blocking axe violations", async ({ page }) => {
    await signInAs(page, "district-manager@clinicpulse.local", "/district");
    await expectMainContent(page);
    await expectNoCriticalOrSeriousViolations(page, "/district");
  });

  test("admin launch-readiness routes have no blocking axe violations", async ({ page }) => {
    await signInAs(page, "org-admin@clinicpulse.local", "/admin");
    await expectMainContent(page);
    await expect(page.getByRole("button", { name: "Toggle dashboard navigation" })).toBeVisible();
    await expectNoCriticalOrSeriousViolations(page, "/admin");

    await page.goto("/admin/integrations");
    await expectMainContent(page);
    await expectNoCriticalOrSeriousViolations(page, "/admin/integrations");
  });
});
