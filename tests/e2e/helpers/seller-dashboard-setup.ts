import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE } from '../../../src/lib/commerce/store-capability-map';
import type { StoreCommerceType } from '../../../src/constants/store-commerce-types';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { loginAsSeededUser, waitForReactApp } from '../shared/e2e-test-config';

/** Stable seller chrome for dashboard E2E (persona, UX mode, onboarding dismissed). */
export async function prepareSellerDashboardChrome(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('sidebarPersona', 'seller');
    localStorage.setItem('emarzona:ux_level', 'expert');
    localStorage.setItem('sidebarPersonaOnboarded', 'true');
  });
}

export async function loginSeededSeller(
  page: Page,
  admin: SupabaseClient,
  email: string
): Promise<void> {
  await prepareSellerDashboardChrome(page);
  await loginAsSeededUser(page, admin, email, '/dashboard');
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
}

export async function waitForStoresLoaded(page: Page): Promise<void> {
  await page
    .waitForResponse(
      response =>
        response.url().includes('/rest/v1/stores') &&
        response.request().method() === 'GET' &&
        response.status() === 200,
      { timeout: 45_000 }
    )
    .catch(() => undefined);

  await expect(page.locator('.app-sidebar')).toBeVisible({ timeout: 30_000 });
}

export function sidebarLinkLocator(page: Page, path: string) {
  return page.locator(`.app-sidebar a[href="${path}"]`);
}

export async function expectSidebarHasLink(page: Page, path: string): Promise<void> {
  await expect(sidebarLinkLocator(page, path)).toHaveCount(1, {
    timeout: process.env.CI ? 45_000 : 20_000,
  });
}

export async function expectSidebarMissingLink(page: Page, path: string): Promise<void> {
  await expect(sidebarLinkLocator(page, path)).toHaveCount(0, {
    timeout: 5_000,
  });
}

export async function waitForCommerceSidebarGating(
  page: Page,
  commerceType: StoreCommerceType
): Promise<void> {
  await waitForStoresLoaded(page);
  const createPath = PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE[commerceType];
  await expectSidebarHasLink(page, createPath);
}
