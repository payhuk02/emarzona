import { defineConfig, devices } from '@playwright/test';

const supabaseUrl =
  process.env.VITE_SUPABASE_TEST_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  '';
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

/**
 * E2E wizards produit (artiste, digital, cours, physique, service) — requires SUPABASE_SERVICE_ROLE_KEY in CI.
 */
export default defineConfig({
  globalSetup: './tests/e2e/global-setup-e2e-guard.ts',
  testDir: './tests/e2e',
  testMatch: [
    '**/artist-product-create-rpc.spec.ts',
    '**/artist-product-publish.spec.ts',
    '**/digital-product-publish.spec.ts',
    '**/course-product-publish.spec.ts',
    '**/physical-product-publish.spec.ts',
    '**/service-product-publish.spec.ts',
    '**/marketplace-product-visibility.spec.ts',
    '**/marketplace-wizard-checkout.spec.ts',
    '**/product-edit-wizard.spec.ts',
    '**/product-update-rpc.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  // Fail fast so a hung marketplace search cannot burn the full 60m job budget.
  maxFailures: process.env.CI ? 5 : 0,
  reporter: process.env.CI ? [['list'], ['html'], ['github']] : 'html',
  timeout: 180_000,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    // Prevent cookie banner fixed footer from intercepting wizard "Suivant" clicks.
    storageState: 'tests/e2e/.auth/cookie-consent.json',
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
