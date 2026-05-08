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
    const incidentProof = hero.locator("[data-incident-proof='true']").filter({
      visible: true,
    });
    const routeProof = hero.locator("[data-route-proof='true']").filter({
      visible: true,
    });

    await expect(incidentProof).toBeVisible();
    await expect(
      incidentProof.getByText("Mamelodi East Community Clinic", { exact: true }),
    ).toBeVisible();
    await expect(
      routeProof.getByText("Akasia Hills Clinic", { exact: true }),
    ).toBeVisible();
    await expect(
      incidentProof.getByText("AUD-2026-0504-017", { exact: true }),
    ).toBeVisible();
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

  test("shows one connected incident flow from report to audit", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Watch the incident flow" }).click();

    const flow = page.locator("#flow");

    await expect(page).toHaveURL(/#flow$/);
    await expect(
      flow.getByRole("heading", { name: "From field signal to operating record." }),
    ).toBeVisible();
    await expect(flow.getByText("Offline report queued")).toBeVisible();
    await expect(flow.getByText("Clinic status changed")).toBeVisible();
    await expect(flow.getByText("Wasted trip avoided")).toBeVisible();
    await expect(flow.getByText("Operating record sealed")).toBeVisible();
  });

  test("presents product surfaces with a clear operations hierarchy", async ({ page }) => {
    await page.goto("/");

    const product = page.locator("#product");

    await expect(
      product.getByRole("heading", { name: "The operating surfaces behind the decision." }),
    ).toBeVisible();
    await expect(product.getByRole("heading", { name: "District command center" })).toBeVisible();
    await expect(product.getByRole("heading", { name: "Offline field reports" })).toBeVisible();
    await expect(product.getByRole("heading", { name: "Patient rerouting" })).toBeVisible();
    await expect(
      product.getByRole("heading", { name: "Audit and export readiness" }),
    ).toBeVisible();
  });

  test("ends with public-sector evidence and an incident-specific CTA", async ({ page }) => {
    await page.goto("/");

    const trust = page.locator("#trust");
    const cta = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Walk through a live clinic status incident." }),
    });

    await expect(
      trust.getByRole("heading", { name: "Public-sector trust lives in the evidence chain." }),
    ).toBeVisible();
    await expect(trust.getByText("Source and permissions")).toBeVisible();
    await expect(trust.getByText("Freshness and audit")).toBeVisible();
    await expect(trust.getByText("District export")).toBeVisible();
    await expect(trust.getByText("Partner handoff", { exact: true })).toBeVisible();

    await expect(
      cta.getByRole("heading", { name: "Walk through a live clinic status incident." }),
    ).toBeVisible();
    await expect(cta.getByText("Mamelodi East Community Clinic")).toBeVisible();
    await expect(cta.getByText("Akasia Hills Clinic")).toBeVisible();
    await expect(cta.getByText("AUD-2026-0504-017")).toBeVisible();
    await expect(cta.getByRole("link", { name: "Sign in to demo workspace" })).toHaveAttribute(
      "href",
      "/login",
    );
    await cta.getByRole("link", { name: "Book demo" }).click();
    await expect(page.getByRole("dialog", { name: "Book a Clinic Pulse demo" })).toBeVisible();
  });
});
