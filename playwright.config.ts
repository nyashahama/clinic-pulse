import { defineConfig, devices } from "@playwright/test";

const apiPort = Number(process.env.CLINICPULSE_E2E_API_PORT ?? 8080);
const webPort = Number(process.env.CLINICPULSE_E2E_WEB_PORT ?? 3000);
const apiBaseURL = `http://127.0.0.1:${apiPort}`;
const webBaseURL = `http://127.0.0.1:${webPort}`;
const e2eDatabaseURL =
  process.env.E2E_DATABASE_URL ??
  "postgres://clinicpulse:clinicpulse@localhost:5432/clinicpulse_e2e?sslmode=disable";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: webBaseURL,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: `cd services/api && DATABASE_URL="${e2eDatabaseURL}" CLINICPULSE_API_ADDR=":${apiPort}" CLINICPULSE_API_KEY_PEPPER="local-e2e-pepper" go run ./cmd/api`,
      url: `${apiBaseURL}/healthz`,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `NEXT_PUBLIC_CLINICPULSE_API_BASE_URL="${apiBaseURL}" CLINICPULSE_ALLOW_DEMO_FALLBACK="false" npm run dev -- --hostname 127.0.0.1 --port ${webPort}`,
      url: webBaseURL,
      timeout: 90_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
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
  ],
});
