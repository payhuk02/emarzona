/**
 * Smoke matrix E2E — routes critiques plateforme (audit routes P0–P5).
 * npx playwright test tests/e2e/platform-routes-smoke.spec.ts
 */
import { test, expect, type Page } from '@playwright/test';
import {
  LEGACY_REDIRECT_SMOKE,
  PROTECTED_SMOKE_PATHS,
  PUBLIC_CRITICAL_SMOKE_PATHS,
  VENDOR_CRITICAL_SMOKE_PATHS,
} from '../../src/lib/routes/platform-routes-smoke-matrix';
import {
  E2E_TEST_CONFIG,
  appLocator,
  gotoApp,
  loginAs,
  waitForReactApp,
} from './shared/e2e-test-config';

const NOT_FOUND_PATTERN = /404|page introuvable|not found/i;

async function assertHealthyAppShell(page: Page): Promise<void> {
  await expect(page.locator('#root')).toBeVisible();
  await expect(page).toHaveTitle(/.+/, { timeout: 15_000 });
  const criticalError = await page.locator('text=Erreur critique').count();
  expect(criticalError).toBe(0);
}

async function assertNotNotFound(page: Page): Promise<void> {
  const bodyText = (
    await appLocator(page)
      .innerText()
      .catch(() => '')
  ).slice(0, 2000);
  expect(bodyText).not.toMatch(NOT_FOUND_PATTERN);
}

test.describe('Platform routes smoke — public', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  for (const path of PUBLIC_CRITICAL_SMOKE_PATHS) {
    test(`GET ${path} — shell OK`, async ({ page }) => {
      await gotoApp(page, path);
      await assertHealthyAppShell(page);
      await assertNotNotFound(page);
    });
  }
});

test.describe('Platform routes smoke — legacy redirects', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);
  test.describe.configure({ mode: 'serial' });

  for (const spec of LEGACY_REDIRECT_SMOKE.filter(r => r.auth !== 'vendor')) {
    test(`redirect ${spec.from}`, async ({ page }) => {
      await page.goto(spec.from, {
        waitUntil: 'domcontentloaded',
        timeout: E2E_TEST_CONFIG.navigationTimeout,
      });
      await page.waitForURL(spec.expectUrl, { timeout: 20_000 });
      await waitForReactApp(page);
      await assertHealthyAppShell(page);
    });
  }
});

test.describe('Platform routes smoke — protected (guest)', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);

  for (const path of PROTECTED_SMOKE_PATHS) {
    test(`GET ${path} — auth gate (pas 404)`, async ({ page }) => {
      await gotoApp(page, path);
      await assertHealthyAppShell(page);
      await assertNotNotFound(page);
      await page.waitForTimeout(1500);
      expect(page.url()).toMatch(/\/(dashboard|admin|account|auth|login)/);
    });
  }
});

const vendorSmokeEnabled = process.env.E2E_ROUTES_SMOKE_VENDOR === '1';

test.describe('Platform routes smoke — vendor dashboard', () => {
  test.setTimeout(E2E_TEST_CONFIG.navigationTimeout);
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(
      !vendorSmokeEnabled,
      'Définir E2E_ROUTES_SMOKE_VENDOR=1 avec E2E_VENDOR_EMAIL/PASSWORD valides'
    );
    test.skip(
      !E2E_TEST_CONFIG.vendorEmail,
      'E2E_VENDOR_EMAIL requis pour le smoke dashboard vendeur'
    );
    try {
      await loginAs(page, E2E_TEST_CONFIG.vendorEmail, E2E_TEST_CONFIG.vendorPassword);
    } catch (error) {
      testInfo.skip(`Vendor login indisponible: ${String(error)}`);
    }
  });

  for (const path of VENDOR_CRITICAL_SMOKE_PATHS) {
    test(`GET ${path} — vendeur authentifié`, async ({ page }) => {
      await gotoApp(page, path);
      await assertHealthyAppShell(page);
      await assertNotNotFound(page);
      const denied = await appLocator(page).getByText('Accès refusé').count();
      expect(denied).toBe(0);
    });
  }

  for (const spec of LEGACY_REDIRECT_SMOKE.filter(r => r.auth === 'vendor')) {
    test(`redirect vendeur ${spec.from}`, async ({ page }) => {
      await gotoApp(page, spec.from);
      await page.waitForURL(spec.expectUrl, { timeout: 20_000 });
      await assertHealthyAppShell(page);
    });
  }
});
