import { Plus } from '@/components/icons';
import { sectionLabelToKey } from '@/config/navigation.i18n';
import { isNavItemActive } from '@/config/navigation.helpers';
import { isNavFeatureEnabled } from '@/lib/navigation/feature-flags';
import type {
  FlatNavEntry,
  NavItem,
  NavSection,
  NavTier,
  SidebarPersona,
} from '@/config/navigation.types';

/** Raw menu item before enrichment (legacy AppSidebar shape) */
export type RawNavItem = {
  title: string;
  url: string;
  icon: NavItem['icon'];
  /** Optional client feature flag key (see lib/navigation/feature-flags) */
  featureFlag?: string;
  /** Visible only to platform admins in seller persona */
  adminOnly?: boolean;
};

export type RawNavSection = {
  label: string;
  items: RawNavItem[];
};

const CREATE_PATHS = new Set([
  '/dashboard/products/new',
  '/dashboard/products/new/digital',
  '/dashboard/products/new/physical',
  '/dashboard/products/new/service',
  '/dashboard/products/new/artist',
  '/dashboard/courses/new',
]);

/** Curated seller sidebar — ~35 essential links (Phase 2 compact nav) */
export const SELLER_PRIMARY_PATHS = new Set([
  '/dashboard',
  '/dashboard/store',
  '/marketplace',
  '/dashboard/products/new',
  '/dashboard/products/new/digital',
  '/dashboard/products/new/physical',
  '/dashboard/products/new/service',
  '/dashboard/courses/new',
  '/dashboard/products/new/artist',
  '/dashboard/products',
  '/dashboard/digital-products',
  '/dashboard/my-courses',
  '/dashboard/reviews',
  '/dashboard/license-management',
  '/dashboard/auctions',
  '/dashboard/portfolios',
  '/dashboard/orders',
  '/dashboard/store/team',
  '/dashboard/bookings',
  '/dashboard/inventory',
  '/dashboard/shipping',
  '/vendor/messaging',
  '/dashboard/withdrawals',
  '/dashboard/marketing',
  '/dashboard/customers',
  '/dashboard/promotions',
  '/dashboard/emails/campaigns',
  '/dashboard/coupons',
  '/dashboard/payments',
  '/dashboard/payments-customers',
  '/dashboard/payment-management',
  '/dashboard/taxes',
  '/dashboard/payment-methods',
  '/dashboard/payment-connections',
  '/dashboard/analytics',
  '/dashboard/seo',
  '/dashboard/pixels',
  '/dashboard/settings',
  '/dashboard/kyc',
  '/dashboard/domain',
]);

const BUYER_PUBLIC_PATHS = new Set(['/marketplace', '/auctions']);

/** Curated buyer sidebar — hub uniquement ; liens détaillés dans la barre horizontale */
export const BUYER_PRIMARY_PATHS = new Set(['/account']);

/** Public/discovery URLs excluded from seller navigation (Phase 4 cleanup). */
export const SELLER_EXCLUDED_PATHS = new Set([
  '/digital/search',
  '/digital/compare',
  '/products/compare',
  '/collections',
  '/recommendations',
  '/discover',
  '/trending',
  '/recommendations/history-based',
  '/personalization/quiz',
  '/personalization/recommendations',
  '/community',
]);

function resolvePersonas(url: string, sectionLabel: string): SidebarPersona[] {
  const path = url.split('?')[0];

  if (
    sectionLabel === 'Mon Compte' ||
    path.startsWith('/account') ||
    path.startsWith('/checkout/multi-store')
  ) {
    return ['buyer'];
  }

  if (path.startsWith('/admin')) return ['admin'];

  if (SELLER_EXCLUDED_PATHS.has(path)) {
    return ['buyer'];
  }

  if (BUYER_PUBLIC_PATHS.has(path)) return ['seller', 'buyer'];

  if (sectionLabel === 'Recommandations IA') {
    return path.startsWith('/dashboard') ? ['seller'] : ['buyer'];
  }

  if (
    path.startsWith('/dashboard') ||
    path.startsWith('/vendor') ||
    path.startsWith('/affiliate') ||
    path === '/notifications'
  ) {
    return ['seller'];
  }

  if (
    path.startsWith('/digital/') ||
    path.startsWith('/products/compare') ||
    path === '/collections'
  ) {
    return ['buyer'];
  }

  return ['seller'];
}

function resolveTier(url: string, sectionLabel: string): NavTier {
  const path = url.split('?')[0];
  if (CREATE_PATHS.has(path)) return 'primary';
  if (sectionLabel === 'Mon Compte') {
    return BUYER_PRIMARY_PATHS.has(path) ? 'primary' : 'extended';
  }
  if (sectionLabel === 'Principal') return SELLER_PRIMARY_PATHS.has(path) ? 'primary' : 'extended';
  return SELLER_PRIMARY_PATHS.has(path) ? 'primary' : 'extended';
}

export function enrichNavSections(sections: RawNavSection[]): NavSection[] {
  return sections.map(section => ({
    label: section.label,
    sectionKey: sectionLabelToKey(section.label),
    items: section.items
      .filter(item => isNavFeatureEnabled(item.featureFlag))
      .map(item => {
        const path = item.url.split('?')[0];
        return {
          ...item,
          personas: resolvePersonas(item.url, section.label),
          tier: resolveTier(item.url, section.label),
          createGroup: CREATE_PATHS.has(path),
        };
      }),
  }));
}

function splitCreateSection(sections: NavSection[]): NavSection[] {
  const createItems: NavItem[] = [];
  const hasChooser = { value: false };

  const rest = sections.flatMap(section => {
    if (section.label !== 'Produits & Cours') return [section];

    const remaining = section.items.filter(item => {
      if (item.createGroup) {
        createItems.push(item);
        if (item.url.split('?')[0] === '/dashboard/products/new') hasChooser.value = true;
        return false;
      }
      return true;
    });

    if (remaining.length === 0) return [];
    return [{ ...section, items: remaining }];
  });

  if (!hasChooser.value) {
    createItems.push({
      title: 'Choisir un type',
      url: '/dashboard/products/new',
      icon: Plus,
      personas: ['seller'],
      tier: 'primary',
      createGroup: true,
    });
  }

  if (createItems.length === 0) return rest;

  const createSection: NavSection = {
    label: 'Créer',
    sectionKey: 'creer',
    items: createItems,
    defaultOpen: true,
  };

  const principalIndex = rest.findIndex(s => s.label === 'Principal');
  if (principalIndex >= 0) {
    return [...rest.slice(0, principalIndex + 1), createSection, ...rest.slice(principalIndex + 1)];
  }
  return [createSection, ...rest];
}

export function filterNavSections(
  sections: NavSection[],
  persona: SidebarPersona,
  options: { sidebarOnly?: boolean } = {}
): NavSection[] {
  const { sidebarOnly = false } = options;

  let filtered = sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.personas.includes(persona)) return false;
        if (persona === 'buyer' && section.label === 'Principal') {
          if (sidebarOnly) return false;
          return BUYER_PUBLIC_PATHS.has(item.url.split('?')[0]);
        }
        if (!sidebarOnly) return true;
        return item.tier === 'primary';
      }),
    }))
    .filter(section => section.items.length > 0);

  if (persona === 'seller') {
    filtered = splitCreateSection(filtered);
  }

  return filtered;
}

export function flattenNavSections(sections: NavSection[]): FlatNavEntry[] {
  return sections.flatMap(section =>
    section.items.map(item => ({
      ...item,
      sectionLabel: section.label,
      sectionKey: section.sectionKey,
    }))
  );
}

export const DEFAULT_OPEN_SECTION_KEYS = new Set(['principal', 'administration', 'creer']);

export function sectionContainsPath(
  section: { items: { url: string }[] },
  pathname: string,
  search: string
): boolean {
  return section.items.some(item => isNavItemActive(item.url, pathname, search));
}
