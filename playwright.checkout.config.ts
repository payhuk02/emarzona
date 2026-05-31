import { defineConfig, devices } from '@playwright/test';

/**
 * E2E checkout (cart + multi-PSP + PayPal) — Chromium uniquement.
 * Utilise Chrome/Edge système si les binaires Playwright ne sont pas installés
 * (définir PLAYWRIGHT_CHANNEL=msedge si besoin).
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [['html'], ['github']] : 'html',
  timeout: 90_000,
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    navigationTimeout: 90_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: (process.env.PLAYWRIGHT_CHANNEL as 'chrome' | 'msedge' | undefined) ?? 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
