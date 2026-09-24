import { defineConfig, devices } from "@playwright/test";

const buildTime = process.env.BUILD_TIME ?? "2026-09-24T12:00:00Z";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [
        ["list"],
        [
          "json",
          {
            // The a11y and Build B runs write elsewhere so they don't clobber
            // the e2e results that collect-report.mjs reads.
            outputFile:
              process.env.PLAYWRIGHT_JSON_OUTPUT ?? "reports/playwright.json",
          },
        ],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testDir: "./tests/e2e",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "a11y",
      testDir: "./tests/a11y",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npx sirv dist --port 4321 --brotli --gzip --single",
    url: "http://localhost:4321",
    reuseExistingServer:
      Boolean(process.env.REUSE_EXISTING_SERVER) || !process.env.CI,
    timeout: 120_000,
    env: {
      BUILD_TIME: buildTime,
    },
  },
});
