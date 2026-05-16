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
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
});

test("district and admin surfaces expose data trust labels", async ({ page }) => {
  await signInAs(page, "district-manager@clinicpulse.local", "/district");
  await page.goto("/district");
  await expect(page.getByRole("heading", { name: "Source, freshness, and review state" })).toBeVisible();
  await expect(page.getByText(/Reviewed field data|Pending review|Demo data|Stale/i).first()).toBeVisible();

  await signInAs(page, "org-admin@clinicpulse.local", "/admin");
  await page.goto("/admin/reporting-coverage");
  await expect(page.getByText(/source, freshness, and review state/i).first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);

  await page.goto("/admin/data-ingestion");
  await expect(page.getByText(/sync, ingestion, stale reconciliation/i).first()).toBeVisible();
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);

  await page.goto("/admin/audit-evidence");
  await expect(page.getByText(/report submission, report review, stale reconciliation/i).first()).toBeVisible();
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
  await signInAs(page, "org-admin@clinicpulse.local", "/admin");

  for (const route of pilotCriticalRoutes.filter((route) => route.startsWith("/admin"))) {
    await page.goto(route);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
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
