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
    '**/mixed-cart-service-product.spec.ts',
    '**/referral-c1.spec.ts',
    '**/payment-v2-rollout.spec.ts',
    '**/course-enrollment-flow.spec.ts',
    '**/artist-product-workflow.spec.ts',
    '**/artist-sale-certificate.spec.ts',
    '**/course-payment-learn.spec.ts',
    '**/checkout-unified.spec.ts',
    '**/enterprise-sso-login.spec.ts',
    '**/vendor-api-smoke.spec.ts',
    '**/enterprise-audit-export.spec.ts',
    '**/enterprise-compliance-moon6.spec.ts',
  ],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  maxFailures: process.env.CI ? 10 : undefined,
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
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
