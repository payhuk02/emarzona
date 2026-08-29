import { defineConfig } from '@playwright/test';

/**
 * E2E jalons service P0→P3 — API Supabase uniquement (pas de webServer).
 * Requiert SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_TEST_URL (.env.e2e.local).
 */
export default defineConfig({
  globalSetup: './tests/e2e/global-setup-e2e-guard.ts',
  testDir: './tests/e2e',
  testMatch: ['**/service-project-milestone-flow.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  timeout: 180_000,
  use: {
    baseURL: 'http://localhost:8080',
  },
});
