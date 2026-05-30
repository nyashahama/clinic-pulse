import { expect, test, type Page } from "@playwright/test";

import { PRODUCT_LANGUAGE_BAN_LIST } from "../../lib/workspace/operations-scenario";
import { phaseOneWorkspaceRouteChecklist } from "../../lib/workspace/operations-runbook";

const localAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(localAccount.email);
  await page.getByLabel("Password").fill(localAccount.password);
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
    expect(phaseOneWorkspaceRouteChecklist.map((entry) => entry.path)).toEqual([
      "/",
      "/book-walkthrough",
      "/book-walkthrough/thanks",
      "/district",
      "/district/clinics/clinic-mabopane-station",
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

    await page.goto("/book-walkthrough");
    await expect(page).toHaveURL(/\/\?booking=1$/);
    await expect(
      page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" }),
    ).toBeVisible();
    await expectNoStagedProductLanguage(page);

    await page.goto("/book-walkthrough/thanks?name=Smoke&organization=E2E%20District");
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
    await page.goto("/district");
    await expectNoStagedProductLanguage(page);

    await expect(
      page.getByRole("heading", { name: "Tshwane North District operating picture" }),
    ).toBeVisible();
    await expect(page.locator('[data-district-home="command-page"]')).toBeVisible();
    await expect(page.locator("[data-district-command-map]")).toBeVisible();
    await expect(page.locator("[data-district-command-queue]")).toBeVisible();
    await expect(page.locator("[data-district-decision-packet]")).toBeVisible();
    await expect(page.getByText("Supporting operations", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clinic roster" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alert queue" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Report stream" })).toBeVisible();

    await page.goto("/district/clinics/clinic-mabopane-station");
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
    await expect(page.getByRole("heading", { name: "Ingestion pressure" })).toBeVisible();

    await page.goto("/admin/partner-readiness");
    await expectNoStagedProductLanguage(page);
    await expect(
      page.getByRole("heading", { name: "Partner readiness command centre" }),
    ).toBeVisible();

    await page.goto("/admin/scenario-controls");
    await expectNoStagedProductLanguage(page);
    await expect(page.getByRole("heading", { name: "Scenario controls" })).toBeVisible();
    await expect(page.locator('[data-admin-module="scenario-controls"]')).toBeVisible();
    const scenarioCommandPanel = page.locator('[aria-label="Scenario command panel"]');
    await expect(scenarioCommandPanel).toBeVisible();
    await expect(page.locator('[aria-label="Scenario evidence timeline"]')).toBeVisible();
    await expect(
      scenarioCommandPanel.getByRole("heading", { name: "Replay incident" }),
    ).toBeVisible();
    await scenarioCommandPanel.getByRole("button", { name: "Replay incident" }).click();
    await expect(scenarioCommandPanel).toContainText(
      "Incident replay applied across field report, alert, reroute, audit, and webhook evidence.",
    );
    await expect(page.locator('[aria-label="Scenario evidence timeline"]')).toContainText(
      /Partner Webhook/i,
    );

    expect(clientApiWarnings).toEqual([]);
  });
});
