import { expect, test, type Locator, type Page } from "@playwright/test";

type SeededRole = "reporter" | "district_manager" | "org_admin" | "system_admin";

const password = "ClinicPulseDemo123!";

const roleScenarios: Array<{
  role: SeededRole;
  email: string;
  home: string;
  heading: string;
  sidebarLabels: string[];
  landmarks: string[];
}> = [
  {
    role: "reporter",
    email: "reporter@clinicpulse.local",
    home: "/field",
    heading: "Field workbench",
    sidebarLabels: ["Field Workbench", "Submit report", "Drafts and sync", "Recent reports"],
    landmarks: ["submit-report", "drafts-sync", "recent-reports"],
  },
  {
    role: "district_manager",
    email: "district-manager@clinicpulse.local",
    home: "/district",
    heading: "Tshwane North District operating picture",
    sidebarLabels: [
      "Command Center",
      "Severity queue",
      "Clinic network",
      "Clinic evidence",
      "Interventions",
    ],
    landmarks: [
      "district-home",
      "severity-queue",
      "clinic-network",
      "clinic-evidence",
      "interventions",
      "verification-handoff",
      "report-review",
    ],
  },
  {
    role: "org_admin",
    email: "org-admin@clinicpulse.local",
    home: "/admin",
    heading: "Operations admin deck",
    sidebarLabels: [
      "Admin Overview",
      "Reporting coverage",
      "Users and roles",
      "Access review",
      "Partner readiness",
      "Integrations",
      "Audit evidence",
      "Exports",
    ],
    landmarks: [
      "reporting-coverage",
      "users-roles",
      "admin-review-pressure",
      "partner-readiness",
      "audit-evidence",
      "exports",
    ],
  },
  {
    role: "system_admin",
    email: "system-admin@clinicpulse.local",
    home: "/admin",
    heading: "Platform operations deck",
    sidebarLabels: [
      "Platform Overview",
      "Tenant health",
      "Reporting coverage",
      "Data ingestion",
      "Security",
      "Partner readiness",
      "Integrations",
      "Scenario controls",
      "Audit evidence",
    ],
    landmarks: [
      "tenant-health",
      "reporting-coverage",
      "data-ingestion",
      "admin-review-pressure",
      "security",
      "partner-readiness",
      "demo-controls",
      "audit-evidence",
    ],
  },
];

const hiddenStandaloneHrefs = [
  "/field/submit-report",
  "/field/drafts-sync",
  "/field/recent-reports",
  "/field/sync-queue",
  "/admin/exports",
];

const publicDashboardHrefs = [
  "/",
  "/book-demo",
  "/book-demo/thanks",
  "/finder",
  "/clinics",
  "/login",
  "/register",
];

async function signInAs(page: Page, email: string, home: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`${home.replace("/", "\\/")}$`));
}

async function openDashboardSidebar(page: Page): Promise<Locator> {
  const viewport = page.viewportSize();

  if (viewport && viewport.width < 768) {
    await page.getByRole("button", { name: "Toggle dashboard navigation" }).click();
    const mobileSidebar = page.locator('[data-slot="sidebar"][data-mobile="true"]').first();
    await expect(mobileSidebar).toBeVisible();
    return mobileSidebar;
  }

  const desktopSidebar = page.locator('[data-slot="sidebar-inner"]').first();
  await expect(desktopSidebar).toBeVisible();
  return desktopSidebar;
}

function normalizeHrefPath(href: string | null) {
  if (!href) {
    return "";
  }

  return new URL(href, "http://clinicpulse.local").pathname;
}

function routeMatchesBaseOrSubpath(href: string | null, baseRoute: string) {
  const pathname = normalizeHrefPath(href);

  if (baseRoute === "/") {
    return pathname === "/";
  }

  return pathname === baseRoute || pathname.startsWith(`${baseRoute}/`);
}

async function getSidebarHrefs(sidebar: Locator) {
  return sidebar.locator("a[href]").evaluateAll((links) =>
    links
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => Boolean(href)),
  );
}

async function expectNoRouteMatches(sidebar: Locator, routes: string[]) {
  const hrefs = await getSidebarHrefs(sidebar);

  for (const route of routes) {
    expect(
      hrefs.filter((href) => routeMatchesBaseOrSubpath(href, route)),
      `${route} should be absent from sidebar hrefs`,
    ).toEqual([]);
  }
}

async function selectSeverityQueueFilter(page: Page, label: string, option: string) {
  await page.getByRole("button", { name: new RegExp(`${label} filter`, "i") }).click();
  await page.getByRole("menuitemradio", { name: option, exact: true }).click();
}

async function visibleSeverityClinicCount(page: Page) {
  const countText = await page
    .locator("[data-district-severity-toolbar]")
    .getByText(/\d+ clinics visible/)
    .textContent();
  const count = countText?.match(/\d+/)?.[0];

  return count ? Number(count) : -1;
}

test.describe("phase 1 role dashboard navigation", () => {
  for (const scenario of roleScenarios) {
    test(`${scenario.role} lands on the correct home and sees the right sidebar`, async ({
      page,
    }) => {
      await signInAs(page, scenario.email, scenario.home);

      await expect(page.locator(`[data-role-dashboard="${scenario.role}"]`)).toBeVisible();
      await expect(page.getByRole("heading", { name: scenario.heading })).toBeVisible();

      const sidebar = await openDashboardSidebar(page);
      const navLinks = sidebar.locator('[data-slot="sidebar-content"] a[href]');

      await expect(navLinks).toHaveText(scenario.sidebarLabels);
      await expectNoRouteMatches(sidebar, hiddenStandaloneHrefs);
      await expectNoRouteMatches(sidebar, publicDashboardHrefs);
    });

    test(`${scenario.role} exposes role dashboard landmarks`, async ({ page }) => {
      await signInAs(page, scenario.email, scenario.home);

      for (const landmark of scenario.landmarks) {
        await expect(page.locator(`#${landmark}`)).toBeVisible();
      }
    });
  }

  test("district manager home presents the full command page entry points", async ({
    page,
  }) => {
    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    const districtHome = page.locator('[data-district-home="command-page"]');
    const hero = districtHome.locator('section[aria-labelledby="district-home-title"]');

    await expect(districtHome).toBeVisible();
    await expect(hero.getByText("Primary district decision")).toBeVisible();
    await expect(
      hero.getByRole("heading", { name: "Mabopane Station Clinic" }),
    ).toBeVisible();

    const moduleCards = page.locator("[data-district-home-module]");
    await expect(moduleCards).toHaveCount(4);
    await expect(moduleCards).toContainText([
      "Severity queue",
      "Clinic network",
      "Clinic evidence",
      "Interventions",
    ]);
    await expect(
      moduleCards.getByRole("link", { name: /Triage queue: Severity queue/i }),
    ).toHaveAttribute("href", "/district/severity-queue");
    await expect(
      moduleCards.getByRole("link", { name: /Inspect capacity: Clinic network/i }),
    ).toHaveAttribute("href", "/district/clinic-network");
    await expect(
      moduleCards.getByRole("link", { name: /Review evidence: Clinic evidence/i }),
    ).toHaveAttribute("href", "/district/clinic-evidence");
    await expect(
      moduleCards.getByRole("link", { name: /Manage plans: Interventions/i }),
    ).toHaveAttribute("href", "/district/interventions");
  });

  test("district manager opens severity queue as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Severity queue", exact: true });

    await expect(link).toHaveAttribute("href", "/district/severity-queue");
    await Promise.all([
      page.waitForURL(/\/district\/severity-queue$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-district-module="severity-queue"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unified severity queue" })).toBeVisible();
    await expect(page.locator("[data-district-severity-metrics]")).toBeVisible();
    await expect(page.locator("[data-district-severity-toolbar]")).toBeVisible();
    await expect(page.getByRole("button", { name: /Status filter/i })).toBeVisible();
    await expect(page.getByText("Selected clinic decision")).toBeVisible();
    await expect(page.getByText("Next step", { exact: true })).toBeVisible();
    await expect(page.getByText("Evidence", { exact: true })).toBeVisible();
    await expect(page.getByText("Recommended action")).toHaveCount(0);
    await expect(page.getByText("Signal summary")).toHaveCount(0);
    await expect(page.getByText("Operational timeline")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "View report evidence" })).toBeVisible();
    await expect(page.getByLabel("Severity queue worklist")).toBeVisible();
    const nextStepCallout = page.locator(
      "[data-district-severity-next-step]:visible",
    );
    await expect(nextStepCallout).toHaveAttribute("data-tone", "watch");
    const watchToneColor = await nextStepCallout.evaluate(
      (element) => getComputedStyle(element).borderLeftColor,
    );

    await page
      .getByLabel("Severity queue worklist")
      .getByRole("button", {
        name: /Akasia Hills Clinic, stable severity score 0/i,
      })
      .click();
    await expect(nextStepCallout).toHaveAttribute("data-tone", "stable");
    await expect
      .poll(() =>
        nextStepCallout.evaluate((element) => getComputedStyle(element).borderLeftColor),
      )
      .not.toBe(watchToneColor);

    const firstClinic = page.getByLabel("Severity queue worklist").getByRole("button").first();
    await expect(firstClinic).toBeVisible();
    await firstClinic.click();
    await expect(
      page.locator('[data-district-severity-row][aria-pressed="true"]'),
    ).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/district\/clinics\/[^?]+\?from=district-severity-queue$/),
      page.getByRole("link", { name: "Open clinic detail" }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  });

  test("district manager opens clinic network as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Clinic network", exact: true });

    await expect(link).toHaveAttribute("href", "/district/clinic-network");
    await Promise.all([
      page.waitForURL(/\/district\/clinic-network$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-district-module="clinic-network"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clinic network" })).toBeVisible();
    await expect(page.locator("[data-district-clinic-network-metrics]")).toBeVisible();
    await expect(page.locator("[data-district-clinic-network-toolbar]")).toBeVisible();
    await expect(page.getByRole("button", { name: /Status filter/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Service filter/i })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search clinic network" })).toBeVisible();
    await expect(
      page.locator('[data-district-clinic-network-layout="map-first"]'),
    ).toBeVisible();
    await expect(
      page.locator("[data-district-clinic-network-command-surface]"),
    ).toBeVisible();
    await expect(
      page
        .locator("[data-district-clinic-network-command-surface]")
        .getByLabel("District clinic network map"),
    ).toBeVisible();
    await expect(
      page
        .locator("[data-district-clinic-network-command-surface]")
        .getByText("Routing capacity"),
    ).toBeVisible();
    await expect(page.getByText(/without turning the network page/i)).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Coverage table" })).toBeVisible();
    await expect(page.getByLabel("Clinic network worklist")).toBeVisible();
    await expect(page.getByText("Routing alternatives")).toBeVisible();
    await expect(
      page.getByLabel("Clinic network metrics").getByText("Network coverage"),
    ).toBeVisible();

    await page.getByRole("button", { name: /Status filter: All statuses/i }).click();
    await page.getByRole("menuitemradio", { name: "Operational" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("status"))
      .toBe("operational");
    await expect(page.locator("[data-district-clinic-network-toolbar]")).toContainText(
      "Operational",
    );

    await Promise.all([
      page.waitForURL(/\/district\/clinics\/[^?]+\?from=district-clinic-network$/),
      page.getByRole("link", { name: "Open clinic detail" }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  });

  test("clinic network is map-first on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "Mobile Clinic network hierarchy");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");
    await page.goto("/district/clinic-network");

    const commandSurface = page.locator(
      "[data-district-clinic-network-command-surface]:visible",
    );
    const metrics = page.locator("[data-district-clinic-network-metrics]:visible");

    await expect(commandSurface).toBeVisible();
    await expect(metrics).toBeVisible();

    const commandBox = await commandSurface.boundingBox();
    const metricsBox = await metrics.boundingBox();

    expect(commandBox?.y).toBeLessThan(metricsBox?.y ?? Number.POSITIVE_INFINITY);
    await expect(page.getByLabel("District clinic network map")).toBeVisible();
    await expect(commandSurface.getByText("Routing capacity", { exact: true })).toBeVisible();
  });

  test("district manager opens clinic evidence as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Clinic evidence", exact: true });

    await expect(link).toHaveAttribute("href", "/district/clinic-evidence");
    await Promise.all([
      page.waitForURL(/\/district\/clinic-evidence$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-district-module="clinic-evidence"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clinic evidence" })).toBeVisible();
    await expect(page.locator("[data-district-clinic-evidence-metrics]")).toBeVisible();
    await expect(page.locator("[data-district-clinic-evidence-toolbar]")).toBeVisible();
    await expect(page.getByRole("button", { name: /Evidence type filter/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Clinic filter/i })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search clinic evidence" })).toBeVisible();
    await expect(page.getByLabel("Clinic evidence ledger")).toBeVisible();
    await expect(page.getByText("Selected evidence packet")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Decision" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Trace" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Context" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Timeline" })).toBeVisible();
    await expect(page.getByText("Evidence trace")).toBeHidden();
    await page.getByRole("tab", { name: "Trace" }).click();
    await expect(page.getByText("Evidence trace")).toBeVisible();
    await page.getByRole("tab", { name: "Decision" }).click();
    await page.getByRole("button", { name: "Stage decision" }).click();
    await expect(page.getByText("Decision staged")).toBeVisible();
    await expect(page.getByText("Owner / age")).toBeVisible();

    await page
      .locator("[data-district-clinic-evidence-selected-packet]")
      .getByRole("button", { name: /Next/i })
      .click();
    await expect(
      page.locator("[data-district-clinic-evidence-selected-packet]"),
    ).toContainText("audit-001");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("evidence"))
      .toBe("audit-001");

    await page.goto("/district/clinic-evidence?evidence=audit-001");
    await expect(
      page.locator("[data-district-clinic-evidence-selected-packet]"),
    ).toContainText("audit-001");

    await page.getByRole("button", { name: /Needs action/i }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("queue"))
      .toBe("needs_action");
    await expect(page.getByRole("button", { name: /Needs action/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await page.goto("/district/clinic-evidence?queue=alerts&evidence=report-005");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("evidence"))
      .toBeNull();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("queue"))
      .toBe("alerts");

    await page.getByRole("button", { name: /Evidence type filter: All evidence/i }).click();
    await page.getByRole("menuitemradio", { name: "Reports" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("kind"))
      .toBe("report");
    await expect(page.locator("[data-district-clinic-evidence-toolbar]")).toContainText("Reports");
    await expect(page.getByText("No evidence matches these filters")).toBeVisible();

    await page.goto("/district/clinic-evidence");
    await page.getByRole("button", { name: /Evidence type filter: All evidence/i }).click();
    await page.getByRole("menuitemradio", { name: "Reports" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("kind"))
      .toBe("report");

    await Promise.all([
      page.waitForURL(/\/district\/reports\/[^?]+\?from=district-clinic-evidence$/),
      page.getByRole("link", { name: "Open report evidence" }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Report evidence brief" })).toBeVisible();
  });

  test("clinic evidence is review-first on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "Mobile Clinic evidence hierarchy");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");
    await page.goto("/district/clinic-evidence");

    const selectedPacket = page.locator(
      "[data-district-clinic-evidence-selected-packet]:visible",
    );
    const metrics = page.locator("[data-district-clinic-evidence-metrics]:visible");
    const ledger = page.locator('[aria-label="Clinic evidence ledger"]:visible');

    await expect(
      page.locator('[data-district-clinic-evidence-layout="review-first"]:visible'),
    ).toBeVisible();
    await expect(selectedPacket).toBeVisible();
    await expect(metrics).toBeVisible();
    await expect(ledger).toBeVisible();
    await expect(page.getByText("Evidence review queue")).toBeVisible();
    await expect(page.getByText("Evidence readiness")).toBeVisible();

    const packetBox = await selectedPacket.boundingBox();
    const metricsBox = await metrics.boundingBox();
    const ledgerBox = await ledger.boundingBox();

    expect(packetBox?.y).toBeLessThan(260);
    expect(packetBox?.height).toBeLessThan(980);
    expect(packetBox?.y).toBeLessThan(metricsBox?.y ?? Number.POSITIVE_INFINITY);
    expect(packetBox?.y).toBeLessThan(ledgerBox?.y ?? Number.POSITIVE_INFINITY);
    await expect(page.getByRole("tab", { name: "Decision" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Trace" })).toBeVisible();
  });

  test("district manager opens interventions as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Interventions", exact: true });

    await expect(link).toHaveAttribute("href", "/district/interventions");
    await Promise.all([
      page.waitForURL(/\/district\/interventions$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-district-module="interventions"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: "Interventions" })).toBeVisible();
    await expect(page.locator("[data-district-interventions-metrics]")).toBeVisible();
    await expect(page.locator("[data-district-interventions-toolbar]")).toBeVisible();
    await expect(page.getByRole("button", { name: /Stage filter/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Priority filter/i })).toBeVisible();
    await expect(page.getByRole("searchbox", { name: "Search intervention plans" })).toBeVisible();
    await expect(page.getByLabel("Intervention plan ledger")).toBeVisible();
    await expect(page.getByText("Selected intervention plan")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Decision" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Route" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Proof" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Timeline" })).toBeVisible();
    await expect(page.getByText("Owner / proof")).toBeVisible();

    const selectedPlan = page.locator("[data-district-interventions-selected-plan]");
    await expect(selectedPlan).not.toContainText("/district/clinic-evidence");
    await expect(selectedPlan.getByRole("tab", { name: "Decision", exact: true })).toHaveAttribute(
      "tabindex",
      "0",
    );
    await expect(selectedPlan.getByRole("tab", { name: "Route", exact: true })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await selectedPlan.getByRole("tab", { name: "Decision", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(
      selectedPlan.getByRole("tab", { name: "Route", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(selectedPlan.getByRole("tab", { name: "Decision", exact: true })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    await expect(selectedPlan.getByRole("tab", { name: "Route", exact: true })).toHaveAttribute(
      "tabindex",
      "0",
    );
    await expect(selectedPlan.getByText(/Stabilise .* document the next owner/i)).toBeVisible();

    await expect(selectedPlan).toContainText(/Plan 1 of \d+/);
    await selectedPlan.getByRole("button", { name: "Next intervention plan" }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get("plan")).toMatch(
      /^intervention-/,
    );
    await expect(selectedPlan).toContainText(/Plan 2 of \d+/);

    await page.getByRole("button", { name: "Stage plan" }).click();
    await expect(page.getByText("Plan staged")).toBeVisible();

    await page.getByRole("button", { name: /Stage filter: All stages/i }).click();
    await page.getByRole("menuitemradio", { name: "Routing" }).click();
    await expect
      .poll(() => new URL(page.url()).searchParams.get("stage"))
      .toBe("routing");
    await expect(page.locator("[data-district-interventions-toolbar]")).toContainText(
      "Routing",
    );

    await Promise.all([
      page.waitForURL(/\/district\/clinic-evidence\?clinic=/),
      page.getByRole("link", { name: "Review evidence" }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Clinic evidence" })).toBeVisible();
  });

  test("interventions is plan-first on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chrome", "Mobile interventions hierarchy");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");
    await page.goto("/district/interventions");

    const selectedPlan = page.locator(
      "[data-district-interventions-selected-plan]:visible",
    );
    const metrics = page.locator("[data-district-interventions-metrics]:visible");
    const ledger = page.locator('[aria-label="Intervention plan ledger"]:visible');

    await expect(
      page.locator('[data-district-interventions-layout="plan-first"]:visible'),
    ).toBeVisible();
    await expect(selectedPlan).toBeVisible();
    await expect(metrics).toBeVisible();
    await expect(ledger).toBeVisible();

    const selectedBox = await selectedPlan.boundingBox();
    const metricsBox = await metrics.boundingBox();
    const ledgerBox = await ledger.boundingBox();
    const selectedPrecedesMetricsInDom = await page.evaluate(() => {
      const selected = document.querySelector(
        "[data-district-interventions-selected-plan]",
      );
      const metricsElement = document.querySelector("[data-district-interventions-metrics]");

      return Boolean(
        selected &&
          metricsElement &&
          selected.compareDocumentPosition(metricsElement) &
            Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    expect(selectedBox?.y).toBeLessThan(280);
    expect(selectedBox?.height).toBeLessThan(940);
    expect(selectedBox?.y).toBeLessThan(metricsBox?.y ?? Number.POSITIVE_INFINITY);
    expect(selectedBox?.y).toBeLessThan(ledgerBox?.y ?? Number.POSITIVE_INFINITY);
    expect(selectedPrecedesMetricsInDom).toBe(true);
    await expect(page.getByRole("tab", { name: "Decision" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Route" })).toBeVisible();
  });

  test("district severity queue filters update queue state and URL", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop filter regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");
    await page.goto(
      "/district/severity-queue?status=invalid&freshness=invalid&alert=invalid&offline=invalid&service=Imaginary",
    );

    await expect(page).toHaveURL(/\/district\/severity-queue$/);
    await expect.poll(() => visibleSeverityClinicCount(page)).toBeGreaterThan(0);
    const initialClinicCount = await visibleSeverityClinicCount(page);
    await expect(page.getByRole("button", { name: /Status filter: All statuses/i })).toBeVisible();

    await selectSeverityQueueFilter(page, "Status", "Operational");

    await expect
      .poll(() => new URL(page.url()).searchParams.get("status"))
      .toBe("operational");
    await expect.poll(() => visibleSeverityClinicCount(page)).toBeGreaterThan(0);

    const operationalClinicCount = await visibleSeverityClinicCount(page);
    const worklistRows = page.getByLabel("Severity queue worklist").getByRole("button");
    await expect(worklistRows).toHaveCount(operationalClinicCount);

    const firstOperationalLabel = await worklistRows.first().getAttribute("aria-label");
    const firstOperationalClinicName = firstOperationalLabel?.match(/^Priority 1: (.*), /)?.[1];
    expect(firstOperationalClinicName).toBeTruthy();
    await expect(
      page.getByRole("heading", { name: firstOperationalClinicName! }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: /Status filter: Operational/i })).toBeVisible();
    await expect(page.locator("[data-district-severity-toolbar]")).toContainText(
      `${operationalClinicCount} clinics visible`,
    );

    await selectSeverityQueueFilter(page, "Freshness", "Stale");

    await expect
      .poll(() => new URL(page.url()).searchParams.get("status"))
      .toBe("operational");
    await expect
      .poll(() => new URL(page.url()).searchParams.get("freshness"))
      .toBe("stale");
    await expect(page.getByText("0 clinics visible")).toBeVisible();
    await expect(page.getByText("No clinics match these filters")).toBeVisible();
    await expect(page.getByLabel("Severity queue worklist")).toHaveCount(0);

    await page.getByRole("button", { name: "Reset" }).click();

    await expect(page).toHaveURL(/\/district\/severity-queue$/);
    await expect(page.getByRole("button", { name: /Status filter: All statuses/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Freshness filter: All freshness/i })).toBeVisible();
    await expect(page.locator("[data-district-severity-toolbar]")).toContainText(
      `${initialClinicCount} clinics visible`,
    );
    await expect(page.getByLabel("Severity queue worklist")).toBeVisible();
  });

  test("district manager opens report evidence from severity queue", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop evidence route regression");

    await signInAs(page, "district-manager@clinicpulse.local", "/district");
    await page.goto("/district/severity-queue");

    await Promise.all([
      page.waitForURL(/\/district\/reports\/[^?]+\?from=district-severity-queue$/),
      page.getByRole("link", { name: "View report evidence" }).click(),
    ]);

    await expect(page.getByRole("heading", { name: "Report evidence" })).toBeVisible();
    await expect(page.getByText("Evidence brief", { exact: true })).toBeVisible();
    await expect(page.getByText("Priority signal", { exact: true })).toBeVisible();
    await expect(page.getByText("What happened", { exact: true })).toBeVisible();
    await expect(page.getByText("Decision context", { exact: true })).toBeVisible();
    await expect(page.getByText("Recommended action", { exact: true })).toBeVisible();
    await expect(page.getByText("Trust and provenance", { exact: true })).toBeVisible();
    await expect(page.getByText("Operational signals", { exact: true })).toBeVisible();
    await expect(page.getByText("Signal pressure", { exact: true })).toBeVisible();
    await expect(page.getByText("Evidence timeline", { exact: true })).toBeVisible();
    await expect(page.getByText('"reporterName"')).toBeHidden();
    await page.getByText("Technical payload", { exact: true }).click();
    await expect(page.getByText('"reporterName"')).toBeVisible();
    await expect(page.getByRole("link", { name: "Open clinic detail" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Back to severity queue" })).toBeVisible();
  });

  test("demo showcase does not expose report review", async ({ page }) => {
    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    await page.goto("/demo");

    await expect(
      page.locator('[data-role-dashboard="district_manager"]').filter({ visible: true }),
    ).toBeVisible();
    await expect(page.locator("#report-review")).toHaveCount(0);
  });

  test("district users can open report stream details", async ({ page }) => {
    await signInAs(page, "district-manager@clinicpulse.local", "/district");

    for (const scenario of [
      {
        path: "/district",
        urlPattern: /\/district\/reports\/[^?]+\?from=district$/,
        backLabel: "Back to district console",
      },
      {
        path: "/demo",
        urlPattern: /\/demo\/reports\/[^?]+\?from=demo$/,
        backLabel: "Back to demo console",
      },
    ] as const) {
      await page.goto(scenario.path);

      const reportStream = page.locator("section", {
        has: page.getByRole("heading", { name: "Report stream" }),
      });
      const reportDetailLink = reportStream.getByRole("link", {
        name: /Open report detail/i,
      }).first();

      await expect(reportDetailLink).toBeVisible();
      await Promise.all([
        page.waitForURL(scenario.urlPattern),
        reportDetailLink.click(),
      ]);
      await expect(page.getByRole("heading", { name: "Report evidence brief" })).toBeVisible();
      await expect(page.getByRole("link", { name: scenario.backLabel })).toBeVisible();
      await expect(page.getByRole("link", { name: "Review clinic context" })).toBeVisible();
    }
  });

  test("system admin opens scenario controls as a standalone module", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chrome", "Desktop sidebar navigation regression");

    await signInAs(page, "system-admin@clinicpulse.local", "/admin");

    const sidebar = await openDashboardSidebar(page);
    const link = sidebar.getByRole("link", { name: "Scenario controls", exact: true });

    await expect(link).toHaveAttribute("href", "/admin/demo-controls");
    await Promise.all([
      page.waitForURL(/\/admin\/demo-controls$/),
      link.click(),
    ]);

    await expect(page.getByText("Implementation placeholder")).toHaveCount(0);
    await expect(page.locator('[data-admin-module="scenario-controls"]')).toBeVisible();
    await expect(page.locator('[aria-label="Scenario controls workspace"]')).toBeVisible();
    await expect(page.locator('[aria-label="Scenario runbook"]')).toBeVisible();
    await expect(page.locator('[aria-label="Scenario command panel"]')).toBeVisible();
    await expect(page.locator('[aria-label="Scenario evidence timeline"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset scenario" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trigger stockout" })).toBeVisible();
  });
});
