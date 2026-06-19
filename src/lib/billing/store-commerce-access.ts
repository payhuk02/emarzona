import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { STORE_COMMERCE_TYPES } from '@/constants/store-commerce-types';
import { getNavItemPath } from '@/config/navigation.helpers';

/** Routes réservées au e-commerce produits physiques (hors emailing). */
export const PHYSICAL_ONLY_SELLER_PATHS = [
  '/dashboard/shipping',
  '/dashboard/shipping-services',
  '/dashboard/contact-shipping-service',
  '/dashboard/batch-shipping',
  '/dashboard/suppliers',
  '/dashboard/warehouses',
  '/dashboard/physical-inventory',
  '/dashboard/physical-analytics',
  '/dashboard/physical-lots',
  '/dashboard/physical-lots-old',
  '/dashboard/physical-serial-tracking',
  '/dashboard/physical-barcode-scanner',
  '/dashboard/physical-preorders',
  '/dashboard/physical-backorders',
  '/dashboard/physical-bundles',
  '/dashboard/physical-promotions',
  '/dashboard/physical-products',
  '/dashboard/multi-currency',
  '/dashboard/demand-forecasting',
  '/dashboard/cost-optimization',
  '/dashboard/inventory',
  '/dashboard/inventory-analytics',
  '/dashboard/product-kits',
  '/dashboard/physical',
  '/dashboard/billing/physical',
  '/dashboard/onboarding/physical-subscription',
] as const;

export function parseStoreCommerceType(
  value: unknown,
  fallback: StoreCommerceType = 'physical'
): StoreCommerceType {
  if (typeof value === 'string' && (STORE_COMMERCE_TYPES as readonly string[]).includes(value)) {
    return value as StoreCommerceType;
  }
  return fallback;
}

export function resolveStoreCommerceType(
  metadata?: Record<string, unknown> | null,
  explicitCommerceType?: unknown
): StoreCommerceType {
  return parseStoreCommerceType(explicitCommerceType ?? metadata?.commerce_type);
}

/**
 * True si la boutique utilise le système e-commerce produits physiques
 * (abonnement + fonctionnalités logistiques).
 * Les boutiques sans commerce_type explicite restent traitées comme physiques (rétrocompat).
 */
export function isPhysicalCommerceStore(commerceType?: StoreCommerceType | null): boolean {
  return commerceType == null || commerceType === 'physical';
}

export function shouldApplyPhysicalPlanGating(commerceType?: StoreCommerceType | null): boolean {
  return isPhysicalCommerceStore(commerceType);
}

function normalizeSellerPath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/dashboard';
}

export function isPhysicalOnlySellerPath(pathname: string): boolean {
  const normalized = normalizeSellerPath(pathname);
  if (normalized.startsWith('/dashboard/emails')) {
    return false;
  }
  return PHYSICAL_ONLY_SELLER_PATHS.some(
    prefix => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export function isPhysicalOnlyNavUrl(urlOrPath: string): boolean {
  return isPhysicalOnlySellerPath(getNavItemPath(urlOrPath));
}
