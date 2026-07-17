import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';
import { CROSS_TYPE_BUNDLES_METADATA_FLAG } from '@/lib/commerce/cross-type-bundle-access';

const CROSS_TYPE_CATALOG_TYPES: readonly StoreCommerceType[] = [
  'physical',
  'digital',
  'course',
  'artist',
] as const;

function isCrossTypeCatalogEnabled(storeMetadata?: Record<string, unknown> | null): boolean {
  const meta = storeMetadata && typeof storeMetadata === 'object' ? storeMetadata : null;
  return meta?.[CROSS_TYPE_BUNDLES_METADATA_FLAG] === true;
}

export function getAllowedStorefrontProductTypes(
  commerceType?: StoreCommerceType | null,
  storeMetadata?: Record<string, unknown> | null
): readonly StoreCommerceType[] {
  const store = parseStoreCommerceType(commerceType);

  if (isCrossTypeCatalogEnabled(storeMetadata)) {
    return CROSS_TYPE_CATALOG_TYPES;
  }

  return [store];
}

export function productMatchesStoreCommerceType(
  productType: string | null | undefined,
  commerceType?: StoreCommerceType | null,
  storeMetadata?: Record<string, unknown> | null
): boolean {
  const normalizedProduct = parseStoreCommerceType(productType);
  const allowed = getAllowedStorefrontProductTypes(commerceType, storeMetadata);
  return allowed.includes(normalizedProduct);
}

export function filterStorefrontProducts<T extends { product_type?: string | null }>(
  products: readonly T[],
  commerceType?: StoreCommerceType | null,
  storeMetadata?: Record<string, unknown> | null
): T[] {
  const allowed = new Set(getAllowedStorefrontProductTypes(commerceType, storeMetadata));
  return products.filter(product => allowed.has(parseStoreCommerceType(product.product_type)));
}
