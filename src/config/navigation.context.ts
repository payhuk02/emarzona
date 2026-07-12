import type { TFunction } from 'i18next';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { translateNavItemTitle, translateNavSections } from '@/config/navigation.i18n';
import { PHASE6_CONTEXT_CONFIGS } from '@/config/navigation.context.phase6';
import { SETTINGS_CONTEXT_CONFIG } from '@/config/navigation.context.settings';
import {
  PRODUCTS_CONTEXT_SIDEBAR,
  LOGISTICS_CONTEXT_SIDEBAR,
  MARKETING_CONTEXT_SIDEBAR,
  ANALYTICS_CONTEXT_SIDEBAR,
  PAYMENTS_CONTEXT_SIDEBAR,
  SETTINGS_CONTEXT_SIDEBAR as EXTENDED_SETTINGS_CONTEXT_SIDEBAR,
  AI_CONTEXT_SIDEBAR,
  CONTEXT_SIDEBAR_MAPPING,
} from '@/config/navigation.context.extended';
import type {
  ContextSidebarConfig,
  ContextSidebarNavGroup,
  ContextSidebarNavResult,
  StaticContextNavItem,
} from '@/config/navigation.context.types';
import { userMenuSections } from '@/config/navigation.menus';
import type { NavItem, NavSection, SidebarPersona } from '@/config/navigation.types';

export type {
  ContextSidebarConfig,
  ContextSidebarGroupConfig,
  ContextSidebarNavGroup,
  ContextSidebarNavResult,
  StaticContextNavItem,
} from '@/config/navigation.context.types';

export const CONTEXT_SIDEBAR_CONFIGS = {
  // Extended context sidebars from navigation.context.extended
  products_extended: {
    id: 'products_extended',
    sectionKey: 'produits_etendus',
    rootPath: '/dashboard/products',
    ariaLabel: 'Navigation produits étendue',
    collapsibleGroups: true,
    groups: PRODUCTS_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  logistics_extended: {
    id: 'logistics_extended',
    sectionKey: 'logistique_etendue',
    rootPath: '/dashboard/orders',
    ariaLabel: 'Navigation logistique étendue',
    collapsibleGroups: true,
    groups: LOGISTICS_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  marketing_extended: {
    id: 'marketing_extended',
    sectionKey: 'marketing_etendu',
    rootPath: '/dashboard/customers',
    ariaLabel: 'Navigation marketing étendue',
    collapsibleGroups: true,
    groups: MARKETING_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  analytics_extended: {
    id: 'analytics_extended',
    sectionKey: 'analytics_etendu',
    rootPath: '/dashboard/analytics',
    ariaLabel: 'Navigation analytics étendue',
    collapsibleGroups: true,
    groups: ANALYTICS_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  payments_extended: {
    id: 'payments_extended',
    sectionKey: 'paiements_etendus',
    rootPath: '/dashboard/payments',
    ariaLabel: 'Navigation paiements étendue',
    collapsibleGroups: true,
    groups: PAYMENTS_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  settings_extended: {
    id: 'settings_extended',
    sectionKey: 'parametres_etendus',
    rootPath: '/dashboard/settings',
    ariaLabel: 'Navigation paramètres étendue',
    collapsibleGroups: true,
    groups: EXTENDED_SETTINGS_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  ai_extended: {
    id: 'ai_extended',
    sectionKey: 'ia_etendue',
    rootPath: '/recommendations',
    ariaLabel: 'Navigation IA étendue',
    collapsibleGroups: true,
    groups: AI_CONTEXT_SIDEBAR.map(section => ({
      groupKey: section.label.toLowerCase().replace(/\s+/g, '_'),
      defaultLabel: section.label,
      paths: section.items.map(item => item.url),
    })),
  },
  // Existing context configs
  finance: {
    id: 'finance',
    sectionKey: 'finance_paiements',
    rootPath: '/dashboard/payments',
    ariaLabel: 'Navigation finance',
    collapsibleGroups: true,
    groups: [
      {
        groupKey: 'paiements',
        defaultLabel: 'Paiements',
        paths: [
          '/dashboard/payments',
          '/dashboard/payment-methods',
          '/dashboard/payment-connections',
          '/dashboard/payment-management',
          '/dashboard/payments-customers',
        ],
      },
      {
        groupKey: 'taxes_soldes',
        defaultLabel: 'Taxes & soldes',
        paths: ['/dashboard/taxes', '/dashboard/pay-balance', '/dashboard/withdrawals'],
      },
    ],
  },
  analytics: {
    id: 'analytics',
    sectionKey: 'analytics_seo',
    rootPath: '/dashboard/analytics',
    ariaLabel: 'Navigation analytics',
    collapsibleGroups: true,
    groups: [
      {
        groupKey: 'analytics_dashboard',
        defaultLabel: 'Analytics',
        paths: ['/dashboard/analytics', '/dashboard/analytics/dashboards', '/dashboard/pixels'],
      },
      {
        groupKey: 'seo',
        defaultLabel: 'SEO',
        paths: ['/dashboard/seo', '/dashboard/seo/inspector'],
      },
    ],
  },
  systems: {
    id: 'systems',
    sectionKey: 'systemes_integrations',
    rootPath: '/dashboard/integrations',
    ariaLabel: 'Navigation systèmes',
    groups: [
      {
        groupKey: 'integrations',
        defaultLabel: 'Intégrations',
        paths: ['/dashboard/integrations'],
      },
      {
        groupKey: 'webhooks',
        defaultLabel: 'Webhooks',
        paths: ['/dashboard/webhooks'],
      },
      {
        groupKey: 'programmes',
        defaultLabel: 'Programmes',
        paths: ['/dashboard/loyalty', '/dashboard/gift-cards', '/notifications'],
      },
    ],
    collapsibleGroups: true,
  },
  products: {
    id: 'products',
    sectionKey: 'produits_cours',
    rootPath: '/dashboard/products',
    ariaLabel: 'Navigation produits et cours',
    excludePaths: ['/digital/search', '/digital/compare', '/products/compare', '/collections'],
    groups: [
      {
        groupKey: 'gestion',
        defaultLabel: 'Gestion',
        paths: [
          '/dashboard/products',
          '/dashboard/products/new',
          '/dashboard/products/new/digital',
          '/dashboard/products/new/physical',
          '/dashboard/products/new/service',
          '/dashboard/products/new/artist',
          '/dashboard/courses/new',
          '/dashboard/courses',
          '/dashboard/courses/live-sessions',
          '/dashboard/courses/assignments',
          '/dashboard/reviews',
          '/dashboard/cohorts',
        ],
      },
      {
        groupKey: 'produits_digitaux',
        defaultLabel: 'Produits Digitaux',
        paths: [
          '/dashboard/digital-products',
          '/dashboard/my-downloads',
          '/dashboard/my-licenses',
          '/dashboard/license-management',
          '/dashboard/digital-products/bundles',
          '/dashboard/digital-products/bundles/create',
          '/dashboard/cross-type-bundles',
          '/dashboard/digital/updates',
        ],
      },
      {
        groupKey: 'artiste_encheres',
        defaultLabel: 'Artiste & Enchères',
        paths: [
          '/dashboard/artist-products',
          '/dashboard/auctions',
          '/dashboard/auctions/watchlist',
          '/dashboard/portfolios',
        ],
      },
      {
        groupKey: 'produits_physiques',
        defaultLabel: 'Produits physiques',
        paths: [
          '/dashboard/physical-products',
          '/dashboard/physical-inventory',
          '/dashboard/physical-analytics',
          '/dashboard/physical-lots',
          '/dashboard/physical-serial-tracking',
          '/dashboard/physical-barcode-scanner',
          '/dashboard/physical-preorders',
          '/dashboard/physical-backorders',
          '/dashboard/physical-bundles',
          '/dashboard/physical-promotions',
          '/dashboard/multi-currency',
        ],
      },
      {
        groupKey: 'analytics_digitaux',
        defaultLabel: 'Analytics',
        paths: ['/dashboard/digital-products?view=analytics'],
      },
    ],
    collapsibleGroups: true,
  },
  marketing: {
    id: 'marketing',
    sectionKey: 'marketing_croissance',
    rootPath: '/dashboard/marketing',
    ariaLabel: 'Navigation marketing',
    groups: [
      {
        groupKey: 'clients_promotions',
        defaultLabel: 'Clients & Promotions',
        paths: [
          '/dashboard/marketing',
          '/dashboard/customers',
          '/dashboard/promotions',
          '/dashboard/promotions/stats',
          '/dashboard/coupons',
          '/dashboard/abandoned-carts',
        ],
      },
      {
        groupKey: 'email_marketing',
        defaultLabel: 'Email Marketing',
        paths: [
          '/dashboard/emails/campaigns',
          '/dashboard/emails/sequences',
          '/dashboard/emails/segments',
          '/dashboard/emails/analytics',
          '/dashboard/emails/workflows',
          '/dashboard/emails/templates/editor',
          '/dashboard/emails/tags',
        ],
      },
      {
        groupKey: 'croissance',
        defaultLabel: 'Croissance',
        paths: [
          '/dashboard/referrals',
          '/dashboard/affiliates',
          '/affiliate/dashboard',
          '/affiliate/courses',
          '/dashboard/gamification',
          '/dashboard/store-affiliates',
        ],
      },
    ],
  },
  emails: {
    id: 'emails',
    sectionKey: 'marketing_croissance',
    rootPath: '/dashboard/emails/campaigns',
    breadcrumbSectionKey: 'emails',
    ariaLabel: 'Navigation emails',
    includePaths: [
      '/dashboard/emails/campaigns',
      '/dashboard/emails/sequences',
      '/dashboard/emails/segments',
      '/dashboard/emails/workflows',
      '/dashboard/emails/tags',
      '/dashboard/emails/analytics',
      '/dashboard/emails/templates/editor',
    ],
  },
  customers: {
    id: 'customers',
    sectionKey: 'marketing_croissance',
    rootPath: '/dashboard/customers',
    breadcrumbSectionKey: 'clients',
    ariaLabel: 'Navigation clients',
    collapsibleGroups: true,
    includePaths: [
      '/dashboard/marketing',
      '/dashboard/customers',
      '/dashboard/referrals',
      '/dashboard/affiliates',
      '/dashboard/coupons',
      '/dashboard/abandoned-carts',
      '/account/wishlist',
      '/account/alerts',
    ],
    groups: [
      {
        groupKey: 'clients',
        defaultLabel: 'Clients',
        paths: [
          '/dashboard/marketing',
          '/dashboard/customers',
          '/account/wishlist',
          '/account/alerts',
        ],
      },
      {
        groupKey: 'fidelisation',
        defaultLabel: 'Fidélisation',
        paths: [
          '/dashboard/referrals',
          '/dashboard/affiliates',
          '/dashboard/coupons',
          '/dashboard/abandoned-carts',
        ],
      },
    ],
  },
  orders: {
    id: 'orders',
    sectionKey: 'ventes_logistique',
    additionalSectionKeys: ['finance_paiements'],
    rootPath: '/dashboard/orders',
    breadcrumbSectionKey: 'commandes',
    ariaLabel: 'Navigation des commandes',
    collapsibleGroups: true,
    includePaths: [
      '/dashboard/orders',
      '/dashboard/advanced-orders',
      '/vendor/messaging',
      '/dashboard/store/team',
      '/dashboard/tasks',
      '/dashboard/shipping',
      '/dashboard/payments',
      '/dashboard/taxes',
      '/dashboard/payment-methods',
      '/dashboard/payment-connections',
      '/dashboard/withdrawals',
    ],
    groups: [
      {
        groupKey: 'commandes',
        defaultLabel: 'Commandes',
        paths: ['/dashboard/orders', '/dashboard/advanced-orders'],
      },
      {
        groupKey: 'communication',
        defaultLabel: 'Communication',
        paths: ['/vendor/messaging', '/dashboard/store/team', '/dashboard/tasks'],
      },
      {
        groupKey: 'paiements_logistique',
        defaultLabel: 'Paiements & logistique',
        paths: [
          '/dashboard/payments',
          '/dashboard/taxes',
          '/dashboard/payment-methods',
          '/dashboard/payment-connections',
          '/dashboard/withdrawals',
          '/dashboard/shipping',
        ],
      },
    ],
  },
  settings: SETTINGS_CONTEXT_CONFIG,
  ...PHASE6_CONTEXT_CONFIGS,
} as const satisfies Record<string, ContextSidebarConfig>;

export type ContextSidebarConfigId = keyof typeof CONTEXT_SIDEBAR_CONFIGS;

function pathMatches(itemUrl: string, pattern: string): boolean {
  const itemPath = itemUrl.split('?')[0];
  const patternPath = pattern.split('?')[0];
  return itemUrl === pattern || itemPath === patternPath || itemPath.startsWith(`${patternPath}/`);
}

function filterItemsByPaths(items: NavItem[], config: ContextSidebarConfig): NavItem[] {
  let filtered = items;
  if (config.includePaths?.length) {
    filtered = filtered.filter(item => config.includePaths!.some(p => pathMatches(item.url, p)));
  }
  if (config.excludePaths?.length) {
    filtered = filtered.filter(item => !config.excludePaths!.some(p => pathMatches(item.url, p)));
  }
  return filtered;
}

function buildGroups(
  items: NavItem[],
  config: ContextSidebarConfig,
  t: TFunction
): ContextSidebarNavGroup[] {
  if (!config.groups?.length) return [];

  const used = new Set<string>();
  const groups: ContextSidebarNavGroup[] = config.groups
    .map(group => {
      const groupItems = items.filter(item => {
        const match = group.paths.some(p => pathMatches(item.url, p));
        if (match) used.add(item.url);
        return match;
      });
      return {
        groupKey: group.groupKey,
        label: t(`sidebar.contextGroups.${group.groupKey}`, { defaultValue: group.defaultLabel }),
        items: groupItems,
      };
    })
    .filter(group => group.items.length > 0);

  const ungrouped = items.filter(item => !used.has(item.url));
  if (ungrouped.length > 0) {
    groups.push({
      groupKey: 'other',
      label: t('sidebar.contextGroups.other', { defaultValue: 'Autres' }),
      items: ungrouped,
    });
  }

  return groups;
}

function collectSectionItems(sections: NavSection[], config: ContextSidebarConfig): NavItem[] {
  const keys = [config.sectionKey, ...(config.additionalSectionKeys ?? [])];
  const seen = new Set<string>();
  const items: NavItem[] = [];

  for (const key of keys) {
    const section = sections.find(s => s.sectionKey === key);
    if (!section) continue;
    for (const item of section.items) {
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      items.push(item);
    }
  }

  return items;
}

function staticItemsToNavItems(staticItems: StaticContextNavItem[]): NavItem[] {
  return staticItems.map(item => ({
    title: item.title,
    url: item.url,
    icon: item.icon,
    personas: ['seller'] as SidebarPersona[],
    tier: 'extended' as const,
  }));
}

export function getContextNavSections(): NavSection[] {
  return enrichNavSections(userMenuSections);
}

export function getNavSectionsForPersona(persona: SidebarPersona = 'seller'): NavSection[] {
  return filterNavSections(enrichNavSections(userMenuSections), persona, { sidebarOnly: false });
}

export function getSellerNavSections(): NavSection[] {
  return getNavSectionsForPersona('seller');
}

export function getBuyerNavSections(): NavSection[] {
  return getNavSectionsForPersona('buyer');
}

export function resolveContextSidebarNav(
  sections: NavSection[],
  config: ContextSidebarConfig,
  t: TFunction
): ContextSidebarNavResult {
  if (config.staticItems?.length) {
    const items = config.staticItems.map(item => ({
      ...staticItemsToNavItems([item])[0],
      title: translateNavItemTitle({ title: item.title, url: item.url }, t),
    }));
    const breadcrumbKey = config.breadcrumbSectionKey ?? config.sectionKey;
    return {
      sectionLabel: t(`sidebar.sections.${breadcrumbKey}`, { defaultValue: 'Paramètres' }),
      rootPath: config.rootPath,
      items,
      groups: null,
    };
  }

  const sectionItems = collectSectionItems(sections, config);
  const section = sections.find(s => s.sectionKey === config.sectionKey);
  if (!section && sectionItems.length === 0) {
    return { sectionLabel: '', rootPath: config.rootPath, items: [], groups: null };
  }

  const filteredItems = filterItemsByPaths(sectionItems, config);
  const supplement = config.supplementStaticItems?.length
    ? staticItemsToNavItems(config.supplementStaticItems)
    : [];
  const mergedItems = [
    ...filteredItems,
    ...supplement.filter(s => !filteredItems.some(f => f.url === s.url)),
  ];
  const pseudoSection: NavSection = {
    label: section?.label ?? config.sectionKey,
    sectionKey: config.sectionKey,
    items: mergedItems,
  };
  const [translated] = translateNavSections([pseudoSection], t);

  const breadcrumbKey = config.breadcrumbSectionKey ?? config.sectionKey;
  const sectionLabel = t(`sidebar.sections.${breadcrumbKey}`, {
    defaultValue: translated.label,
  });

  const groups = config.groups?.length ? buildGroups(translated.items, config, t) : null;

  return {
    sectionLabel,
    rootPath: config.rootPath,
    items: translated.items,
    groups: groups && groups.length > 0 ? groups : null,
  };
}
