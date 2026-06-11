import { defineConfig, devices } from '@playwright/test';

/**
 * Sous-ensemble E2E exécuté en CI (évite 665×5 navigateurs / timeout 45 min).
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    '**/basic-navigation.spec.ts',
    '**/routing.spec.ts',
    '**/error-handling.spec.ts',
    '**/partial-refund.spec.ts',
    '**/physical-subscription-renewal.spec.ts',
    '**/checkout-multi-psp.spec.ts',
    '**/paypal-commerce-flow.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  maxFailures: process.env.CI ? 10 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
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
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
