import { expect, test, type Page } from "@playwright/test";

import { signInAs } from "./helpers/auth";

async function signIn(page: Page, email: string, homePath: string) {
  await signInAs(page, email, homePath);
}

test("login page hides demo credentials when demo fallback is disabled", async ({
  page,
}) => {
  await page.goto("/login");

  await expect(page.getByText("Local demo credentials")).toBeHidden();
  await expect(page.getByText("ClinicPulseDemo123!")).toBeHidden();
});

test("register page stays provisioned-only when public registration is disabled", async ({
  page,
}) => {
  await page.goto("/register");

  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Request access review" }),
  ).toBeVisible();
});

test("admin can create a pilot user and sees the one-time temporary password", async ({
  page,
}) => {
  await signIn(page, "org-admin@clinicpulse.local", "/admin");
  await page.goto("/admin/users-roles");

  await page.getByRole("button", { name: "Create pilot user" }).click();
  await page
    .getByLabel("Work email")
    .fill(`pilot-${Date.now()}@example.test`);
  await page.getByLabel("Display name").fill("Pilot User");
  await page.getByLabel("Role", { exact: true }).selectOption("reporter");
  await page.getByLabel("Organisation ID", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Temporary password")).toBeVisible();
});

test("untrusted cookie mutation is rejected", async ({ page }) => {
  await signIn(page, "reporter@clinicpulse.local", "/field");

  const response = await page.request.post("/api/clinicpulse/v1/reports", {
    headers: { Origin: "https://evil.example" },
    data: { clinicId: "clinic-mamelodi-east", status: "operational" },
  });

  expect(response.status()).toBe(403);
});
