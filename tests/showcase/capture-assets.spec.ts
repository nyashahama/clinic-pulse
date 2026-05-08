import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

const screenshotDir = path.join(process.cwd(), "public/showcase/screenshots");
const videoDir = path.join(process.cwd(), "public/showcase/videos");
const videoPath = path.join(videoDir, "clinicpulse-demo-walkthrough.webm");

async function ensureCleanAssetDirs() {
  await mkdir(screenshotDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });
  await rm(videoPath, { force: true });
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(demoAccount.email);
  await page.getByLabel("Password").fill(demoAccount.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/demo$/);
}

async function capture(page: Page, filename: string) {
  await page.screenshot({
    path: path.join(screenshotDir, filename),
    fullPage: true,
    animations: "disabled",
  });
}

async function gotoStable(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState("networkidle");
}

async function captureScreenshots(page: Page) {
  await ensureCleanAssetDirs();

  await page.setViewportSize({ width: 1440, height: 1100 });
  await gotoStable(page, "/");
  await expect(
    page.getByRole("heading", {
      name: "Know which clinics can help before patients travel.",
    }),
  ).toBeVisible();
  await capture(page, "landing-desktop.png");

  await gotoStable(page, "/book-demo");
  await expect(page.getByRole("dialog", { name: "Book a Clinic Pulse demo" })).toBeVisible();
  await capture(page, "booking-flow-desktop.png");

  await gotoStable(page, "/book-demo/thanks?name=Smoke&organization=E2E%20District");
  await expect(page.getByRole("heading", { name: "Thanks, Smoke" })).toBeVisible();
  await capture(page, "booking-thanks-desktop.png");

  await signIn(page);
  await expect(page.getByRole("heading", { name: "Clinic table" })).toBeVisible();
  await capture(page, "district-console-desktop.png");

  await gotoStable(page, "/demo/clinics/clinic-mamelodi-east");
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await capture(page, "clinic-evidence-desktop.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoStable(page, "/finder");
  await expect(page.getByRole("heading", { name: "Clinic finder" })).toBeVisible();
  await capture(page, "finder-mobile.png");

  await gotoStable(page, "/field");
  await expect(page.getByRole("heading", { name: "Mobile reporting flow" })).toBeVisible();
  await capture(page, "field-report-mobile.png");

  await page.setViewportSize({ width: 1440, height: 1100 });
  await gotoStable(page, "/admin");
  await expect(page.getByRole("heading", { name: "Admin control deck" })).toBeVisible();
  await capture(page, "admin-readiness-desktop.png");
}

async function recordWalkthrough(browser: Browser, baseURL: string | undefined) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();

  await gotoStable(page, "/");
  await page.waitForTimeout(900);

  await signIn(page);
  await page.waitForTimeout(900);

  await gotoStable(page, "/demo/clinics/clinic-mamelodi-east");
  await page.waitForTimeout(900);

  await gotoStable(page, "/field");
  await page.waitForTimeout(900);

  await gotoStable(page, "/finder");
  await page.waitForTimeout(900);

  await gotoStable(page, "/admin");
  await page.waitForTimeout(1200);

  const video = page.video();
  await context.close();

  const rawVideoPath = await video?.path();
  if (!rawVideoPath) {
    throw new Error("Playwright did not produce a walkthrough video.");
  }

  await rename(rawVideoPath, videoPath);
}

test("captures showcase screenshots and walkthrough video", async ({ baseURL, browser, page }) => {
  await captureScreenshots(page);
  await recordWalkthrough(browser, baseURL);
});
