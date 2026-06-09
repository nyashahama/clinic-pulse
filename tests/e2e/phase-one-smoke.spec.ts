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
      "/request-walkthrough",
      "/request-walkthrough/thanks",
      "/district",
      "/district/clinics/clinic-mabopane-station",
      "/finder",
      "/field",
      "/admin",
    ]);
  });

  test("renders public landing and booking routes", async ({ page }) => {
    await page.goto("/");
    // Hero h1 is split across spans — check for presence
    const hero = page.locator("h1");
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("Know which clinics");
    // Book walkthrough is in the nav header, not in hero
    await expect(page.getByRole("link", { name: "Book walkthrough" })).toBeVisible();
    await expectNoStagedProductLanguage(page);

    await page.goto("/request-walkthrough");
    await expect(page).toHaveURL(/\/\?booking=1$/);
    await expect(
      page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" }),
    ).toBeVisible();
    await expectNoStagedProductLanguage(page);

    await page.goto("/request-walkthrough/thanks?name=Smoke&organization=E2E%20District");
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

    await expect(page.getByRole("heading", { name: "Clinic roster" })).toBeVisible();
    await expect(page.getByText("Report stream")).toBeVisible();

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
    await expect(page.getByRole("heading", { name: "Ingestion pipeline monitor" })).toBeVisible();

    await page.goto("/admin/partner-readiness");
    await expectNoStagedProductLanguage(page);
    await expect(
      page.getByRole("heading", { name: "Partner Launch Cockpit" }).first(),
    ).toBeVisible();

    await page.goto("/admin/demo-controls");
    await expectNoStagedProductLanguage(page);
    await expect(
      page.getByRole("heading", { name: "Scenario rehearsal cockpit" }),
    ).toBeVisible();

    expect(clientApiWarnings).toEqual([]);
  });
});
