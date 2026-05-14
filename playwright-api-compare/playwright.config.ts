import { defineConfig, devices } from '@playwright/test';
import { ENV } from './configs/env';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/specs',
  /** UAT + prod, many tabs — default 30s is too low (parallel pages get closed on timeout). */
  timeout: 180_000,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: ENV.WORKERS,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'reports/html' }],
    ['json', { outputFile: 'reports/results.json' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: ENV.HEADLESS,
  },

  /* Chromium only: enough for UAT/prod screenshots; smaller install (`npx playwright install chromium`). */
  projects: [
    { name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
    ...(process.env.PLAYWRIGHT_ALL_BROWSERS === '1'
      ? [
          { name: 'Firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'WebKit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
});
