import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { expect, test, type Page } from "@playwright/test";

type SeededRole = "reporter" | "district_manager" | "org_admin" | "system_admin";
type ThemeName = "light" | "dark";

const password = "ClinicPulseDemo123!";
const roleScenarios: Array<{
  role: SeededRole;
  email: string;
  home: string;
}> = [
  { role: "reporter", email: "reporter@clinicpulse.local", home: "/field" },
  { role: "district_manager", email: "district-manager@clinicpulse.local", home: "/demo" },
  { role: "org_admin", email: "org-admin@clinicpulse.local", home: "/admin" },
  { role: "system_admin", email: "system-admin@clinicpulse.local", home: "/admin" },
];

function collectConsoleErrors(page: Page) {
  const messages: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      messages.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    messages.push(error.message);
  });

  return messages;
}

async function signInAs(page: Page, email: string, home: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(new RegExp(`${home.replace("/", "\\/")}$`));
}

async function setTheme(page: Page, theme: ThemeName) {
  const buttonName = theme === "dark" ? "Use dark theme" : "Use light theme";
  await page.getByRole("button", { name: buttonName }).click();

  if (theme === "dark") {
    await expect(page.locator("html")).toHaveClass(/(?:^|\s)dark(?:\s|$)/);
  } else {
    await expect(page.locator("html")).not.toHaveClass(/(?:^|\s)dark(?:\s|$)/);
  }
}

test.describe("phase 1 role dashboard visual review", () => {
  for (const scenario of roleScenarios) {
    for (const theme of ["light", "dark"] as const) {
      test(`${scenario.role} ${theme} screenshot`, async ({ page }, testInfo) => {
        const consoleErrors = collectConsoleErrors(page);

        await signInAs(page, scenario.email, scenario.home);
        await setTheme(page, theme);
        await expect(page.locator(`[data-role-dashboard="${scenario.role}"]`)).toBeVisible();

        const screenshotPath = `test-results/phase-1-role-ux/${testInfo.project.name}/${scenario.role}-${theme}.png`;
        mkdirSync(dirname(screenshotPath), { recursive: true });
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
          caret: "initial",
        });

        expect(consoleErrors).toEqual([]);
      });
    }
  }
});
