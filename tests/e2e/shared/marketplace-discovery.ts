/**
 * Helpers E2E — découverte produits sur le marketplace (cours, artiste, etc.)
 */

import type { Page } from '@playwright/test';
import { appLocator } from './e2e-test-config';

export type MarketplaceProductType = 'course' | 'artist' | 'digital' | 'physical' | 'service';

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
