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

async function expectResearchRailHidden(page: Page) {
  await expect(page.getByText("Research basis", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /source.*references/i })).toHaveCount(0);
  await expect(page.getByText(/source-backed/i)).toHaveCount(0);
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

test("organisation admin home is a governance workbench", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin");

  await expect(
    page.getByRole("heading", { name: "Organisation Governance Workbench" }),
  ).toBeVisible();
  await expect(page.getByLabel("Governance task queue")).toBeVisible();
  await expect(page.getByLabel("Report review lane")).toBeVisible();
  await expect(page.getByLabel("Coverage ledger")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Open reporting coverage" }),
  ).toHaveAttribute("href", "/admin/reporting-coverage");
  await expect(
    page.getByRole("link", { name: "Open users and roles" }),
  ).toHaveAttribute("href", "/admin/users-roles");
  await expect(
    page.getByRole("link", { name: "Open partner readiness" }),
  ).toHaveAttribute("href", "/admin/partner-readiness");
  await expect(
    page.getByRole("link", { name: "Open audit evidence" }),
  ).toHaveAttribute("href", "/admin/audit-evidence");
  await expect(page.getByRole("heading", { name: "Platform Command Console" })).toHaveCount(0);
});

test("system admin sees platform command console without implementation research rails", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Platform Command Console" })).toBeVisible();
  await expect(page.getByLabel("Platform command metrics")).toBeVisible();
  await expect(page.getByLabel("Operational command lanes")).toBeVisible();
  await expect(page.getByLabel("Audit and evidence console")).toBeVisible();
  await expectResearchRailHidden(page);
  await expect(
    page.getByText(/Trigger\.dev|OpenStatus|Supabase Studio|Unkey audit logs|Logto console|Infisical|Cal\.com|Dub|shadcn/i),
  ).toHaveCount(0);
  await expect(
    page
      .getByLabel("Audit and evidence console")
      .getByRole("link", { name: "Open audit evidence", exact: true }),
  ).toHaveAttribute("href", "/admin/audit-evidence");
});

test("system admin command console remains navigable on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only coverage");

  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Platform Command Console" })).toBeVisible();
  await expect(page.getByLabel("Platform command metrics")).toBeVisible();
  await expect(
    page
      .getByLabel("Platform command metrics")
      .getByRole("link", { name: "Open tenant health", exact: true }),
  ).toHaveAttribute("href", "/admin/tenant-health");
});

test("tenant health keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/tenant-health");

  await expect(page.getByRole("heading", { name: "Tenant health" })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("security posture keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/security");

  await expect(page.getByRole("heading", { name: "Security posture" })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("data ingestion keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/data-ingestion");

  await expect(page.getByRole("heading", { name: "Ingestion pressure" })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("integration operations keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/integrations");

  await expect(
    page.getByRole("heading", { name: "Integration operations command centre" }),
  ).toBeVisible();
  await expectResearchRailHidden(page);
});

test("audit evidence keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/audit-evidence");

  await expect(
    page.getByRole("heading", { name: "Audit evidence command centre" }),
  ).toBeVisible();
  await expectResearchRailHidden(page);
});

test("partner readiness keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/partner-readiness");

  await expect(
    page.getByRole("heading", { name: "Partner readiness command centre" }),
  ).toBeVisible();
  await expectResearchRailHidden(page);
});

test("access review keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/access-review");

  await expect(
    page.getByRole("heading", { name: "Access review command centre" }),
  ).toBeVisible();
  await expectResearchRailHidden(page);
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

test("reporting coverage rows update the evidence receipt rail", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/reporting-coverage");

  await expect(
    page.getByRole("heading", { name: "Organisation readiness review" }),
  ).toBeVisible();
  await expect(page.getByLabel("Readiness review task queue")).toBeVisible();
  await expect(page.getByLabel("Selected clinic readiness packet")).toBeVisible();

  const coverageTable = page.getByLabel("Clinic reporting coverage");
  const clinicRow = coverageTable.getByRole("row", {
    name: /Inspect coverage receipt for Mabopane Station Clinic/i,
  });

  await expect(clinicRow).toBeVisible();
  await clinicRow.getByText("non functional", { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/reporting-coverage$/);
  await expect(page.getByRole("heading", { name: "Mabopane Station Clinic" })).toBeVisible();
  await expect(page.getByLabel("Selected clinic readiness packet")).toContainText(
    /Readiness impact|Recommended action/i,
  );
});

test("data ingestion clinic-backed rows open operational detail", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/data-ingestion");

  const pendingReportQueue = page.getByLabel("Ingestion evidence events");
  await expect(pendingReportQueue.getByText("Winterveldt West Clinic")).toBeVisible();
  const pendingReportRow = pendingReportQueue.getByRole("article", {
    name: /Ingestion event for clinic-atteridgeville-extension/i,
  });

  await expect(pendingReportRow).toBeVisible();
  await pendingReportRow
    .getByRole("button", { name: "Inspect evidence for clinic-atteridgeville-extension" })
    .click();
  await expect(page.getByLabel("Ingestion evidence console")).toContainText(
    "clinic-atteridgeville-extension",
  );
  await Promise.all([
    page.waitForURL(/\/district\/clinics\/clinic-atteridgeville-extension\?from=admin-data-ingestion$/),
    pendingReportRow
      .getByRole("link", { name: "Open clinic context for clinic-atteridgeville-extension" })
      .click(),
  ]);
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/data-ingestion$/),
    page.getByRole("button", { name: "Back to data ingestion" }).click(),
  ]);

  await page.goto("/admin/data-ingestion");
  const freshnessBacklog = page.getByLabel("Clinic freshness backlog");
  const freshnessRow = freshnessBacklog.getByRole("article", {
    name: /Open Atteridgeville Extension Clinic clinic ingestion detail/i,
  });

  await expect(freshnessRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/district\/clinics\/clinic-atteridgeville-extension\?from=admin-data-ingestion$/),
    freshnessRow
      .getByRole("link", { name: "Open Atteridgeville Extension Clinic clinic ingestion detail" })
      .click(),
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
  const auditWorkspace = page.getByLabel("Audit evidence workspace");
  const auditRow = auditWorkspace.getByRole("button", {
    name: /Open audit event \d+ detail/i,
  }).first();

  await expect(auditRow).toBeVisible();
  await auditRow.click();
  let sourceLink = page
    .getByLabel("Selected audit evidence")
    .getByRole("link", { name: /Open source evidence for/i });
  if ((await sourceLink.count()) === 0) {
    sourceLink = auditRow.locator("xpath=..").getByRole("link", { name: /Open source/i });
  }
  await expect(sourceLink).toHaveAttribute(
    "href",
    /\/admin\/audit-evidence\/events\/\d+\?from=admin-audit-evidence$/,
  );
  await Promise.all([
    page.waitForURL(/\/admin\/audit-evidence\/events\/\d+\?from=admin-audit-evidence$/),
    sourceLink.click(),
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

test("report review cards open report detail pages", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");

  const pendingResponse = await page.request.get("/api/clinicpulse/v1/reports/pending");
  expect(pendingResponse.ok(), `Pending report lookup failed with ${pendingResponse.status()}`).toBe(
    true,
  );
  const [pendingReport] = (await pendingResponse.json()) as Array<{ id: number }>;
  expect(pendingReport, "expected seeded pending report evidence").toBeTruthy();

  await page.goto("/admin");
  const queue = page.locator('[data-testid="report-review-queue"]:visible');
  const reportItem = queue.locator(
    `[data-testid="report-review-item"][data-report-id="${pendingReport.id}"]`,
  );

  await expect(reportItem).toBeVisible();
  await Promise.all([
    page.waitForURL(new RegExp(`/admin/reports/${pendingReport.id}\\?from=admin$`)),
    reportItem.getByRole("link", { name: "Open details" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Report evidence brief" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to admin console" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Review clinic context" })).toBeVisible();
});

test("admin overview preview controls open detail pages", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin");

  await Promise.all([
    page.waitForURL(/\/admin\/export-schema\?from=admin$/),
    page.getByRole("link", { name: "Open export schema" }).click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Export schema command centre" }),
  ).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin$/),
    page.getByRole("link", { name: "Back to admin console" }).click(),
  ]);

  await Promise.all([
    page.waitForURL(/\/admin\/api-contract\?from=admin$/),
    page.getByRole("link", { name: "Open API contract" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "API contract detail" })).toBeVisible();
});

test("stakeholder activity rows open lead detail pages", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin");

  const stakeholderTable = page.getByLabel("Stakeholder activity queue");
  const leadLink = stakeholderTable.getByRole("link", {
    name: /Open lead detail for Thandi Mabuza/i,
  });

  await expect(leadLink).toHaveAttribute("href", "/admin/leads/lead-001?from=admin");
  await Promise.all([
    page.waitForURL(/\/admin\/leads\/lead-001\?from=admin$/),
    leadLink.click(),
  ]);
  await expect(page.getByRole("heading", { name: "Stakeholder follow-up brief" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to admin console" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Email stakeholder" })).toHaveAttribute(
    "href",
    "mailto:thandi.mabuza@gautenghealth.gov.za",
  );
});

test("security admin selects evidence rows before opening source detail", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");

  await page.goto("/admin/security");
  await expect(page.getByRole("heading", { name: "Security posture" })).toBeVisible();
  await expect(page.getByLabel("Security evidence workspace")).toBeVisible();
  await expect(page.getByLabel("Security evidence controls")).toBeVisible();
  await expect(page.getByLabel("Security evidence lanes")).toBeVisible();
  await expect(page.getByLabel("Selected security evidence")).toBeVisible();
  await expect(page.getByText("Evidence map")).toHaveCount(0);
  await expect(page.getByText("Security evidence dossier")).toHaveCount(0);

  await page.getByLabel("Search security evidence").fill("no matching security evidence");
  await expect(page.getByText("No matching evidence")).toBeVisible();
  await expect(
    page.getByLabel("Selected security evidence").getByText("Select an evidence row"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByText("No matching evidence")).toHaveCount(0);

  await page.getByRole("tab", { name: /Privileged access/i }).click();
  const systemAdminRow = page.getByRole("button", {
    name: /Inspect security evidence for System Admin/i,
  }).first();

  await expect(systemAdminRow).toBeVisible();
  await systemAdminRow.click();
  await expect(page).toHaveURL(/\/admin\/security$/);

  const selectedEvidence = page.getByLabel("Selected security evidence");
  await expect(selectedEvidence.getByRole("heading", { name: "System Admin" })).toBeVisible();
  await expect(selectedEvidence.getByText("Evidence basis")).toBeVisible();
  await expect(selectedEvidence.getByText("Review state")).toBeVisible();
  await expect(selectedEvidence.getByText("Next step")).toBeVisible();

  const sourceLink = selectedEvidence.getByRole("link", { name: /Open source evidence/i });
  await expect(sourceLink).toHaveAttribute("href", /\/admin\/users-roles\/\d+\?from=admin-security$/);
  await Promise.all([
    page.waitForURL(/\/admin\/users-roles\/\d+\?from=admin-security$/),
    sourceLink.click(),
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
  await expect(page.getByRole("heading", { name: "Partner Launch Cockpit" })).toBeVisible();
  await expect(page.getByText("Partner action queue")).toBeVisible();
  await expect(page.getByText("Partner evidence ledger")).toBeVisible();
  await expect(page.getByLabel("Search partner evidence")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Integration checks", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create key" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate export" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Create webhook|Send test event/ }).first()).toBeVisible();
});

test("system admin sees productized platform governance modules", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");

  for (const adminModule of [
    {
      path: "/admin/tenant-health",
      marker: "tenant-health",
      content: [
        "Tenant health",
        "District health stack",
        "Health signal ledger",
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
        "Security posture evidence",
        "Security evidence workspace",
        "All evidence",
        "Credentials",
        "Webhooks",
        "Privileged access",
        "Audit trail",
        "Selected evidence",
        "Open source evidence",
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
