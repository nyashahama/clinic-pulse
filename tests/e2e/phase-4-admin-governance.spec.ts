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
  await expect(page.getByRole("heading", { name: "Platform Operations Cockpit" })).toHaveCount(0);
});

test("system admin sees platform operations cockpit without implementation research rails", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Platform Operations Cockpit" })).toBeVisible();
  await expect(page.getByLabel("Active operational case")).toBeVisible();
  await expect(page.getByLabel("Platform health monitors")).toBeVisible();
  await expect(page.getByLabel("Operations queue")).toBeVisible();
  await expect(page.getByLabel("Selected operational case")).toBeVisible();
  await expectResearchRailHidden(page);
  await expect(
    page.getByText(/Trigger\.dev|OpenStatus|Supabase Studio|Unkey audit logs|Logto console|Infisical|Cal\.com|Dub|Svix|Kestra|Temporal|shadcn/i),
  ).toHaveCount(0);
  await expect(
    page
      .getByLabel("Selected operational case")
      .getByRole("link", { name: "Open data ingestion", exact: true }),
  ).toHaveAttribute("href", "/admin/data-ingestion");
});

test("system admin selects operations queue rows before opening source modules", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin");

  await expect(page.getByLabel("Selected operational case")).toContainText("Data ingestion");
  await page
    .getByLabel("Operations queue")
    .getByRole("button", { name: /Select Security and access operational case/i })
    .click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByLabel("Selected operational case")).toContainText("Security and access");
  await expect(
    page
      .getByLabel("Selected operational case")
      .getByRole("link", { name: "Open security", exact: true }),
  ).toHaveAttribute("href", "/admin/security");
  await expect(
    page
      .getByLabel("Platform health monitors")
      .getByRole("link", { name: "Open audit evidence", exact: true }),
  ).toHaveAttribute("href", "/admin/audit-evidence");
});

test("system admin command console remains navigable on mobile", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile-only coverage");

  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Platform Operations Cockpit" })).toBeVisible();
  await expect(page.getByLabel("Platform health monitors")).toBeVisible();
  await expect(
    page
      .getByLabel("Platform health monitors")
      .getByRole("link", { name: "Open tenant health", exact: true }),
  ).toHaveAttribute("href", "/admin/tenant-health");
});

test("tenant health keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/tenant-health");

  await expect(page.getByRole("heading", { name: "Tenant estate health map" })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("tenant health selects estate signals and district readiness", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/tenant-health");

  const selectedSignal = page.getByLabel("Selected estate signal");
  await expect(selectedSignal).toBeVisible();

  await page
    .getByLabel("Estate signal switchboard")
    .getByRole("button", { name: /Select estate signal Ingestion queue/i })
    .click();
  await expect(selectedSignal).toContainText("Ingestion queue");
  await expect(selectedSignal).toContainText("Review ingestion");
  await expect(page.getByLabel("Tenant health active issue")).toContainText("Ingestion queue");

  await page.getByRole("button", { name: "Mark estate signal reviewed" }).click();
  await expect(selectedSignal).toContainText("Reviewed for this session");

  await page
    .getByLabel("District readiness heatmap")
    .getByRole("button", { name: /Select district readiness Tshwane North District/i })
    .click();
  await expect(selectedSignal).toContainText("Tshwane North District");
  await expect(selectedSignal).toContainText(/freshness risk|pending field reports/i);
  await expect(page).toHaveURL(/\/admin\/tenant-health$/);
});

test("security posture keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/security");

  await expect(page.getByRole("heading", { name: "Security risk surface" })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("data ingestion keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/data-ingestion");

  await expect(page.getByRole("heading", { name: "Ingestion pipeline monitor" })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("data ingestion pipeline monitor selects stages and run steps", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/data-ingestion");

  const inspector = page.getByLabel("Ingestion failure-origin inspector");
  await expect(inspector).toBeVisible();

  await page
    .getByLabel("Source pipeline map")
    .getByRole("button", { name: /Inspect pipeline stage Validation gate/i })
    .click();
  await expect(inspector).toContainText("Validation gate");
  await expect(inspector).toContainText(/conflicts need attention|validation/i);
  await expect(page.getByLabel("Stage triage queue")).toContainText("Validation gate");
  await expect(page.getByLabel("Active ingestion issue")).toContainText("Validation gate");

  await page.getByRole("button", { name: "Mark stage reviewed" }).click();
  await expect(page.getByLabel("Stage triage queue")).toContainText("Reviewed for this session");

  await page
    .getByLabel("Pipeline run history")
    .getByRole("button", { name: /Inspect run step Offline queue/i })
    .click();
  await expect(inspector).toContainText("Offline queue");
  await expect(inspector).toContainText(/offline reports received/i);
  await expect(page).toHaveURL(/\/admin\/data-ingestion$/);
});

test("integration operations keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/integrations");

  await expect(
    page.getByRole("heading", { name: "Integration Delivery Console" }),
  ).toBeVisible();
  await expect(page.getByText("Launch gate runway", { exact: true })).toBeVisible();
  await expect(page.getByText("Endpoint smoke matrix", { exact: true })).toBeVisible();
  await expectResearchRailHidden(page);
});

test("integration operations selects evidence rows before opening source detail", async ({
  page,
  isMobile,
}) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/integrations");

  await expect(page.getByLabel("Integration evidence workspace")).toBeVisible();
  await expect(page.getByLabel("Integration evidence controls")).toBeVisible();
  await expect(page.getByLabel("Selected integration evidence")).toBeVisible();

  await page.getByRole("tab", { name: /Checks/i }).click();

  const checkRow = isMobile
    ? page
        .getByLabel("Integration evidence cards")
        .getByRole("button", { name: /Inspect .* integration check evidence/i })
        .first()
    : page
        .getByLabel("Integration check evidence")
        .getByRole("row", { name: /Inspect .* integration check evidence/i })
        .first();

  await expect(checkRow).toBeVisible();
  await checkRow.click();

  await expect(page).toHaveURL(/\/admin\/integrations$/);
  const selectedEvidence = page.getByLabel("Selected integration evidence");
  await expect(selectedEvidence).toContainText("Integration check");
  await expect(selectedEvidence).toContainText("Evidence basis");
  await expect(selectedEvidence).toContainText("Review state");
  await expect(selectedEvidence).toContainText("Next step");

  const sourceLink = selectedEvidence.getByRole("link", {
    name: /Open source evidence/i,
  });
  await expect(sourceLink).toHaveAttribute(
    "href",
    /\/admin\/integrations\/checks\/\d+\?from=admin-integrations$/,
  );

  await Promise.all([
    page.waitForURL(/\/admin\/integrations\/checks\/\d+\?from=admin-integrations$/),
    sourceLink.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Integration check evidence brief" }),
  ).toBeVisible();
});

test("audit evidence keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/audit-evidence");

  await expect(
    page.getByRole("heading", { name: "Audit event ledger" }),
  ).toBeVisible();
  await expectResearchRailHidden(page);
});

test("partner readiness keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/partner-readiness");

  await expect(
    page.getByRole("heading", { name: "Partner Launch Cockpit" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Launch gate runway", { exact: true })).toBeVisible();
  await expect(page.getByText("Handoff packet", { exact: true }).first()).toBeVisible();
  await expectResearchRailHidden(page);
});

test("access review keeps implementation research out of user-facing UI", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/access-review");

  await expect(page.getByRole("heading", { name: "Effective access cockpit" })).toBeVisible();
  await expect(page.getByLabel("Effective access workspace")).toBeVisible();
  await expect(page.getByLabel("Selected principal packet")).toBeVisible();
  await expect(page.getByLabel("Permission audit matrix")).toBeVisible();
  await expectResearchRailHidden(page);
});

test("access review selects principals and filters effective actions before opening evidence", async ({ page }) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/access-review");

  const workspace = page.getByLabel("Effective access workspace");
  const selectedPacket = page.getByLabel("Selected principal packet");
  const permissionMatrix = page.getByLabel("Permission audit matrix");

  const selectedPrincipalHeading = selectedPacket.getByRole("heading");
  const initialPrincipalName = (await selectedPrincipalHeading.textContent())?.trim();
  expect(initialPrincipalName).toBeTruthy();
  const targetPrincipalName =
    initialPrincipalName === "System Admin" ? "Organisation Admin" : "System Admin";

  await workspace
    .getByRole("searchbox", { name: "Search principals" })
    .fill(targetPrincipalName.toLowerCase());
  await expect(selectedPrincipalHeading).toHaveText(initialPrincipalName!);

  await workspace
    .getByRole("button", { name: new RegExp(`Select ${targetPrincipalName} principal`, "i") })
    .click();

  await expect(page).toHaveURL(/\/admin\/access-review$/);
  await expect(selectedPrincipalHeading).toHaveText(targetPrincipalName);
  await expect(permissionMatrix).toContainText(`${targetPrincipalName} effective access`);

  await permissionMatrix.getByRole("button", { name: /^Denied\b/i }).click();
  await expect(permissionMatrix).toContainText("Submit field reports");
  await expect(permissionMatrix).not.toContainText("Manage platform controls");

  await permissionMatrix
    .getByRole("searchbox", { name: "Search actions and grant sources" })
    .fill("platform");
  await expect(permissionMatrix).toContainText("No effective actions match");

  const evidenceLink = selectedPacket.getByRole("link", { name: "Open user evidence" });
  await expect(evidenceLink).toHaveAttribute(
    "href",
    /\/admin\/users-roles\/\d+\?from=admin-access-review$/,
  );

  await Promise.all([
    page.waitForURL(/\/admin\/users-roles\/\d+\?from=admin-access-review$/),
    evidenceLink.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Identity access evidence brief" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to access review" })).toBeVisible();
});

test("users and roles shows lifecycle controls and role assignment map", async ({ page }) => {
  await signIn(page, "org-admin@clinicpulse.local");
  await page.goto("/admin/users-roles");

  await expect(page.getByRole("heading", { name: "Access lifecycle cockpit" })).toBeVisible();
  await expect(page.getByLabel("Role assignment map")).toBeVisible();
  await expect(page.getByLabel("Lifecycle controls")).toBeVisible();
  await expect(page.getByText("Effective access baseline")).toBeVisible();
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
    page.getByRole("heading", { name: "Coverage exception board" }),
  ).toBeVisible();
  await expect(page.getByLabel("Coverage exception queue")).toBeVisible();
  await expect(page.getByLabel("Evidence receipt inspector")).toBeVisible();

  const coverageTable = page.getByLabel("Clinic reporting coverage");
  const clinicRow = coverageTable.getByRole("row", {
    name: /Inspect coverage receipt for Mabopane Station Clinic/i,
  });

  await expect(clinicRow).toBeVisible();
  await clinicRow.getByText("non functional", { exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/reporting-coverage$/);
  await expect(page.getByRole("heading", { name: "Mabopane Station Clinic" })).toBeVisible();
  await expect(page.getByLabel("Evidence receipt inspector")).toContainText(
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

test("entity-backed admin evidence rows open detail pages", async ({ page, isMobile }) => {
  test.setTimeout(90_000);

  await signIn(page, "org-admin@clinicpulse.local");

  await page.goto("/admin/users-roles");
  const userRow = page
    .getByRole("row", { name: /Open Organisation Admin user detail|Organisation Admin/i })
    .first();

  await expect(userRow).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/users-roles\/\d+\?from=admin-users-roles$/),
    userRow.getByRole("link", { name: "Organisation Admin" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Identity access evidence brief" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Access packet" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Audit event evidence brief" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Audit packet" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/audit-evidence$/),
    page.getByRole("link", { name: "Back to audit evidence" }).click(),
  ]);

  await page.goto("/admin/integrations");
  const integrationCheckRow = isMobile
    ? page
        .getByLabel("Integration evidence cards")
        .getByRole("button", { name: /Inspect .* integration check evidence/i })
        .first()
    : page
        .getByLabel("Integration check evidence")
        .getByRole("row", { name: /Inspect .* integration check evidence/i })
        .first();

  await expect(integrationCheckRow).toBeVisible();
  await integrationCheckRow.click();
  const integrationSourceLink = page
    .getByLabel("Selected integration evidence")
    .getByRole("link", { name: /Open source evidence/i });
  await Promise.all([
    page.waitForURL(/\/admin\/integrations\/checks\/\d+\?from=admin-integrations$/),
    integrationSourceLink.click(),
  ]);
  await expect(
    page.getByRole("heading", { name: "Integration check evidence brief" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Check packet" })).toBeVisible();
  await Promise.all([
    page.waitForURL(/\/admin\/integrations$/),
    page.getByRole("link", { name: "Back to integrations" }).click(),
  ]);

  const readinessResponse = await page.request.get(
    "/api/clinicpulse/v1/admin/partner-readiness",
  );
  expect(
    readinessResponse.ok(),
    `Partner readiness lookup failed with ${readinessResponse.status()}`,
  ).toBe(true);
  const readiness = (await readinessResponse.json()) as {
    apiKeys: Array<{ id: number }>;
    webhookSubscriptions: Array<{ id: number }>;
    webhookEvents: Array<{ id: number }>;
    exportRuns: Array<{ id: number }>;
    integrationChecks: Array<{ id: number }>;
  };
  expect(readiness.apiKeys[0], "expected seeded API key evidence").toBeTruthy();
  expect(
    readiness.webhookSubscriptions[0],
    "expected seeded webhook subscription evidence",
  ).toBeTruthy();
  expect(readiness.webhookEvents[0], "expected seeded webhook event evidence").toBeTruthy();
  expect(readiness.exportRuns[0], "expected seeded export run evidence").toBeTruthy();
  expect(
    readiness.integrationChecks[0],
    "expected seeded integration check evidence",
  ).toBeTruthy();
  const integrationDetailRoutes = [
    {
      path: `/admin/integrations/api-keys/${readiness.apiKeys[0]?.id}?from=admin-integrations`,
      heading: "API key evidence brief",
      packet: "Credential packet",
    },
    {
      path: `/admin/integrations/webhook-subscriptions/${readiness.webhookSubscriptions[0]?.id}?from=admin-integrations`,
      heading: "Webhook receiver evidence brief",
      packet: "Receiver packet",
    },
    {
      path: `/admin/integrations/webhook-events/${readiness.webhookEvents[0]?.id}?from=admin-integrations`,
      heading: "Webhook event evidence brief",
      packet: "Delivery packet",
    },
    {
      path: `/admin/integrations/export-runs/${readiness.exportRuns[0]?.id}?from=admin-integrations`,
      heading: "Export package evidence brief",
      packet: "Export packet",
    },
    {
      path: `/admin/integrations/checks/${readiness.integrationChecks[0]?.id}?from=admin-integrations`,
      heading: "Integration check evidence brief",
      packet: "Check packet",
    },
  ];

  for (const route of integrationDetailRoutes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
    await expect(page.getByRole("heading", { name: route.packet })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to integrations" })).toBeVisible();
  }
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
  await expect(page.getByRole("heading", { name: "Export contract cockpit" })).toBeVisible();
  await expect(page.getByLabel("Handoff packet")).toBeVisible();
  await expect(page.getByLabel("Field contract")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open API contract" })).toHaveAttribute(
    "href",
    "/admin/api-contract?from=admin-export-schema",
  );
  await Promise.all([
    page.waitForURL(/\/admin$/),
    page.getByRole("link", { name: "Back to admin console" }).click(),
  ]);

  await Promise.all([
    page.waitForURL(/\/admin\/api-contract\?from=admin$/),
    page.getByRole("link", { name: "Open API contract" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "API contract cockpit" })).toBeVisible();
  await expect(page.getByLabel("API contract workspace")).toBeVisible();
  await expect(page.getByLabel("Contract endpoint list")).toBeVisible();
  await expect(page.getByLabel("Request parameters")).toBeVisible();
  await expect(page.getByText("Response contract").first()).toBeVisible();
});

test("system admin inspects API contract endpoints before opening source evidence", async ({
  page,
}) => {
  await signIn(page, "system-admin@clinicpulse.local");
  await page.goto("/admin/api-contract");

  await expect(page.getByRole("heading", { name: "API contract cockpit" })).toBeVisible();
  await expect(page.getByLabel("API contract workspace")).toBeVisible();
  await expect(page.getByLabel("Contract endpoint list")).toBeVisible();
  await expect(page.getByLabel("Selected endpoint contract")).toBeVisible();

  await page
    .getByLabel("Contract endpoint list")
    .getByRole("button", {
      name: /Select GET \/v1\/partner\/export\/latest endpoint contract/i,
    })
    .click();
  await expect(page).toHaveURL(/\/admin\/api-contract$/);
  await expect(page.getByLabel("Selected endpoint contract")).toContainText(
    "/v1/partner/export/latest",
  );
  await expect(page.getByLabel("Request parameters")).toContainText("Authorization");
  await expect(page.getByLabel("Response contract")).toContainText("checksum");
  await expect(page.getByLabel("Sample payload")).toContainText("checksum");

  const evidenceLink = page
    .getByLabel("Selected endpoint contract")
    .getByRole("link", { name: /Open source evidence/i });
  await expect(evidenceLink).toHaveAttribute(
    "href",
    /\/admin\/integrations\/export-runs\/\d+\?from=admin-api-contract$/,
  );

  await page.getByLabel("Search API contract endpoints").fill("integration-status");
  await expect(page.getByLabel("Selected endpoint contract")).toContainText(
    "/v1/partner/export/latest",
  );
  await page
    .getByLabel("Contract endpoint list")
    .getByRole("button", {
      name: /Select GET \/v1\/partner\/integration-status endpoint contract/i,
    })
    .click();
  await expect(page.getByLabel("Selected endpoint contract")).toContainText(
    "/v1/partner/integration-status",
  );
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
  await expect(page.getByRole("heading", { name: "Security risk surface" })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Identity access evidence brief" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Access packet" })).toBeVisible();
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
        "Tenant estate health map",
        "District health stack",
        "Health signal ledger",
      ],
    },
    {
      path: "/admin/data-ingestion",
      marker: "data-ingestion",
      content: [
        "Ingestion pipeline monitor",
        "Source pipeline map",
        "Pipeline run history",
        "Offline queue",
        "Pending report evidence",
      ],
    },
    {
      path: "/admin/security",
      marker: "security",
      content: [
        "Security risk surface",
        "Credential and access risk lanes",
        "Security lead evidence inspector",
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
