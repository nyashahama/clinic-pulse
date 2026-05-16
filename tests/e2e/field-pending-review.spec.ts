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
