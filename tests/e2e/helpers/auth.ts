import { expect, type Page } from "@playwright/test";

import { expectStablePath, pathPattern } from "./navigation";

const password = "ClinicPulseDemo123!";

export async function signInAs(page: Page, email: string, homePath: string) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL(pathPattern(homePath)),
    page.getByRole("button", { name: "Log in" }).click(),
  ]);
  await expectStablePath(page, homePath);
  await expect(page.locator("body")).toBeVisible();
}
