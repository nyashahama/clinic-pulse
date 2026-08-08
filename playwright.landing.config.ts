import { defineConfig, devices } from "@playwright/test";

const webPort = Number(process.env.CLINICPULSE_LANDING_WEB_PORT ?? 3110);
const webBaseURL = `http://127.0.0.1:${webPort}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["landing-page.spec.ts", "landing-motion.spec.ts", "landing-no-js.spec.ts"],
  fullyParallel: false,
  // Keep the cold webpack server responsive while desktop, mobile, and no-JS
  // projects exercise this DOM-heavy page in parallel.
  workers: 2,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: webBaseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      `CLINICPULSE_API_BASE_URL="http://127.0.0.1:65535" ` +
      `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="/api/clinicpulse" ` +
      `CLINICPULSE_ALLOW_DEMO_FALLBACK="true" ` +
      `npm run dev -- --webpack --hostname 127.0.0.1 --port ${webPort}`,
    url: webBaseURL,
    timeout: 90_000,
    reuseExistingServer,
  },
  projects: [
    {
      name: "desktop-chrome",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
        channel: "chrome",
      },
    },
    {
      name: "no-js-chrome",
      grep: /@no-js/,
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
        javaScriptEnabled: false,
      },
    },
  ],
});
