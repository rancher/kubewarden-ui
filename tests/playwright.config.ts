import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir             : './e2e',
  forbidOnly          : !!process.env.CI, /* Fail the build on CI if you accidentally left test.only in the source code. */
  retries             : process.env.CI ? 1 : 0, /* Retry on CI only */
  workers             : 1, /* Opt out of parallel tests */
  snapshotPathTemplate: '{testDir}/screenshots/{projectName}/{arg}{ext}', /* Use shared directory for screenshots instead of per-test dir */
  updateSnapshots     : process.env.CI ? 'none' : 'missing', /* Don't generate snapshots by accident */

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    [process.env.CI ? 'html' : 'list'],
    process.env.QASE_REPORT
      ? ['playwright-qase-reporter',
          {
            apiToken         : process.env.QASE_APITOKEN,
            projectCode      : 'KUBEWARDEN',
            runComplete      : true,
            basePath         : 'https://api.qase.io/v1',
            logging          : true,
            uploadAttachments: true,
          }]
      : ['null'],
  ],

  // ===== Rancher specific config =====
  timeout        : 7 * 60_000, /* Maximum time one test can run for. */
  expect         : { timeout: 10_000 }, /* Expect timeout - increase from 5s to 10s because rancher is slow when loading pages */
  reportSlowTests: null, /* Whether to report slow test files. */
  globalSetup    : require.resolve('./global-setup'), /* Path to the global setup file. */

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL          : process.env.RANCHER_URL, /* Base URL to use in actions like `await page.goto('/')`. */
    actionTimeout    : 60_000, /* Maximum time each action such as `click()` can take. */
    navigationTimeout: 60_000, /* Timeout for navigation actions like page.goto() */
    // launchOptions    : { slowMo: 200 }, /* Slows down Playwright operations by the specified amount of milliseconds. */

    ignoreHTTPSErrors: true,
    storageState     : 'storageState.json',
    screenshot       : 'only-on-failure',
    trace            : 'retain-on-failure',
    video            : process.env.CI ? 'off' : 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use : {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
      },
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
  webServer: process.env.ORIGIN === 'source'
    ? {
        command            : 'yarn serve-pkgs',
        url                : 'http://127.0.0.1:4500',
        reuseExistingServer: !process.env.CI,
        cwd                : '../',
      }
    : undefined
})
