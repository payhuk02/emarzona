import { defineConfig, devices } from '@playwright/test';

/**
 * E2E payants cours + artiste — requires SUPABASE_SERVICE_ROLE_KEY in CI.
 * Le dev server est lancé via scripts/start-e2e-dev.mjs (.env.e2e.local).
 */
export default defineConfig({
  globalSetup: './tests/e2e/global-setup-e2e-guard.ts',
  testDir: './tests/e2e',
  testMatch: ['**/course-paid-enrollment.spec.ts', '**/artist-paid-purchase.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node scripts/start-e2e-dev.mjs',
    url: 'http://localhost:8080',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
