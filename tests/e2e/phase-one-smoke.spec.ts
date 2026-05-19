import { expect, test, type Page } from "@playwright/test";

import { phaseOneDemoRouteChecklist } from "../../lib/demo/demo-runbook";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(demoAccount.email);
  await page.getByLabel("Password").fill(demoAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

async function expectNoStagedProductLanguage(page: Page) {
  const visibleText = await page.locator("body").innerText();

  expect(visibleText).not.toMatch(
    /Live demo|Demo District|demo workspace|demo environment|No-login public flow|Book founder walkthrough|Tshwane North Demo/i,
  );
}

test.describe("phase-one demo route checklist", () => {
  test("keeps the smoke suite aligned with the runbook route order", async () => {
    expect(phaseOneDemoRouteChecklist.map((entry) => entry.path)).toEqual([
      "/",
      "/book-demo",
      "/book-demo/thanks",
      "/demo",
      "/demo/clinics/clinic-mamelodi-east",
      "/finder",
      "/field",
      "/admin",
    ]);
  });

  test("renders public landing and booking routes", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Book demo" })).toBeVisible();

    await page.goto("/book-demo");
    await expect(page).toHaveURL(/\/\?booking=1$/);
    await expect(page.getByRole("dialog", { name: "Book a Clinic Pulse demo" })).toBeVisible();

    await page.goto("/book-demo/thanks?name=Smoke&organization=E2E%20District");
    await expect(page.getByRole("heading", { name: "Thanks, Smoke" })).toBeVisible();
    await expect(page.getByText("Demo booking created successfully.")).toBeVisible();
  });

  test("renders public finder against the seeded API", async ({ page }) => {
    await page.goto("/finder");
    await expect(page.getByRole("heading", { name: "Clinic finder" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No-login public flow" })).toBeVisible();
    await expect(page.getByText("Mamelodi East Community Clinic")).toBeVisible();
  });

  test("renders protected district, clinic detail, field, and admin routes after login", async ({
    page,
  }) => {
    const clientApiWarnings: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      if (text.includes("Unable to fetch backend reroute alternatives")) {
        clientApiWarnings.push(text);
      }
    });

    await signIn(page);
    await page.goto("/demo");
    await expectNoStagedProductLanguage(page);

    await expect(
      page.getByRole("heading", { name: "Unified severity queue" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Command actions" })).toBeVisible();

    const firstPriority = page.getByRole("button", { name: /priority 1/i }).first();
    await expect(firstPriority).toBeVisible();
    await firstPriority.click();
    await expect(page.getByText(/primary action/i)).toBeVisible();
    await expect(page.getByText(/expected outcome/i)).toBeVisible();

    await expect(page.getByRole("heading", { name: "Clinic table" })).toBeVisible();
    await expect(page.getByText("Report stream")).toBeVisible();

    await page.goto("/demo/clinics/clinic-mabopane-station");
    await expectNoStagedProductLanguage(page);
    await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mabopane Station Clinic" })).toBeVisible();

    await page.goto("/field");
    await expectNoStagedProductLanguage(page);
    await expect(page.getByRole("heading", { name: "Field workbench" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Submit clinic status" })).toBeVisible();

    await page.goto("/admin");
    await expectNoStagedProductLanguage(page);
    await expect(page.getByRole("heading", { name: "Operations admin deck" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stakeholder activity queue" })).toBeVisible();

    await page.goto("/demo");
    await expectNoStagedProductLanguage(page);
    const supportingOperations = page
      .getByText("Supporting operations", { exact: true })
      .filter({ visible: true })
      .first();
    await expect(supportingOperations).toBeVisible();
    await supportingOperations.scrollIntoViewIfNeeded();
    const replayIncident = page.getByRole("button", { name: "Replay incident" });
    await replayIncident.scrollIntoViewIfNeeded();
    await expect(replayIncident).toBeVisible();
    await replayIncident.click();
    await expect(page.getByText(/partner webhook evidence/i)).toBeVisible();

    expect(clientApiWarnings).toEqual([]);
  });
});
