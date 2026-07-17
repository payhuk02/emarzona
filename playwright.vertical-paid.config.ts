import { defineConfig, devices } from '@playwright/test';

const supabaseUrl =
  process.env.VITE_SUPABASE_TEST_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  '';
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

/**
 * E2E payants cours + artiste — requires SUPABASE_SERVICE_ROLE_KEY in CI.
 */
export default defineConfig({
  globalSetup: './tests/e2e/global-setup-e2e-guard.ts',
  testDir: './tests/e2e',
  testMatch: [
    '**/course-paid-enrollment.spec.ts',
    '**/artist-paid-purchase.spec.ts',
    '**/mixed-cart-book-pay-confirm.spec.ts',
  ],
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_TEST_URL: supabaseUrl,
      VITE_SUPABASE_URL: supabaseUrl,
      VITE_SUPABASE_ANON_KEY: supabaseAnonKey,
      VITE_SUPABASE_PUBLISHABLE_KEY: supabaseAnonKey,
      VITE_E2E_PAYMENT_STUB: process.env.VITE_E2E_PAYMENT_STUB ?? 'true',
    },
  },
});
