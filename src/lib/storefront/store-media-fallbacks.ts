/**
 * Fallbacks média storefront (placeholder produit, filigrane, défauts globaux).
 */

import type { Store } from '@/hooks/useStores';

export const DEFAULT_PRODUCT_PLACEHOLDER = '/placeholder-product.png';
export const DEFAULT_STORE_PLACEHOLDER = '/placeholder.svg';

type StoreMediaFields = Pick<Store, 'placeholder_image_url' | 'watermark_url' | 'logo_url'>;

export function resolveStoreProductPlaceholderUrl(store?: StoreMediaFields | null): string {
  const url = store?.placeholder_image_url?.trim();
  return url || DEFAULT_PRODUCT_PLACEHOLDER;
}

export function resolveStoreProductImageUrl(
  productImageUrl: string | null | undefined,
  store?: StoreMediaFields | null
): string {
  const trimmed = productImageUrl?.trim();
  if (trimmed) return trimmed;
  return resolveStoreProductPlaceholderUrl(store);
}

export function resolveStoreWatermarkUrl(store?: StoreMediaFields | null): string | null {
  const url = store?.watermark_url?.trim();
  return url || null;
}

export function resolveStoreLogoUrl(
  logoUrl: string | null | undefined,
  store?: StoreMediaFields | null
): string | null {
  const trimmed = logoUrl?.trim();
  if (trimmed) return trimmed;
  const fromStore = store?.logo_url?.trim();
  return fromStore || null;
}
