import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  reporter: 'line',
  use: { baseURL: 'http://localhost:4173/weight-tracker/' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/weight-tracker/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'iphone', testIgnore: /offline\.spec/, use: { ...devices['iPhone 15'] } },
    { name: 'offline', testMatch: /offline\.spec/, use: { ...devices['Desktop Chrome'] } },
  ],
});
