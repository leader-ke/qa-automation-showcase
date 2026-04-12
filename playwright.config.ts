import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['api/tests/**/*.spec.ts', 'web/tests/**/*.spec.ts'],
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'api',
      testMatch: 'api/tests/**/*.spec.ts',
    },
    {
      name: 'web',
      testMatch: 'web/tests/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
