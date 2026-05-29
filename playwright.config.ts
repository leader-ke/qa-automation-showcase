import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['api/tests/**/*.spec.ts', 'web/playwright/tests/**/*.spec.ts'],
  fullyParallel: true,

  // Retries in CI: a test that passes on retry is marked `flaky`, not `passed`.
  // Retries are a diagnostic signal — not a suppression mechanism.
  // If a test consistently needs retries, investigate root cause.
  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 2 : undefined,

  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    // Capture a trace on first retry — gives a full timeline of the failure
    // without the overhead of tracing every passing run
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ------------------------------------------------------------------
    // API tests — no browser, uses Playwright's request context
    // ------------------------------------------------------------------
    {
      name: 'api',
      testMatch: 'api/tests/**/*.spec.ts',
    },

    // ------------------------------------------------------------------
    // Web UI tests (Playwright)
    // ------------------------------------------------------------------
    {
      name: 'web-playwright',
      testMatch: 'web/playwright/tests/**/*.spec.ts',
      // Exclude visual tests — those run under the dedicated visual project
      testIgnore: 'web/playwright/tests/todo-visual.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ------------------------------------------------------------------
    // Visual regression
    // Locked viewport for cross-environment consistency.
    // Baselines live in web/playwright/visual-baselines/ — commit them.
    // To update: npm run test:visual:update
    // ------------------------------------------------------------------
    {
      name: 'visual',
      testMatch: 'web/playwright/tests/todo-visual.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      snapshotDir: 'web/playwright/visual-baselines',
    },
  ],
});
