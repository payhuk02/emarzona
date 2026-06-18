/**
 * Routes à prefetch selon le profil utilisateur (scale: évite le prefetch dashboard pour les anonymes).
 */

import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { getVendorWizardPrefetchRoutes } from '@/lib/wizard/prefetch-product-wizards';

export const PUBLIC_IDLE_ROUTES = ['/marketplace', '/cart'] as const;
export const PUBLIC_HOVER_ROUTES = ['/marketplace', '/cart', '/checkout'] as const;

export const VENDOR_IDLE_ROUTES = [
  '/dashboard',
  '/dashboard/products',
  '/dashboard/orders',
] as const;
export const VENDOR_HOVER_ROUTES = [...VENDOR_IDLE_ROUTES, '/marketplace', '/cart'] as const;

export const CUSTOMER_IDLE_ROUTES = ['/marketplace', '/cart', '/account'] as const;
export const CUSTOMER_HOVER_ROUTES = [...CUSTOMER_IDLE_ROUTES, '/checkout'] as const;

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
    const wizardRoutes = getVendorWizardPrefetchRoutes(commerceType);
    const idleRoutes = [...new Set([...VENDOR_IDLE_ROUTES, ...wizardRoutes])];
    const hoverRoutes = [...new Set([...VENDOR_HOVER_ROUTES, ...wizardRoutes])];
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
