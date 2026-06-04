import { test, expect } from "@playwright/test";

test.describe("reposition: legacy demo routes redirect to product routes", () => {
  test("/demo redirects to /district", async ({ request }) => {
    const response = await request.get("/demo", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/district\/?$/);
  });

  test("/demo/clinics/clinic-mabopane-station redirects to /district/clinics/clinic-mabopane-station", async ({ request }) => {
    const response = await request.get("/demo/clinics/clinic-mabopane-station", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/district\/clinics\/clinic-mabopane-station\/?$/);
  });

  test("/districts redirects to /district", async ({ request }) => {
    const response = await request.get("/districts", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/district\/?$/);
  });

  test("/districts/clinics/clinic-mabopane-station redirects to /district/clinics/clinic-mabopane-station", async ({ request }) => {
    const response = await request.get("/districts/clinics/clinic-mabopane-station", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/district\/clinics\/clinic-mabopane-station\/?$/);
  });

  test("/book-demo redirects to /request-walkthrough", async ({ request }) => {
    const response = await request.get("/book-demo", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/request-walkthrough\/?$/);
  });

  test("/book-demo/thanks redirects to /request-walkthrough/thanks", async ({ request }) => {
    const response = await request.get("/book-demo/thanks", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(response.headers().location).toMatch(/\/request-walkthrough\/thanks\/?$/);
  });
});
