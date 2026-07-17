import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';

export const CROSS_TYPE_BUNDLES_PATH = '/dashboard/cross-type-bundles';

/**
 * Verticales où les packs multi-types (digital + physique + cours + artiste) ont du sens.
 * Service → panier mixte réservation + produit ; cours/artiste → bundles verticaux dédiés.
 */
export const CROSS_TYPE_BUNDLE_COMMERCE_TYPES: readonly StoreCommerceType[] = [
  'physical',
  'digital',
] as const;

export const CROSS_TYPE_BUNDLES_METADATA_FLAG = 'cross_type_bundles_enabled' as const;

export function isCrossTypeBundlesPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return (
    normalized === CROSS_TYPE_BUNDLES_PATH || normalized.startsWith(`${CROSS_TYPE_BUNDLES_PATH}/`)
  );
}

export function isCrossTypeBundlesCommerceType(commerceType?: StoreCommerceType | null): boolean {
  return CROSS_TYPE_BUNDLE_COMMERCE_TYPES.includes(parseStoreCommerceType(commerceType));
}

export function isCrossTypeBundlesEnabledForStore(options?: {
  commerceType?: StoreCommerceType | null;
  storeMetadata?: Record<string, unknown> | null;
}): boolean {
  const meta =
    options?.storeMetadata && typeof options.storeMetadata === 'object'
      ? options.storeMetadata
      : null;

  if (meta?.[CROSS_TYPE_BUNDLES_METADATA_FLAG] === true) {
    return true;
  }

  return isCrossTypeBundlesCommerceType(options?.commerceType);
}

export function countDistinctProductTypes(
  products: ReadonlyArray<{ product_type: string }> | undefined
): number {
  if (!products?.length) return 0;
  return new Set(products.map(p => p.product_type)).size;
}

export function hasMultiTypeCatalog(
  products: ReadonlyArray<{ product_type: string }> | undefined
): boolean {
  return countDistinctProductTypes(products) >= 2;
}
