import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { expect, test, type Page } from "@playwright/test";

type SeededRole = "reporter" | "district_manager" | "org_admin" | "system_admin";
type ThemeName = "light" | "dark";

type ScrollMetrics = {
  clientHeight: number;
  maxScrollTop: number;
};

type HorizontalMetrics = {
  clientWidth: number;
  offenders: Array<{
    className: string;
    left: number;
    right: number;
    scrollWidth: number;
    tagName: string;
    text: string;
  }>;
  scrollWidth: number;
};

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

async function readDashboardScrollMetrics(page: Page, role: SeededRole): Promise<ScrollMetrics> {
  return page.locator(`[data-role-dashboard="${role}"]`).evaluate((dashboard) => {
    function findScrollContainer(element: Element) {
      let current = element.parentElement;

      while (current) {
        const styles = window.getComputedStyle(current);
        const canScrollY = ["auto", "scroll", "overlay"].includes(styles.overflowY);

        if (canScrollY && current.scrollHeight > current.clientHeight + 1) {
          return current;
        }

        current = current.parentElement;
      }

      return document.scrollingElement ?? document.documentElement;
    }

    const scrollContainer = findScrollContainer(dashboard);

    return {
      clientHeight: scrollContainer.clientHeight,
      maxScrollTop: Math.max(0, scrollContainer.scrollHeight - scrollContainer.clientHeight),
    };
  });
}

async function readDashboardHorizontalMetrics(page: Page, role: SeededRole): Promise<HorizontalMetrics> {
  return page.locator(`[data-role-dashboard="${role}"]`).evaluate((dashboard) => {
    function findScrollContainer(element: Element) {
      let current = element.parentElement;

      while (current) {
        const styles = window.getComputedStyle(current);
        const canScrollY = ["auto", "scroll", "overlay"].includes(styles.overflowY);

        if (canScrollY && current.scrollHeight > current.clientHeight + 1) {
          return current;
        }

        current = current.parentElement;
      }

      return document.scrollingElement ?? document.documentElement;
    }

    const scrollContainer = findScrollContainer(dashboard);
    const scrollContainerRect = scrollContainer.getBoundingClientRect();
    const viewportLeft = scrollContainerRect.left;
    const viewportRight = scrollContainerRect.right;

    function isClippedByOwnScrollContainer(element: HTMLElement) {
      let current = element.parentElement;

      while (current && current !== scrollContainer) {
        const styles = window.getComputedStyle(current);
        const clipsX = ["auto", "scroll", "hidden", "clip"].includes(styles.overflowX);
        const rect = current.getBoundingClientRect();

        if (clipsX && rect.left >= viewportLeft - 1 && rect.right <= viewportRight + 1) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    }

    const offenders = Array.from(scrollContainer.querySelectorAll<HTMLElement>("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return { element, rect };
      })
      .filter(({ element, rect }) => {
        if (rect.width <= 0 || rect.height <= 0) {
          return false;
        }

        const extendsPastViewport =
          rect.left < viewportLeft - 1 || rect.right > viewportRight + 1;

        return extendsPastViewport && !isClippedByOwnScrollContainer(element);
      })
      .map((element) => ({
        className: String(element.element.className),
        left: Math.round(element.rect.left),
        right: Math.round(element.rect.right),
        scrollWidth: element.element.scrollWidth,
        tagName: element.element.tagName.toLowerCase(),
        text: element.element.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
      }))
      .sort((left, right) => right.right - left.right)
      .slice(0, 8);

    return {
      clientWidth: scrollContainer.clientWidth,
      offenders,
      scrollWidth: scrollContainer.scrollWidth,
    };
  });
}

async function expectDashboardNotHorizontallyClipped(page: Page, role: SeededRole) {
  const metrics = await readDashboardHorizontalMetrics(page, role);

  expect(
    metrics.offenders,
    `dashboard scroll container should fit its viewport: ${JSON.stringify(metrics)}`
  ).toEqual([]);
}

function buildScrollStops(metrics: ScrollMetrics) {
  if (metrics.maxScrollTop <= 0) {
    return [0];
  }

  const step = Math.max(240, metrics.clientHeight - 96);
  const stops: number[] = [];

  for (let position = 0; position < metrics.maxScrollTop; position += step) {
    stops.push(Math.round(position));
  }

  const finalStop = Math.round(metrics.maxScrollTop);
  if (stops.at(-1) !== finalStop) {
    stops.push(finalStop);
  }

  return stops;
}

async function scrollDashboardTo(page: Page, role: SeededRole, top: number) {
  await page.locator(`[data-role-dashboard="${role}"]`).evaluate(
    (dashboard, scrollTop) => {
      function findScrollContainer(element: Element) {
        let current = element.parentElement;

        while (current) {
          const styles = window.getComputedStyle(current);
          const canScrollY = ["auto", "scroll", "overlay"].includes(styles.overflowY);

          if (canScrollY && current.scrollHeight > current.clientHeight + 1) {
            return current;
          }

          current = current.parentElement;
        }

        return document.scrollingElement ?? document.documentElement;
      }

      findScrollContainer(dashboard).scrollTo({ top: scrollTop, left: 0 });
    },
    top
  );
  await page.waitForTimeout(75);
}

async function captureDashboardReviewScreenshots(
  page: Page,
  projectName: string,
  role: SeededRole,
  theme: ThemeName
) {
  const basePath = `test-results/phase-1-role-ux/${projectName}/${role}-${theme}`;
  const overviewPath = `${basePath}.png`;
  const segmentDirectory = basePath;
  const stops = buildScrollStops(await readDashboardScrollMetrics(page, role));

  mkdirSync(dirname(overviewPath), { recursive: true });
  mkdirSync(segmentDirectory, { recursive: true });

  for (const [index, scrollTop] of stops.entries()) {
    await scrollDashboardTo(page, role, scrollTop);
    const segmentPath = `${segmentDirectory}/segment-${String(index).padStart(2, "0")}.png`;
    await page.screenshot({
      path: segmentPath,
      caret: "initial",
    });

    if (index === 0) {
      await page.screenshot({
        path: overviewPath,
        caret: "initial",
      });
    }
  }

  await scrollDashboardTo(page, role, 0);
}

test.describe("phase 1 role dashboard visual review", () => {
  for (const scenario of roleScenarios) {
    for (const theme of ["light", "dark"] as const) {
      test(`${scenario.role} ${theme} screenshot`, async ({ page }, testInfo) => {
        const consoleErrors = collectConsoleErrors(page);

        await signInAs(page, scenario.email, scenario.home);
        await setTheme(page, theme);
        await expect(page.locator(`[data-role-dashboard="${scenario.role}"]`)).toBeVisible();

        await captureDashboardReviewScreenshots(page, testInfo.project.name, scenario.role, theme);
        await expectDashboardNotHorizontallyClipped(page, scenario.role);

        expect(consoleErrors).toEqual([]);
      });
    }
  }
});
