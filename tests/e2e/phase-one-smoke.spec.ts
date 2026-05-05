import { expect, test, type Page, type TestInfo } from "@playwright/test";

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
  await expect(page).toHaveURL(/\/demo$/);
}

function createSmokeLead(testInfo: TestInfo) {
  const leadId = `${testInfo.project.name}-${testInfo.workerIndex}-${Date.now()}`.replace(
    /[^a-z0-9-]/gi,
    "-",
  );

  return {
    name: `Smoke Lead ${leadId}`,
    workEmail: `smoke.lead.${leadId}@example.test`,
    organization: `Smoke District ${leadId}`,
    role: "Operations lead",
  };
}

async function submitBooking(page: Page, lead: ReturnType<typeof createSmokeLead>) {
  await page.goto("/?booking=1");
  await page.getByLabel("Name").fill(lead.name);
  await page.getByLabel("Work email").fill(lead.workEmail);
  await page.getByLabel("Organization").fill(lead.organization);
  await page.getByLabel("Role").fill(lead.role);

  const createLeadResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/clinicpulse/v1/public/demo-leads") &&
      response.status() === 201,
  );
  await page.getByRole("button", { name: "Submit request" }).click();
  const createdLead = (await (await createLeadResponse).json()) as { workEmail?: string };
  expect(createdLead.workEmail).toBe(lead.workEmail);
  await expect(page.getByRole("heading", { name: `Thanks, ${lead.name}` })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: "Clinic Pulse", exact: true })).toBeVisible();
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
  }, testInfo) => {
    const clientApiWarnings: string[] = [];
    page.on("console", (message) => {
      const text = message.text();
      if (text.includes("Unable to fetch backend reroute alternatives")) {
        clientApiWarnings.push(text);
      }
    });

    const smokeLead = createSmokeLead(testInfo);
    await submitBooking(page, smokeLead);
    await page.evaluate(() => window.localStorage.removeItem("clinicpulse.demo.leads"));
    await signIn(page);

    await expect(page.getByRole("heading", { name: "Clinic table" })).toBeVisible();
    await expect(page.getByText("Report stream")).toBeVisible();

    const alternativesResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/clinicpulse/v1/public/alternatives") &&
        response.status() === 200,
    );
    await page.goto("/demo/clinics/clinic-mamelodi-east");
    await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mamelodi East Community Clinic" }),
    ).toBeVisible();
    await alternativesResponse;

    await page.goto("/field");
    await expect(page.getByRole("heading", { name: "Mobile reporting flow" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Submit clinic status" })).toBeVisible();

    const adminLeadsResponse = await page.request.get("/api/clinicpulse/v1/admin/demo-leads");
    expect(adminLeadsResponse.status()).toBe(200);
    const adminLeads = (await adminLeadsResponse.json()) as Array<{ workEmail?: string }>;
    expect(adminLeads.some((lead) => lead.workEmail === smokeLead.workEmail)).toBe(true);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Admin control deck" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Lead management" })).toBeVisible();
    const leadTable = page.getByRole("table");
    await expect(leadTable.getByText(smokeLead.name).first()).toBeVisible();
    await expect(leadTable.getByText(smokeLead.workEmail).first()).toBeVisible();
    expect(clientApiWarnings).toEqual([]);
  });
});
