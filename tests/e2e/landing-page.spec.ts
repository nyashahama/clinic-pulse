import { expect, test } from "@playwright/test";

test.describe("landing page 2026", () => {
  test("opens with the live operations incident narrative", async ({ page }) => {
    await page.goto("/");

    const hero = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    });

    await expect(
      page.getByRole("heading", {
        name: "Know which clinics can help before patients travel.",
      }),
    ).toBeVisible();
    await expect(
      hero.getByText("Mamelodi East Community Clinic", { exact: true }).first(),
    ).toBeVisible();
    await expect(hero.getByText("Akasia Hills Clinic", { exact: true }).first()).toBeVisible();
    await expect(hero.getByText("AUD-2026-0504-017", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: /clinic entrance used to frame a live service availability incident/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Book demo" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Watch the incident flow" })).toBeVisible();
  });

  test("connects real-world stakeholders to the status gap", async ({ page }) => {
    await page.goto("/");

    const impactStrip = page.locator("section").filter({
      has: page.getByRole("heading", { name: "One status change affects everyone." }),
    });
    const statusGap = page.locator("section").filter({
      has: page.getByRole("heading", {
        name: "Clinic status changes before district systems catch up.",
      }),
    });

    await expect(
      impactStrip.getByRole("heading", { name: "One status change affects everyone." }),
    ).toBeVisible();
    await expect(impactStrip.getByText("District team")).toBeVisible();
    await expect(impactStrip.getByText("Field worker")).toBeVisible();
    await expect(impactStrip.getByText("Clinic coordinator")).toBeVisible();
    await expect(impactStrip.getByText("Patient")).toBeVisible();

    await expect(
      statusGap.getByRole("heading", {
        name: "Clinic status changes before district systems catch up.",
      }),
    ).toBeVisible();
    await expect(statusGap.getByText("Stale public data creates risk")).toBeVisible();
    await expect(
      statusGap.getByRole("img", {
        name: /clinic status context for a public availability update/i,
      }),
    ).toBeVisible();
  });
});
