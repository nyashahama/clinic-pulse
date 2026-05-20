import { expect, test, type Page } from "@playwright/test";

import { signInAs } from "./helpers/auth";
import { pathPattern } from "./helpers/navigation";

async function signIn(page: Page, email: string) {
  await signInAs(page, email, "/admin");
}

async function clickSidebarLink(page: Page, name: string, path: string) {
  const sidebar = page.locator('[data-sidebar="sidebar"]:visible').first();
  const link = sidebar.locator(`a[href="${path}"]`).filter({ hasText: name }).first();

  await expect(link).toBeVisible();
  await Promise.all([page.waitForURL(pathPattern(path)), link.click()]);
  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  await expect(page.locator("[data-admin-module]").first()).toBeVisible();
}

test("organisation admin sees real governance modules", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  for (const path of [
    "/admin/users-roles",
    "/admin/access-review",
    "/admin/reporting-coverage",
    "/admin/audit-evidence",
  ]) {
    await page.goto(path);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator("[data-admin-module]").first()).toBeVisible();
  }
});

test("reporting coverage clinic names open operational detail", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/reporting-coverage");

  const coverageTable = page.getByLabel("Clinic reporting coverage");
  const clinicLink = coverageTable.getByRole("link", {
    name: /Mabopane Station Clinic/i,
  });

  await expect(clinicLink).toHaveAttribute(
    "href",
    "/district/clinics/clinic-mabopane-station?from=admin-reporting-coverage",
  );
  await Promise.all([
    page.waitForURL(/\/district\/clinics\/clinic-mabopane-station\?from=admin-reporting-coverage$/),
    clinicLink.click(),
  ]);
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to reporting coverage" })).toBeVisible();
});

test("reporting coverage rows open operational detail", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/reporting-coverage");

  const coverageTable = page.getByLabel("Clinic reporting coverage");
  const clinicRow = coverageTable.getByRole("row", {
    name: /Open Mabopane Station Clinic clinic detail/i,
  });

  await expect(clinicRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/district\/clinics\/clinic-mabopane-station\?from=admin-reporting-coverage$/),
    clinicRow.getByText("non functional", { exact: true }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/reporting-coverage$/),
    page.getByRole("button", { name: "Back to reporting coverage" }).click(),
  ]);
});

test("data ingestion clinic-backed rows open operational detail", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/data-ingestion");

  const pendingReportTable = page.getByLabel("Pending report evidence");
  const pendingReportRow = pendingReportTable.getByRole("row", {
    name: /Open pending report evidence for clinic-atteridgeville-extension/i,
  });

  await expect(pendingReportRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/district\/clinics\/clinic-atteridgeville-extension\?from=admin-data-ingestion$/),
    pendingReportRow.getByText("clinic-atteridgeville-extension").click(),
  ]);
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/data-ingestion$/),
    page.getByRole("button", { name: "Back to data ingestion" }).click(),
  ]);

  await page.goto("/admin/data-ingestion");
  const freshnessTable = page.getByLabel("Clinic ingestion freshness");
  const freshnessRow = freshnessTable.getByRole("row", {
    name: /Open Atteridgeville Extension Clinic clinic ingestion detail/i,
  });

  await expect(freshnessRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/district\/clinics\/clinic-atteridgeville-extension\?from=admin-data-ingestion$/),
    freshnessRow.getByText("Atteridgeville Extension Clinic").click(),
  ]);
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to data ingestion" })).toBeVisible();
});

test("entity-backed admin evidence rows open detail pages", async ({ page }) => {
  test.setTimeout(90_000);

  await signIn(page, "org-admin@clinicpulse.local");

  await page.goto("/admin/users-roles");
  const userLifecycleTable = page.getByLabel("User lifecycle evidence");
  const userRow = userLifecycleTable.getByRole("row", {
    name: /Open Organisation Admin user detail/i,
  });

  await expect(userRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/users-roles\/\d+\?from=admin-users-roles$/),
    userRow.getByText("Organisation Admin", { exact: true }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "User detail" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/users-roles$/),
    page.getByRole("link", { name: "Back to users and roles" }).click(),
  ]);

  await page.goto("/admin/audit-evidence");
  const auditTable = page.getByLabel("Audit event evidence");
  const auditRow = auditTable.getByRole("row", {
    name: /Open audit event \d+ detail/i,
  }).first();

  await expect(auditRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/audit-evidence\/events\/\d+\?from=admin-audit-evidence$/),
    auditRow.click(),
  ]);
  await expect(page.getByRole("heading", { name: "Audit event detail" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/audit-evidence$/),
    page.getByRole("link", { name: "Back to audit evidence" }).click(),
  ]);

  await page.goto("/admin/integrations");
  const integrationCheckTable = page.getByLabel("Integration check evidence");
  const integrationCheckRow = integrationCheckTable.getByRole("row", {
    name: /Open .* integration check detail/i,
  }).first();

  await expect(integrationCheckRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/integrations\/checks\/\d+\?from=admin-integrations$/),
    integrationCheckRow.click(),
  ]);
  await expect(page.getByRole("heading", { name: "Integration check detail" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/integrations$/),
    page.getByRole("link", { name: "Back to integrations" }).click(),
  ]);
});

test("security admin entity-backed rows open detail pages", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");

  await page.goto("/admin/security");
  const privilegedAccessTable = page.getByLabel("Privileged access evidence");
  const privilegedUserRow = privilegedAccessTable.getByRole("row", {
    name: /Open System Admin user detail/i,
  });

  await expect(privilegedUserRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/users-roles\/\d+\?from=admin-security$/),
    privilegedUserRow.getByText("System Admin", { exact: true }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "User detail" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to security posture" })).toBeVisible();
});

test("desktop admin navigation opens standalone governance modules", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);

  test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

  await signIn(page, "org-admin@clinicpulse.local");
  for (const [name, path] of [
    ["Reporting coverage", "/admin/reporting-coverage"],
    ["Users and roles", "/admin/users-roles"],
    ["Access review", "/admin/access-review"],
    ["Partner readiness", "/admin/partner-readiness"],
    ["Audit evidence", "/admin/audit-evidence"],
  ] as const) {
    await page.goto("/admin");
    await clickSidebarLink(page, name, path);
  }

  await signIn(page, "system-admin@clinicpulse.local");
  for (const [name, path] of [
    ["Tenant health", "/admin/tenant-health"],
    ["Reporting coverage", "/admin/reporting-coverage"],
    ["Data ingestion", "/admin/data-ingestion"],
    ["Security", "/admin/security"],
    ["Partner readiness", "/admin/partner-readiness"],
    ["Audit evidence", "/admin/audit-evidence"],
  ] as const) {
    await page.goto("/admin");
    await clickSidebarLink(page, name, path);
  }
});

test("organisation admin sees productized partner readiness module", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/partner-readiness");

  await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
  await expect(page.locator('[data-admin-module="partner-readiness"]')).toBeVisible();
  await expect(page.getByText("API key state")).toBeVisible();
  await expect(page.getByText("Export package state")).toBeVisible();
  await expect(page.getByText("Webhook preview state")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Integration checks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create key" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate export" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create webhook|Test webhook/ })).toBeVisible();
});

test("system admin sees productized platform governance modules", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");

  for (const adminModule of [
    {
      path: "/admin/tenant-health",
      marker: "tenant-health",
      content: [
        "Current tenant estate",
        "Clinic coverage",
        "Partner readiness evidence",
      ],
    },
    {
      path: "/admin/data-ingestion",
      marker: "data-ingestion",
      content: [
        "Ingestion pressure",
        "Offline queue",
        "Pending report evidence",
      ],
    },
    {
      path: "/admin/security",
      marker: "security",
      content: [
        "Security posture",
        "API key evidence",
        "Privileged access evidence",
      ],
    },
  ]) {
    await page.goto(adminModule.path);
    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator(`[data-admin-module="${adminModule.marker}"]`)).toBeVisible();

    for (const text of adminModule.content) {
      await expect(page.getByText(text).first()).toBeVisible();
    }
  }
});
