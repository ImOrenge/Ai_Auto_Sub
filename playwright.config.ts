import { defineConfig, devices } from "@playwright/test";

const DEFAULT_PORT = Number(process.env.PLAYWRIGHT_WEB_SERVER_PORT ?? 3100);
const HOST = process.env.PLAYWRIGHT_WEB_SERVER_HOST ?? "127.0.0.1";
const shouldSkipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === "1";
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  `npm run dev -- --hostname ${HOST} --port ${DEFAULT_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${DEFAULT_PORT}`,
    trace: "retain-on-failure",
    headless: true,
  },
  webServer: shouldSkipWebServer
    ? undefined
    : {
        command: webServerCommand,
        url: `http://${HOST}:${DEFAULT_PORT}`,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
