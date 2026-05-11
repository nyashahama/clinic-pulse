import { expect, test, type Page } from "@playwright/test";

const password = "ClinicPulseDemo123!";
const reporterAccount = {
  email: "reporter@clinicpulse.local",
  password,
};
const districtManagerAccount = {
  email: "district-manager@clinicpulse.local",
  password,
};
const orgAdminAccount = {
  email: "org-admin@clinicpulse.local",
  password,
};
const successMessage = "Report submitted and waiting for district review.";

type PendingReport = {
  id: number;
  clinicId: string;
  notes?: string | null;
  reviewState: "pending" | "accepted" | "rejected";
};

async function signInAs(page: Page, account: { email: string; password: string }, home: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`${home.replace("/", "\\/")}$`));
}

async function fetchPendingReports(page: Page) {
  const pendingResponse = await page.request.get("/api/clinicpulse/v1/reports/pending");
  expect(pendingResponse.ok(), `Pending report lookup failed with ${pendingResponse.status()}`).toBe(
    true,
  );

  return (await pendingResponse.json()) as PendingReport[];
}

async function findPendingReportByNotes(page: Page, notes: string) {
  return (await fetchPendingReports(page)).find((report) => report.notes === notes);
}

async function rejectPendingReportsByNotes(page: Page, notes: string) {
  const loginResponse = await page.request.post("/api/clinicpulse/v1/auth/login", {
    data: districtManagerAccount,
  });
  if (!loginResponse.ok()) {
    throw new Error(`Cleanup login failed with ${loginResponse.status()}`);
  }

  const matchingReports = (await fetchPendingReports(page)).filter(
    (report) => report.notes === notes,
  );

  for (const report of matchingReports) {
    const reviewResponse = await page.request.post(
      `/api/clinicpulse/v1/reports/${report.id}/review`,
      {
        data: {
          decision: "rejected",
          notes: "Cleaned up by phase 3 report review E2E test.",
        },
      },
    );
    if (!reviewResponse.ok()) {
      throw new Error(`Cleanup review failed with ${reviewResponse.status()}`);
    }
  }
}

function formatCleanupError(error: unknown) {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

test("hands an online field report from reporter to district review and admin evidence context", async ({
  page,
}, testInfo) => {
  const testNotes = `Phase 3 handoff Playwright ${Date.now()}`;
  let reportMayNeedCleanup = false;
  let primaryError: unknown;

  try {
    await signInAs(page, reporterAccount, "/field");

    await page
      .getByPlaceholder("Add context, barriers, and what changed today.")
      .fill(testNotes);
    await page.getByRole("button", { name: "Submit report" }).click();
    reportMayNeedCleanup = true;

    await expect(page.getByRole("status").filter({ hasText: successMessage })).toBeVisible();

    await signInAs(page, districtManagerAccount, "/district");
    await page.goto("/district");

    const queue = page.locator('[data-testid="report-review-queue"]:visible');
    await expect(queue).toBeVisible();

    const pendingReport = await findPendingReportByNotes(page, testNotes);
    expect(pendingReport, "submitted report should be pending review").toBeTruthy();

    const reportId = pendingReport!.id;
    const reportItem = queue.locator(
      `[data-testid="report-review-item"][data-report-id="${reportId}"]`,
    );
    await expect(reportItem).toBeVisible();

    await reportItem.locator('[data-testid="accept-report-review"]').click();

    await expect(reportItem).toHaveCount(0);
    await expect
      .poll(async () => {
        const remainingReport = await findPendingReportByNotes(page, testNotes);
        return remainingReport?.reviewState ?? "reviewed";
      })
      .toBe("reviewed");
    const pendingReviewCountAfterAcceptance = (await fetchPendingReports(page)).length;

    await signInAs(page, orgAdminAccount, "/admin");
    await page.goto("/admin");

    const adminReviewPressure = page.locator("#admin-review-pressure");
    await expect(adminReviewPressure).toBeVisible();
    await expect(adminReviewPressure).toContainText("Governance review pressure");
    await expect(
      adminReviewPressure.locator("div").filter({
        hasText: new RegExp(
          `^Pending\\s*${pendingReviewCountAfterAcceptance}\\s*Awaiting decision$`,
        ),
      }),
    ).toBeVisible();
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    if (reportMayNeedCleanup) {
      try {
        await rejectPendingReportsByNotes(page, testNotes);
      } catch (cleanupError) {
        if (primaryError) {
          testInfo.annotations.push({
            type: "cleanup-error",
            description: formatCleanupError(cleanupError),
          });
        } else {
          throw cleanupError;
        }
      }
    }
  }
});
