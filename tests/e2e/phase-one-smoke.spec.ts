import { expect, test, type Page } from "@playwright/test";

import { PRODUCT_LANGUAGE_BAN_LIST } from "../../lib/demo/operations-scenario";
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
  const escapedBanList = PRODUCT_LANGUAGE_BAN_LIST.map((phrase) =>
    phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );

  expect(visibleText).not.toMatch(new RegExp(escapedBanList.join("|"), "i"));
}

test.describe("phase-one operations route checklist", () => {
  test("keeps the smoke suite aligned with the runbook route order", async () => {
    expect(phaseOneDemoRouteChecklist.map((entry) => entry.path)).toEqual([
      "/",
      "/book-demo",
      "/book-demo/thanks",
      "/demo",
      "/demo/clinics/clinic-mabopane-station",
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
    await expect(page.getByRole("button", { name: "Book walkthrough" })).toBeVisible();
    await expectNoStagedProductLanguage(page);

    await page.goto("/book-demo");
    await expect(page).toHaveURL(/\/\?booking=1$/);
    await expect(
      page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" }),
    ).toBeVisible();
    await expectNoStagedProductLanguage(page);

    await page.goto("/book-demo/thanks?name=Smoke&organization=E2E%20District");
    await expect(page.getByRole("heading", { name: "Thanks, Smoke" })).toBeVisible();
    await expect(page.getByText("Request captured successfully.")).toBeVisible();
    await expectNoStagedProductLanguage(page);
  });

  test("renders public finder against the seeded API", async ({ page }) => {
    await page.goto("/finder");
    await expect(page.getByRole("heading", { name: "Clinic finder" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Public routing view" })).toBeVisible();
    await expect(page.getByText("Mabopane Station Clinic")).toBeVisible();
    await expectNoStagedProductLanguage(page);
  });

  test("renders public clinic detail without staged framing", async ({ page }) => {
    await page.goto("/clinics/clinic-mabopane-station");
    await expect(page.getByRole("heading", { name: "Mabopane Station Clinic" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Request operations walkthrough" }),
    ).toBeVisible();
    await expectNoStagedProductLanguage(page);
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
    await expect(
      page.getByRole("heading", { name: "Organisation Governance Workbench" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Stakeholder follow-up" })).toBeVisible();

    await page.goto("/admin/data-ingestion");
    await expectNoStagedProductLanguage(page);
    await expect(page.getByRole("heading", { name: "Ingestion command cockpit" })).toBeVisible();

    await page.goto("/admin/partner-readiness");
    await expectNoStagedProductLanguage(page);
    await expect(
      page.getByRole("heading", { name: "Partner Launch Cockpit" }).first(),
    ).toBeVisible();

    await page.goto("/admin/demo-controls");
    await expectNoStagedProductLanguage(page);
    await expect(page.getByRole("heading", { name: "Scenario controls" })).toBeVisible();

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
    await expect(page.getByRole("heading", { name: "Incident replay" })).toBeVisible();
    await expect(
      page.getByText("Partner webhook", { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Delivered preview" })).toBeVisible();

    expect(clientApiWarnings).toEqual([]);
  });
});
