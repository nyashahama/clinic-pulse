import { defineConfig, devices } from "@playwright/test";

const webPort = Number(process.env.CLINICPULSE_PUBLIC_WEB_PORT ?? 3120);
const webBaseURL = `http://127.0.0.1:${webPort}`;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_EXISTING_SERVER === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: [
    "public-pages.spec.ts",
    "landing-page.spec.ts",
    "landing-motion.spec.ts",
  ],
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: webBaseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      `CLINICPULSE_API_BASE_URL="http://127.0.0.1:65535" ` +
      `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="/api/clinicpulse" ` +
      `CLINICPULSE_ALLOW_DEMO_FALLBACK="false" ` +
      `npm run dev -- --hostname 127.0.0.1 --port ${webPort}`,
    url: webBaseURL,
    timeout: 90_000,
    reuseExistingServer,
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
