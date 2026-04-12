import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'https://demo.playwright.dev/todomvc',
    specPattern: 'web/cypress/e2e/**/*.cy.ts',
    supportFile: 'web/cypress/support/e2e.ts',
    screenshotsFolder: 'cypress-report/screenshots',
    videosFolder: 'cypress-report/videos',
    video: false,
  },
});
