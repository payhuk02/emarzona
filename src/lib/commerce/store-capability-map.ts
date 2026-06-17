import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { parseStoreCommerceType } from '@/lib/billing/store-commerce-access';

type RouteRule = {
  allowedTypes: readonly StoreCommerceType[];
  pathPrefixes: readonly string[];
  label: string;
};

const ALL_TYPES: readonly StoreCommerceType[] = [
  'physical',
  'digital',
  'service',
  'course',
  'artist',
] as const;

const ROUTE_CAPABILITY_RULES: readonly RouteRule[] = [
  {
    label: 'Modules Produits Physiques',
    allowedTypes: ['physical'],
    pathPrefixes: [
      '/dashboard/shipping',
      '/dashboard/shipping-services',
      '/dashboard/contact-shipping-service',
      '/dashboard/batch-shipping',
      '/dashboard/suppliers',
      '/dashboard/warehouses',
      '/dashboard/physical',
      '/dashboard/inventory',
      '/dashboard/product-kits',
      '/dashboard/demand-forecasting',
      '/dashboard/cost-optimization',
      '/shipping',
      '/inventory',
    ],
  },
  {
    label: 'Modules Produits Digitaux',
    allowedTypes: ['digital'],
    pathPrefixes: [
      '/dashboard/digital-products',
      '/dashboard/my-downloads',
      '/dashboard/my-licenses',
      '/dashboard/license-management',
      '/dashboard/licenses/manage',
      '/dashboard/digital/',
      '/dashboard/digital',
    ],
  },
  {
    label: 'Modules Services',
    allowedTypes: ['service'],
    pathPrefixes: [
      '/dashboard/services',
      '/dashboard/bookings',
      '/dashboard/advanced-calendar',
      '/dashboard/recurring-bookings',
      '/dashboard/service-management',
    ],
  },
  {
    label: 'Modules Cours en ligne',
    allowedTypes: ['course'],
    pathPrefixes: [
      '/dashboard/my-courses',
      '/dashboard/courses/',
      '/dashboard/courses',
      '/dashboard/cohorts',
      '/courses/',
    ],
  },
  {
    label: "Modules Oeuvres d'artiste",
    allowedTypes: ['artist'],
    pathPrefixes: ['/dashboard/portfolios', '/dashboard/auctions'],
  },
  {
    label: 'Fonctionnalites communes',
    allowedTypes: ALL_TYPES,
    pathPrefixes: [
      '/dashboard/emails',
      '/dashboard/analytics',
      '/notifications',
      '/settings/notifications',
    ],
  },
];

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  const normalizedPath = normalizePath(pathname);
  const normalizedPrefix = normalizePath(prefix);
  return normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`);
}

export function resolveStoreCommerceTypeFromStore(store: {
  commerce_type?: unknown;
  metadata?: Record<string, unknown> | null;
}): StoreCommerceType {
  return parseStoreCommerceType(
    store.commerce_type ??
      (store.metadata && typeof store.metadata === 'object'
        ? store.metadata.commerce_type
        : undefined)
  );
}

export function getRouteCapabilityRule(pathname: string): RouteRule | null {
  for (const rule of ROUTE_CAPABILITY_RULES) {
    if (rule.pathPrefixes.some(prefix => matchesPrefix(pathname, prefix))) {
      return rule;
    }
  }
  return null;
}

export function canAccessCommercePath(
  pathname: string,
  commerceType?: StoreCommerceType | null
): boolean {
  const rule = getRouteCapabilityRule(pathname);
  if (!rule) {
    return true;
  }
  const effectiveType = parseStoreCommerceType(commerceType);
  return rule.allowedTypes.includes(effectiveType);
}
