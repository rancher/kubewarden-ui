// @ts-check
const { devices } = require('@playwright/test');

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 * @type {import('@playwright/test').PlaywrightTestConfig}
 */
const config = {
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 7 * 60 * 1000,
  expect:  {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10 * 1000,
  },
  /* Run tests in files in parallel */
  // fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries:    process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers:    process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'html' : 'list',
  reportSlowTests: null,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use:        {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL:       process.env.RANCHER_URL,

    // headless: false,
    launchOptions: { slowMo: 100 },

    ignoreHTTPSErrors: true,
    // Tell all tests to load signed-in state from 'storageState.json'.
    storageState:      'storageState.json',

    screenshot: 'only-on-failure',
    trace:      'on', // retain-on-failure
  },

  globalSetup: require.resolve('./global-setup'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use:  {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 900 },
      },
    },
  ],

  // Run local server serving extensions
  // https://rancher.github.io/dashboard/extensions/extensions-getting-started#loading-into-another-rancher-instance
  webServer: process.env.ORIGIN == 'source' ? {
    command: 'yarn serve-pkgs',
    port: 4500,
    reuseExistingServer: true,
    cwd: '../',
  } : undefined
};

module.exports = config;
