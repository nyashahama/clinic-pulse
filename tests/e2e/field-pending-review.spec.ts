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
        "The newest reports submitted into the operational record. Pending reports wait for district review before changing current status.",
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

test("restores an in-progress field report draft when returning to a clinic", async ({
  page,
}) => {
  await signInAsReporter(page);

  const notes = `Autosaved field draft ${Date.now()}`;
  const notesField = page.getByPlaceholder("Add context, barriers, and what changed today.");

  await page.locator("label").filter({ hasText: "Degraded" }).click();
  await page.locator("label").filter({ hasText: "High" }).click();
  await notesField.fill(notes);
  await expect(page.getByText("Draft saved on this device")).toBeVisible();

  await page.getByRole("button", { name: /Hammanskraal Unit D Clinic/ }).click();
  await expect(notesField).toHaveValue("");

  await page
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
