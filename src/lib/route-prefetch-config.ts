/**
 * Routes à prefetch selon le profil utilisateur (scale: évite le prefetch dashboard pour les anonymes).
 */

import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { getVendorProductListPath } from '@/lib/commerce/store-capability-map';
import { getVendorWizardPrefetchRoutes } from '@/lib/wizard/prefetch-product-wizards';

export const PUBLIC_IDLE_ROUTES = ['/marketplace', '/cart'] as const;
export const PUBLIC_HOVER_ROUTES = ['/marketplace', '/cart', '/checkout'] as const;

/** Chemins vendeur indépendants du commerce_type */
export const VENDOR_CORE_IDLE_ROUTES = ['/dashboard', '/dashboard/orders'] as const;
export const VENDOR_CORE_HOVER_ROUTES = [
  ...VENDOR_CORE_IDLE_ROUTES,
  '/marketplace',
  '/cart',
] as const;

/** @deprecated Utiliser getVendorIdleRoutes(commerceType) */
export const VENDOR_IDLE_ROUTES = [...VENDOR_CORE_IDLE_ROUTES, '/dashboard/products'] as const;
export const VENDOR_HOVER_ROUTES = [...VENDOR_IDLE_ROUTES, '/marketplace', '/cart'] as const;

export const CUSTOMER_IDLE_ROUTES = ['/marketplace', '/cart', '/account'] as const;
export const CUSTOMER_HOVER_ROUTES = [...CUSTOMER_IDLE_ROUTES, '/checkout'] as const;

/** Liste + wizard prefetch alignés sur commerce_type (perf vendeur). */
export function getVendorIdleRoutes(commerceType?: StoreCommerceType | null): readonly string[] {
  const listPath = getVendorProductListPath(commerceType);
  const wizardRoutes = getVendorWizardPrefetchRoutes(commerceType);
  return [...new Set([...VENDOR_CORE_IDLE_ROUTES, listPath, ...wizardRoutes])];
}

export function getVendorHoverRoutes(commerceType?: StoreCommerceType | null): readonly string[] {
  return [...new Set([...getVendorIdleRoutes(commerceType), '/marketplace', '/cart'])];
}

export interface RoutePrefetchConfig {
  enabled: boolean;
  idleRoutes: readonly string[];
  hoverRoutes: readonly string[];
  idleDelayMs: number;
}

export function getRoutePrefetchConfig(
  authLoading: boolean,
  storeLoading: boolean,
  userId: string | null | undefined,
  storeCount: number,
  commerceType?: StoreCommerceType | null
): RoutePrefetchConfig {
  if (authLoading || storeLoading) {
    return { enabled: false, idleRoutes: [], hoverRoutes: [], idleDelayMs: 0 };
  }

  if (!userId) {
    return {
      enabled: true,
      idleRoutes: PUBLIC_IDLE_ROUTES,
      hoverRoutes: PUBLIC_HOVER_ROUTES,
      idleDelayMs: 3000,
    };
  }

  if (storeCount > 0) {
    const idleRoutes = getVendorIdleRoutes(commerceType);
    const hoverRoutes = getVendorHoverRoutes(commerceType);
    return {
      enabled: true,
      idleRoutes,
      hoverRoutes,
      idleDelayMs: 2500,
    };
  }

  return {
    enabled: true,
    idleRoutes: CUSTOMER_IDLE_ROUTES,
    hoverRoutes: CUSTOMER_HOVER_ROUTES,
    idleDelayMs: 3000,
  };
}
