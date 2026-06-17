import type { StoreCommerceType } from '@/constants/store-commerce-types';
import {
  parseStoreCommerceType,
  PHYSICAL_ONLY_SELLER_PATHS,
} from '@/lib/billing/store-commerce-access';

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

/** Primary wizard entry per store commerce type (sidebar + route guard). */
export const PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE: Record<StoreCommerceType, string> = {
  physical: '/dashboard/products/new/physical',
  digital: '/dashboard/products/new/digital',
  service: '/dashboard/products/new/service',
  course: '/dashboard/courses/new',
  artist: '/dashboard/products/new/artist',
};

const PRODUCT_CREATE_ROUTE_RULES: readonly RouteRule[] = [
  {
    label: 'Creation produit physique',
    allowedTypes: ['physical'],
    pathPrefixes: ['/dashboard/products/new/physical'],
  },
  {
    label: 'Creation produit digital',
    allowedTypes: ['digital'],
    pathPrefixes: ['/dashboard/products/new/digital'],
  },
  {
    label: 'Creation service',
    allowedTypes: ['service'],
    pathPrefixes: ['/dashboard/products/new/service'],
  },
  {
    label: "Creation oeuvre d'artiste",
    allowedTypes: ['artist'],
    pathPrefixes: ['/dashboard/products/new/artist'],
  },
  {
    label: 'Creation cours',
    allowedTypes: ['course'],
    pathPrefixes: ['/dashboard/courses/new'],
  },
];

const ROUTE_CAPABILITY_RULES: readonly RouteRule[] = [
  ...PRODUCT_CREATE_ROUTE_RULES,
  {
    label: 'Modules Produits Physiques',
    allowedTypes: ['physical'],
    pathPrefixes: [...PHYSICAL_ONLY_SELLER_PATHS, '/shipping', '/inventory'],
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

export function getPrimaryProductCreatePath(commerceType?: StoreCommerceType | null): string {
  return PRIMARY_PRODUCT_CREATE_PATH_BY_TYPE[parseStoreCommerceType(commerceType)];
}

/** Sidebar create links: one typed wizard per store; hide generic type chooser. */
export function canAccessProductCreateNavPath(
  pathname: string,
  commerceType?: StoreCommerceType | null
): boolean {
  const path = normalizePath(pathname.split('?')[0]);
  if (path === '/dashboard/products/new') {
    return false;
  }
  return canAccessCommercePath(pathname, commerceType);
}
