import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : 'list',

  // ===== Rancher specific config =====
  /* Maximum time one test can run for. */
  timeout: 7 * 60_0000,
  /* Whether to report slow test files. */
  reportSlowTests: null,
  /* Path to the global setup file. */
  globalSetup: './global-setup',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.RANCHER_URL,
    /* Maximum time each action such as `click()` can take. */
    actionTimeout: 60_000,
    /* Timeout for navigation actions like page.goto() */
    navigationTimeout: 60_000,
    /* Slows down Playwright operations by the specified amount of milliseconds. */
    launchOptions: { slowMo: 100 },

    ignoreHTTPSErrors: true,
    storageState: 'storageState.json',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.ORIGIN == 'source' ? {
    command: 'yarn serve-pkgs',
    url: 'http://127.0.0.1:4500',
    reuseExistingServer: !process.env.CI,
    cwd: '../',
  } : undefined
});
