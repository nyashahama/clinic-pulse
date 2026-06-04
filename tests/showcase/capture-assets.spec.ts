import { expect, test, type Browser, type Page } from "@playwright/test";
import { mkdir, rename, rm } from "node:fs/promises";
import path from "node:path";

import { PRODUCT_LANGUAGE_BAN_LIST } from "../../lib/demo/operations-scenario";

const demoAccount = {
  email: "org-admin@clinicpulse.local",
  password: "ClinicPulseDemo123!",
};

const screenshotDir = path.join(process.cwd(), "public/showcase/screenshots");
const videoDir = path.join(process.cwd(), "public/showcase/videos");
const videoPath = path.join(videoDir, "clinicpulse-operations-walkthrough.webm");

test.setTimeout(180_000);

async function ensureCleanAssetDirs() {
  await mkdir(screenshotDir, { recursive: true });
  await mkdir(videoDir, { recursive: true });
  await rm(videoPath, { force: true });
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(demoAccount.email);
  await page.getByLabel("Password").fill(demoAccount.password);
  await Promise.all([
    page.waitForURL(/\/admin$/),
    page.getByRole("button", { name: "Log in" }).click(),
  ]);
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

async function expectNoStagedProductLanguage(page: Page) {
  const visibleText = await page.locator("body").innerText();
  const escapedBanList = PRODUCT_LANGUAGE_BAN_LIST.map((phrase) =>
    phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  );

  expect(visibleText).not.toMatch(new RegExp(escapedBanList.join("|"), "i"));
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
  await expectNoStagedProductLanguage(page);
  await capture(page, "landing-desktop.png");

  await gotoStable(page, "/request-walkthrough");
  await expect(
    page.getByRole("dialog", { name: "Book a Clinic Pulse walkthrough" }),
  ).toBeVisible();
  await expectNoStagedProductLanguage(page);
  await capture(page, "booking-flow-desktop.png");

  await gotoStable(page, "/request-walkthrough/thanks?name=Smoke&organization=E2E%20District");
  await expect(page.getByRole("heading", { name: "Thanks, Smoke" })).toBeVisible();
  await expectNoStagedProductLanguage(page);
  await capture(page, "booking-thanks-desktop.png");

  await signIn(page);
  await gotoStable(page, "/districts");
  await expect(page.getByRole("heading", { name: "Clinic table" })).toBeVisible();
  await expectNoStagedProductLanguage(page);
  await capture(page, "district-console-desktop.png");

  await gotoStable(page, "/districts/clinics/clinic-mabopane-station");
  await expect(page.getByRole("heading", { name: "Clinic detail" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mabopane Station Clinic" })).toBeVisible();
  await expectNoStagedProductLanguage(page);
  await capture(page, "clinic-evidence-desktop.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoStable(page, "/finder");
  await expect(page.getByRole("heading", { name: "Clinic finder" })).toBeVisible();
  await expectNoStagedProductLanguage(page);
  await capture(page, "finder-mobile.png");

  await gotoStable(page, "/field");
  await expect(page.getByRole("heading", { name: "Field workbench" })).toBeVisible();
  await expectNoStagedProductLanguage(page);
  await capture(page, "field-report-mobile.png");

  await page.setViewportSize({ width: 1440, height: 1100 });
  await gotoStable(page, "/admin");
  await expect(
    page.getByRole("heading", { name: "Organisation Governance Workbench" }),
  ).toBeVisible();
  await expectNoStagedProductLanguage(page);
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
  await expectNoStagedProductLanguage(page);
  await page.waitForTimeout(900);

  await signIn(page);
  await gotoStable(page, "/districts");
  await expectNoStagedProductLanguage(page);
  await page.waitForTimeout(900);

  await gotoStable(page, "/districts/clinics/clinic-mabopane-station");
  await expectNoStagedProductLanguage(page);
  await page.waitForTimeout(900);

  await gotoStable(page, "/field");
  await expectNoStagedProductLanguage(page);
  await page.waitForTimeout(900);

  await gotoStable(page, "/finder");
  await expectNoStagedProductLanguage(page);
  await page.waitForTimeout(900);

  await gotoStable(page, "/admin");
  await expectNoStagedProductLanguage(page);
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
