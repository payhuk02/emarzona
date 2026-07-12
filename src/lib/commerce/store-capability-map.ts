import type { StoreCommerceType } from '@/constants/store-commerce-types';
import {
  parseStoreCommerceType,
  PHYSICAL_ONLY_SELLER_PATHS,
} from '@/lib/billing/store-commerce-access';

type RouteRule = {
  allowedTypes: readonly StoreCommerceType[];
  pathPrefixes?: readonly string[];
  exactPaths?: readonly string[];
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

/** Liste produits / module principal par verticale (prefetch vendeur). */
export const VENDOR_PRODUCT_LIST_PATH_BY_TYPE: Record<StoreCommerceType, string> = {
  physical: '/dashboard/physical-products',
  digital: '/dashboard/digital-products',
  service: '/dashboard/services',
  course: '/dashboard/courses',
  artist: '/dashboard/artist-products',
};

export function getVendorProductListPath(commerceType?: StoreCommerceType | null): string {
  return VENDOR_PRODUCT_LIST_PATH_BY_TYPE[parseStoreCommerceType(commerceType)];
}

const COMMON_SELLER_PATHS = [
  '/dashboard',
  '/marketplace',
  '/vendor/messaging',
  '/account',
  '/cart',
  '/notifications',
  '/dashboard/abandoned-carts',
  '/dashboard/advanced-orders',
  '/dashboard/ai-chatbot',
  '/dashboard/coupons',
  '/dashboard/cross-type-bundles',
  '/dashboard/customers',
  '/dashboard/domain',
  '/dashboard/image-studio',
  '/dashboard/inventory',
  '/dashboard/kyc',
  '/dashboard/marketing',
  '/dashboard/orders',
  '/dashboard/pay-balance',
  '/dashboard/payment-connections',
  '/dashboard/payment-management',
  '/dashboard/payment-methods',
  '/dashboard/payments',
  '/dashboard/payments-customers',
  '/dashboard/pixels',
  '/dashboard/products',
  '/dashboard/promotions',
  '/dashboard/promotions/stats',
  '/dashboard/referrals',
  '/dashboard/reviews',
  '/dashboard/seo',
  '/dashboard/seo/inspector',
  '/dashboard/settings',
  '/dashboard/shipping',
  '/dashboard/store',
  '/dashboard/store/team',
  '/dashboard/tasks',
  '/dashboard/taxes',
  '/dashboard/withdrawals',
];

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
    pathPrefixes: [...PHYSICAL_ONLY_SELLER_PATHS],
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
      '/digital/search',
      '/digital/compare',
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
      '/dashboard/courses',
      '/dashboard/courses/',
      '/dashboard/cohorts',
      '/affiliate/courses',
    ],
  },
  {
    label: "Modules Oeuvres d'artiste",
    allowedTypes: ['artist'],
    pathPrefixes: [
      '/dashboard/artist-products',
      '/dashboard/portfolios',
      '/dashboard/auctions',
      '/collections',
      '/auctions',
    ],
  },
  {
    label: 'Fonctionnalites communes',
    allowedTypes: ALL_TYPES,
    pathPrefixes: [
      '/dashboard/emails',
      '/dashboard/analytics',
      '/dashboard/advanced',
      '/notifications',
      '/settings/notifications',
      '/dashboard/integrations',
    ],
  },
  {
    label: 'Programme affiliation promoteurs',
    allowedTypes: ['digital', 'course', 'artist'],
    pathPrefixes: ['/dashboard/affiliates', '/affiliate/dashboard'],
  },
  {
    label: 'Gestion affiliation boutique',
    allowedTypes: ALL_TYPES,
    pathPrefixes: ['/dashboard/store-affiliates'],
  },
  {
    label: 'Gamification',
    allowedTypes: ['course', 'digital', 'artist'],
    pathPrefixes: ['/dashboard/gamification'],
  },
  {
    label: 'Webhooks & automatisations',
    allowedTypes: ['physical', 'digital', 'service', 'course', 'artist'],
    pathPrefixes: ['/dashboard/webhooks'],
  },
  {
    label: 'Fidelite & cartes cadeaux',
    allowedTypes: ['physical', 'digital', 'service', 'course'],
    pathPrefixes: ['/dashboard/loyalty', '/dashboard/gift-cards'],
  },
  {
    label: 'Comparateur produits physiques',
    allowedTypes: ['physical'],
    pathPrefixes: ['/products/compare'],
  },
  {
    label: 'Routes Vendeurs Communes',
    allowedTypes: ALL_TYPES,
    pathPrefixes: [...COMMON_SELLER_PATHS.filter(p => p !== '/dashboard'), '/account'],
    exactPaths: ['/dashboard'],
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
  const normalized = normalizePath(pathname);
  for (const rule of ROUTE_CAPABILITY_RULES) {
    if (rule.exactPaths?.some(exact => normalizePath(exact) === normalized)) {
      return rule;
    }
    if (rule.pathPrefixes?.some(prefix => matchesPrefix(pathname, prefix))) {
      return rule;
    }
  }
  return null;
}

export function isGenericProductCreateChooser(pathname: string): boolean {
  return normalizePath(pathname.split('?')[0]) === '/dashboard/products/new';
}

export function canAccessCommercePath(
  pathname: string,
  commerceType?: StoreCommerceType | null
): boolean {
  if (isGenericProductCreateChooser(pathname)) {
    return false;
  }
  const rule = getRouteCapabilityRule(pathname);
  if (!rule) {
    if (import.meta.env?.DEV) {
      console.warn(`[Gating] Route non mappée bloquée par défaut (Default Deny): ${pathname}`);
    }
    return false;
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
