import { expect, test, type Page } from "@playwright/test";

const reporterAccount = {
  email: "reporter@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

async function signInAsReporter(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(reporterAccount.email);
  await page.getByLabel("Password").fill(reporterAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/field$/);
}

test("shows pending review feedback after an online field report submission", async ({
  page,
}) => {
  await signInAsReporter(page);

  await page
    .getByPlaceholder("Add context, barriers, and what changed today.")
    .fill(`Playwright pending review check ${Date.now()}`);
  await page.getByRole("button", { name: "Submit report" }).click();

  await expect(
    page.getByText("Report submitted and waiting for district review."),
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
});
