/**
 * Helpers E2E — découverte produits sur le marketplace (cours, artiste, etc.)
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { appLocator, gotoApp } from './e2e-test-config';

export type MarketplaceProductType = 'course' | 'artist' | 'digital' | 'physical' | 'service';

export async function assertProductListedInMarketplaceQuery(
  admin: SupabaseClient,
  productId: string,
  productName: string
): Promise<void> {
  const { data, error } = await admin
    .from('products')
    .select('id, name, is_active, is_draft, hide_from_store')
    .eq('id', productId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle();

  expect(error).toBeNull();
  expect(data?.id).toBe(productId);
  expect(data?.name).toBe(productName);
  expect(data?.hide_from_store).not.toBe(true);
}

export async function searchMarketplaceForProduct(page: Page, query: string): Promise<void> {
  const root = appLocator(page);
  const searchInput = root.locator('input[type="search"]').first();
  await expect(searchInput).toBeVisible({ timeout: 20_000 });
  await searchInput.fill(query);
  await searchInput.press('Enter');
  await page.waitForTimeout(1_000);
}

async function waitForProductInCatalog(
  admin: SupabaseClient,
  productId: string,
  productName: string,
  productType: MarketplaceProductType
): Promise<void> {
  await expect
    .poll(
      async () => {
        const { data: viewRow } = await admin
          .from('marketplace_products_optimized')
          .select('id')
          .eq('id', productId)
          .maybeSingle();
        if (viewRow?.id === productId) return true;

        const { data, error } = await admin.rpc('get_marketplace_products_filtered', {
          p_limit: 24,
          p_offset: 0,
          p_product_type: productType,
          p_sort_by: 'newest',
          p_sort_order: 'desc',
          p_search_query: productName,
          p_featured_only: false,
        });
        if (error || !Array.isArray(data)) return false;
        return data.some((row: { id?: string }) => row.id === productId);
      },
      { timeout: 45_000 }
    )
    .toBe(true);
}

async function clearMarketplaceClientCache(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('marketplace_'))
        .forEach(key => localStorage.removeItem(key));
    } catch {
      // ignore
    }
    try {
      indexedDB.deleteDatabase('marketplace_cache');
    } catch {
      // ignore
    }
  });
}

export async function assertMarketplaceGuestBuyCta(
  page: Page,
  productName: string,
  buyLabelPattern: RegExp
): Promise<void> {
  const root = appLocator(page);
  const card = root.getByTestId('product-card').filter({ hasText: productName }).first();
  await expect(card).toBeVisible({ timeout: 45_000 });

  const buyButton = card.locator('button[data-action="primary"]');
  await expect(buyButton).toBeVisible({ timeout: 10_000 });
  await expect(buyButton).toHaveText(buyLabelPattern);
}

export async function assertGuestMarketplaceProductVisible(
  page: Page,
  admin: SupabaseClient,
  productId: string,
  productName: string,
  buyLabelPattern: RegExp,
  productType: MarketplaceProductType
): Promise<void> {
  await assertProductListedInMarketplaceQuery(admin, productId, productName);
  await waitForProductInCatalog(admin, productId, productName, productType);
  await page.context().clearCookies();
  await clearMarketplaceClientCache(page);

  const params = new URLSearchParams({
    type: productType,
    sort: 'created_at',
    order: 'desc',
    q: productName,
  });
  await gotoApp(page, `/marketplace?${params.toString()}`);
  await assertMarketplaceGuestBuyCta(page, productName, buyLabelPattern);
}

export async function completeMarketplaceGuestPurchaseFromCard(
  page: Page,
  productName: string,
  options: { guestEmail: string; guestName?: string; expectedUrl: RegExp }
): Promise<void> {
  const root = appLocator(page);
  const card = root.getByTestId('product-card').filter({ hasText: productName }).first();
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.locator('button[data-action="primary"]').click();

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
  await page.locator('#guest-email').fill(options.guestEmail);
  if (options.guestName) {
    await page.locator('#guest-name').fill(options.guestName);
  }
  await page.getByRole('button', { name: /Continuer vers le paiement/i }).click();
  await expect(page).toHaveURL(options.expectedUrl, { timeout: 30_000 });
}

export async function openMarketplaceWithOptionalFilter(
  page: Page,
  productType?: MarketplaceProductType
): Promise<boolean> {
  const root = appLocator(page);
  const card = root.locator('[data-testid="product-card"]').first();
  const hasCard = await card.isVisible().catch(() => false);
  if (!hasCard) return false;

  if (productType) {
    const filterByType: Record<MarketplaceProductType, string> = {
      course: 'button:has-text("Cours"), button:has-text("Course"), [data-product-type="course"]',
      artist:
        'button:has-text("Artiste"), button:has-text("Œuvre"), button:has-text("Artist"), [data-product-type="artist"]',
      digital:
        'button:has-text("Digital"), button:has-text("Numérique"), [data-product-type="digital"]',
      physical:
        'button:has-text("Physique"), button:has-text("Physical"), [data-product-type="physical"]',
      service: 'button:has-text("Service"), [data-product-type="service"]',
    };
    const filter = root.locator(filterByType[productType]);
    if (
      await filter
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await filter.first().click();
    }
  }

  return true;
}

export async function openFirstProductCard(page: Page, urlPattern: RegExp): Promise<boolean> {
  const root = appLocator(page);
  const card = root.locator('[data-testid="product-card"]').first();
  if (!(await card.isVisible().catch(() => false))) return false;

  await card.click();
  await page.waitForURL(urlPattern, { timeout: 15_000 }).catch(() => undefined);
  return urlPattern.test(page.url());
}
