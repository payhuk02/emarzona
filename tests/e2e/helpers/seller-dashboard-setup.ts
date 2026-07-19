import { expect, type Page } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE } from '../../../src/lib/commerce/store-capability-map';
import type { StoreCommerceType } from '../../../src/constants/store-commerce-types';
import {
  dismissCookieBannerIfVisible,
  dismissPersonaOnboardingIfVisible,
} from './store-theme-helpers';
import { loginAsSeededUser, waitForReactApp } from '../shared/e2e-test-config';

export type SellerDashboardChromeOptions = {
  selectedStoreId?: string;
  password?: string;
};

/** Stable seller chrome for dashboard E2E (persona, UX mode, onboarding dismissed). */
export async function prepareSellerDashboardChrome(
  page: Page,
  options: SellerDashboardChromeOptions = {}
): Promise<void> {
  const { selectedStoreId } = options;
  await page.addInitScript(
    ({ storeId }) => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sidebarCollapsedSections')) {
          localStorage.removeItem(key);
        }
      }
      localStorage.removeItem('selectedStoreId');
      localStorage.removeItem('sidebarPersona');
      localStorage.removeItem('sidebarPersonaOnboarded');
      localStorage.setItem('sidebarPersona', 'seller');
      localStorage.setItem('emarzona:ux_level', 'expert');
      localStorage.setItem('sidebarPersonaOnboarded', 'true');
      if (storeId) {
        localStorage.setItem('selectedStoreId', storeId);
      }
      document.cookie = 'sidebar:state=true; path=/; max-age=604800; SameSite=Lax';
      document.documentElement.dataset.e2eBypassTerms = '1';
    },
    { storeId: selectedStoreId ?? null }
  );
}

export async function loginSeededSeller(
  page: Page,
  admin: SupabaseClient,
  email: string,
  options: SellerDashboardChromeOptions = {}
): Promise<void> {
  await prepareSellerDashboardChrome(page, options);
  await loginAsSeededUser(page, admin, email, '/dashboard', options.password);
  await waitForReactApp(page);
  await dismissCookieBannerIfVisible(page);
  await dismissPersonaOnboardingIfVisible(page);
}

type WaitForStoresLoadedOptions = {
  storeId?: string;
  commerceType?: StoreCommerceType;
  storeName?: string;
};

async function expandSidebarCreerSection(page: Page): Promise<void> {
  const header = page.locator('.app-sidebar-section-header').filter({ hasText: /^Créer$/i });
  if (await header.isVisible().catch(() => false)) {
    const expanded = await header.getAttribute('aria-expanded');
    if (expanded === 'false') {
      await header.click();
    }
  }
}

async function selectStoreInSidebar(page: Page, storeName?: string): Promise<void> {
  if (!storeName) return;
  const storeButton = page.getByRole('button', { name: storeName });
  if (await storeButton.isVisible().catch(() => false)) {
    await storeButton.click();
    await page.waitForLoadState('domcontentloaded');
  }
}

/**
 * Race-safe wait for seller chrome + selected store.
 * Do NOT rely on waitForResponse: StoreContext uses PostgREST `.or(user_id.eq.…)`
 * when the owner is also in store_members (always true after trg_add_store_owner_as_member),
 * and the stores GET often completes before a post-login wait is armed.
 */
export async function waitForStoresLoaded(
  page: Page,
  options: WaitForStoresLoadedOptions = {}
): Promise<void> {
  const { storeId, storeName } = options;

  await expect(page.locator('.app-sidebar')).toBeVisible({ timeout: 30_000 });

  if (storeId) {
    await expect
      .poll(
        async () => page.evaluate(id => localStorage.getItem('selectedStoreId') === id, storeId),
        {
          timeout: 45_000,
        }
      )
      .toBe(true);
  }

  await selectStoreInSidebar(page, storeName);
  await expandSidebarCreerSection(page);
}

export function sidebarLinkLocator(page: Page, path: string) {
  return page.locator(`.app-sidebar a[href="${path}"], #root a[href="${path}"]`);
}

export async function expectSidebarHasLink(page: Page, path: string): Promise<void> {
  await expect
    .poll(async () => sidebarLinkLocator(page, path).count(), {
      timeout: process.env.CI ? 45_000 : 20_000,
    })
    .toBe(1);
}

export async function expectSidebarMissingLink(page: Page, path: string): Promise<void> {
  await expect(sidebarLinkLocator(page, path)).toHaveCount(0, {
    timeout: 5_000,
  });
}

export async function waitForCommerceSidebarGating(
  page: Page,
  commerceType: StoreCommerceType,
  options: Omit<WaitForStoresLoadedOptions, 'commerceType'> = {}
): Promise<void> {
  if (options.storeId) {
    await page.evaluate(
      ({ storeId }) => {
        localStorage.setItem('selectedStoreId', storeId);
      },
      { storeId: options.storeId }
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForReactApp(page);
  }

  await waitForStoresLoaded(page, { ...options, commerceType });

  const createPath = PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE[commerceType];
  await expectSidebarHasLink(page, createPath);
}
