import { expect, test } from "@playwright/test";

import { signInAs } from "./helpers/auth";

const pilotCriticalRoutes = [
  "/field",
  "/field/submit-report",
  "/field/sync-queue",
  "/district",
  "/admin/reporting-coverage",
  "/admin/audit-evidence",
  "/admin/data-ingestion",
  "/admin/security",
  "/admin/tenant-health",
  "/admin/partner-readiness",
];

test("reporter can inspect server-authoritative field sync queue state", async ({ page }) => {
  await signInAs(page, "reporter@clinicpulse.local", "/field");
  await page.goto("/field/sync-queue");

  await expect(page.getByRole("heading", { name: "Sync queue" })).toBeVisible();
  await expect(page.getByText("Server-authoritative sync state").first()).toBeVisible();
  const syncMetrics = page.getByLabel("Server-authoritative sync queue counts");
  await expect(syncMetrics.locator("article", { hasText: "Synced" }).getByText(/[1-9]/)).toBeVisible();
  await expect(syncMetrics.locator("article", { hasText: "Duplicates" }).getByText(/[1-9]/)).toBeVisible();
  await expect(syncMetrics.locator("article", { hasText: "Validation failures" }).getByText(/[1-9]/)).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});

test("protected pilot route login returns to the originally requested route", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/admin/reporting-coverage");

  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Freporting-coverage$/);
  await page.getByLabel("Email").fill("org-admin@clinicpulse.local");
  await page.getByLabel("Password").fill("ClinicPulseDemo123!");
  await Promise.all([
    page.waitForURL(/\/admin\/reporting-coverage$/),
    page.getByRole("button", { name: "Log in" }).click(),
  ]);

  await expect(page.getByRole("heading", { name: "Coverage exception board" })).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});

test("district and admin surfaces expose data trust labels", async ({ page }) => {
  await signInAs(page, "district-manager@clinicpulse.local", "/district");
  await page.goto("/district");
  await expect(page.getByRole("heading", { name: "Source, freshness, and review state" })).toBeVisible();
  await expect(page.getByText(/Reviewed field data|Pending review|Demo data|Stale/i).first()).toBeVisible();
  await expect(page.getByText(/Last sync \\d{4}-\\d{2}-\\d{2}T/)).toHaveCount(0);

  await signInAs(page, "org-admin@clinicpulse.local", "/admin");
  await page.goto("/admin/reporting-coverage");
  await expect(page.getByText(/source, freshness, trust state/i).first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);

  await page.goto("/admin/data-ingestion");
  await expect(page.getByText(/source pipeline map/i).first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);

  await page.goto("/admin/audit-evidence");
  await expect(page.getByRole("heading", { name: "Audit event ledger" })).toBeVisible();
  await expect(page.getByText("Evidence export and retention")).toBeVisible();
  await expect(page.getByLabel("Audit evidence workspace")).toBeVisible();
  await expect(page.getByLabel("Linked evidence packets")).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});

test("pilot safety, privacy, and terms pages are reachable", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: /safety/i }).click();
  await expect(page).toHaveURL(/\/legal\/safety/);
  await expect(page.getByRole("heading", { name: /Pilot safety/i })).toBeVisible();
  await expect(page.getByText(/human confirmation/i)).toBeVisible();

  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: /Privacy/i })).toBeVisible();

  await page.goto("/legal/terms");
  await expect(page.getByRole("heading", { name: /Terms/i })).toBeVisible();
});

test("pilot-critical routes do not show implementation placeholders", async ({ page }) => {
  test.setTimeout(90_000);

  await signInAs(page, "org-admin@clinicpulse.local", "/admin");

  for (const route of pilotCriticalRoutes.filter((route) => route.startsWith("/admin"))) {
    await page.goto(route);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(1);
  }

  await signInAs(page, "reporter@clinicpulse.local", "/field");
  for (const route of ["/field", "/field/submit-report", "/field/sync-queue"]) {
    await page.goto(route);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  }

  await signInAs(page, "district-manager@clinicpulse.local", "/district");
  await page.goto("/district");
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});
