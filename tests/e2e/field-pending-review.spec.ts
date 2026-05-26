import { expect, test, type Page } from "@playwright/test";

const reporterAccount = {
  email: "reporter@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};
const operationsAccount = {
  email: "district-manager@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};
const successMessage = "Waiting for district review.";
const serverMutationHeaders = {
  "x-clinicpulse-server-mutation": "1",
};

async function signInAsReporter(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(reporterAccount.email);
  await page.getByLabel("Password").fill(reporterAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/field$/);
}

async function getWorkspaceShellScrollTop(page: Page) {
  return page.locator('[data-slot="sidebar-inset"]').evaluate((element) => {
    return element.scrollTop;
  });
}

async function rejectPendingReportByNotes(page: Page, notes: string) {
  const loginResponse = await page.request.post("/api/clinicpulse/v1/auth/login", {
    data: operationsAccount,
    headers: serverMutationHeaders,
  });
  if (!loginResponse.ok()) {
    throw new Error(`Cleanup login failed with ${loginResponse.status()}`);
  }

  const pendingResponse = await page.request.get("/api/clinicpulse/v1/reports/pending");
  if (!pendingResponse.ok()) {
    throw new Error(`Cleanup pending report lookup failed with ${pendingResponse.status()}`);
  }

  const pendingReports = (await pendingResponse.json()) as Array<{
    id: number;
    notes?: string | null;
  }>;
  const matchingReports = pendingReports.filter((report) => report.notes === notes);

  for (const report of matchingReports) {
    const reviewResponse = await page.request.post(
      `/api/clinicpulse/v1/reports/${report.id}/review`,
      {
        data: {
          decision: "rejected",
          notes: "Cleaned up by field pending review E2E test.",
        },
        headers: serverMutationHeaders,
      },
    );
    if (!reviewResponse.ok()) {
      throw new Error(`Cleanup review failed with ${reviewResponse.status()}`);
    }
  }
}

test("shows pending review feedback after an online field report submission", async ({
  page,
}) => {
  const testNotes = `Playwright pending review check ${Date.now()}`;

  try {
    await signInAsReporter(page);

    await page
      .getByPlaceholder("Add context, barriers, and what changed today.")
      .fill(testNotes);
    await page.getByRole("button", { name: "Submit report" }).click();

    await expect(
      page.getByTestId("field-report-receipt").filter({ hasText: successMessage }),
    ).toBeVisible();
    expect(await page.getByTestId("field-report-toast").count()).toBe(0);
    await expect(
      page.getByText(
        "Use recent submissions to return to the right clinic, confirm what changed, and see which handoffs came from an offline sync.",
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Online submissions go straight to district state; offline submissions land in queue.",
      ),
    ).toHaveCount(0);
  } finally {
    await rejectPendingReportByNotes(page, testNotes);
  }
});

test("shows the field visit cockpit in the mobile first viewport", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "mobile-chrome",
    "Mobile first viewport is covered by the mobile-chrome project.",
  );

  await signInAsReporter(page);

  const cockpit = page.locator("[data-field-visit-cockpit]");
  await expect(cockpit).toBeVisible();
  await expect(
    cockpit.locator("p").filter({ hasText: /Stop \d+ of \d+ -/ }).first(),
  ).toBeVisible();
  await expect(cockpit.getByRole("heading", { name: "Field task queue" })).toBeVisible();
  await expect(cockpit.getByRole("link", { name: /Open active stop/ })).toBeVisible();
  await expect(cockpit.getByRole("link", { name: /Check device sync/ })).toBeVisible();
  await expect(
    cockpit.getByRole("link", { name: /Start report|Continue report/ }),
  ).toBeVisible();

  const cockpitBox = await cockpit.boundingBox();
  expect(cockpitBox?.y ?? 9999).toBeLessThan(180);

  await cockpit.getByRole("link", { name: /Start report|Continue report/ }).click();

  const reportHeading = page.getByRole("heading", {
    name: "Submit clinic status",
  });
  await expect(reportHeading).toBeVisible();

  const reportHeadingBox = await reportHeading.boundingBox();
  expect(reportHeadingBox?.y ?? 9999).toBeLessThan(220);
});

test("keeps field hash navigation inside the page scroller", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chrome",
    "Desktop sidebar hash navigation is covered by the desktop-chrome project.",
  );

  await signInAsReporter(page);
  await expect(getWorkspaceShellScrollTop(page)).resolves.toBe(0);

  await page.getByRole("link", { name: "Recent reports", exact: true }).click();
  await expect(page).toHaveURL(/\/field#recent-reports$/);
  await expect(page.locator("#recent-reports")).toBeInViewport();
  await expect(getWorkspaceShellScrollTop(page)).resolves.toBe(0);

  await page.getByRole("link", { name: "Drafts and sync", exact: true }).click();
  await expect(page).toHaveURL(/\/field#drafts-sync$/);
  await expect(page.locator("#drafts-sync")).toBeInViewport();
  await expect(getWorkspaceShellScrollTop(page)).resolves.toBe(0);

  await page.getByRole("link", { name: "Submit report" }).first().click();
  await expect(page).toHaveURL(/\/field#submit-report$/);
  await expect(page.locator("#submit-report")).toBeInViewport();
  await expect(getWorkspaceShellScrollTop(page)).resolves.toBe(0);
});

test("uses the field route map to change the active stop", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chrome",
    "Desktop route map selection is covered by the desktop-chrome project.",
  );

  await signInAsReporter(page);

  const routeMap = page.getByTestId("field-route-map");
  await expect(routeMap.getByRole("heading", { name: "Route map" })).toBeVisible();
  await expect(routeMap.getByText(/8 stops/)).toBeVisible();
  await expect(routeMap.getByText(/risk-prioritized/i)).toBeVisible();

  await routeMap
    .getByRole("button", { name: /Open stop .*Hammanskraal Unit D Clinic/i })
    .click();

  await expect(
    routeMap.getByText("Active: Hammanskraal Unit D Clinic"),
  ).toBeVisible();
  await expect(
    page.locator("#submit-report").getByText("Hammanskraal Unit D Clinic"),
  ).toBeVisible();
});

test("uses recent report handoff rows to return to a clinic stop", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop-chrome",
    "Desktop handoff selection is covered by the desktop-chrome project.",
  );

  await signInAsReporter(page);

  await page.getByRole("link", { name: "Recent reports", exact: true }).click();

  const handoff = page.getByTestId("field-report-handoff");
  await expect(handoff.getByText("Review handoff")).toBeVisible();
  await expect(handoff.getByText("4 recent")).toBeVisible();
  await expect(handoff.getByText("0 offline syncs")).toBeVisible();

  await handoff
    .getByRole("button", { name: /Open report handoff for Soshanguve Block F Clinic/i })
    .click();

  await expect(
    page.getByTestId("field-route-map").getByText("Active: Soshanguve Block F Clinic"),
  ).toBeVisible();
  await expect(
    page.locator("#submit-report").getByText("Soshanguve Block F Clinic"),
  ).toBeVisible();
});

test("restores an in-progress field report draft when returning to a clinic", async ({
  page,
}) => {
  await signInAsReporter(page);

  const notes = `Autosaved field draft ${Date.now()}`;
  const notesField = page.getByPlaceholder("Add context, barriers, and what changed today.");
  const itineraryList = page.getByTestId("field-itinerary-list");

  await page.locator("label").filter({ hasText: "Degraded" }).click();
  await page.locator("label").filter({ hasText: "High" }).click();
  await notesField.fill(notes);
  await expect(page.getByText("Draft saved on this device")).toBeVisible();

  await itineraryList.getByRole("button", { name: /Hammanskraal Unit D Clinic/ }).click();
  await expect(notesField).toHaveValue("");

  await itineraryList
    .getByRole("button", { name: /Mamelodi East Community Clinic/ })
    .click();

  await expect(notesField).toHaveValue(notes);
  await expect(page.getByLabel("Degraded")).toBeChecked();
  await expect(page.getByLabel("High")).toBeChecked();
});

test("resumes a saved device report from the offline queue", async ({ page }) => {
  await signInAsReporter(page);

  const originalNotes = `Queued report edit ${Date.now()}`;
  const revisedNotes = `Revised queued report ${Date.now()}`;
  const notesField = page.getByPlaceholder("Add context, barriers, and what changed today.");

  await page.getByRole("button", { name: "Set offline mode" }).click();
  await page.locator("label").filter({ hasText: "Degraded" }).click();
  await page.locator("label").filter({ hasText: "High" }).click();
  await notesField.fill(originalNotes);
  await page.getByRole("button", { name: "Submit report" }).click();

  await expect(page.getByText("Saved to device")).toBeVisible();
  await expect(page.getByText(originalNotes)).toBeVisible();

  await page.getByRole("button", { name: "Edit saved report" }).click();
  await expect(notesField).toHaveValue(originalNotes);
  await expect(page.getByLabel("Degraded")).toBeChecked();
  await expect(page.getByLabel("High")).toBeChecked();
  await expect(page.getByText("Editing saved device report")).toBeVisible();

  await notesField.fill(revisedNotes);
  await page.getByRole("button", { name: "Update saved report" }).click();

  await expect(page.getByText(revisedNotes)).toBeVisible();
  await expect(page.getByText(originalNotes)).toHaveCount(0);
});

test("verifies the active stop with browser location", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (success: PositionCallback) =>
          success({
            coords: {
              accuracy: 4,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              latitude: -25.7096,
              longitude: 28.3676,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition),
      },
    });
  });

  await signInAsReporter(page);

  await expect(page.getByRole("heading", { name: "Visit verification" })).toBeVisible();
  await page.getByRole("button", { name: "Verify active stop" }).click();

  await expect(page.getByText("Location verified")).toBeVisible();
  await expect(page.getByText("Good GPS accuracy")).toBeVisible();
  await expect(page.getByText("0 m from Mamelodi East Community Clinic")).toBeVisible();
});
