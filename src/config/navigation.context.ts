import type { TFunction } from 'i18next';
import { enrichNavSections, filterNavSections } from '@/config/navigation.enrich';
import { translateNavSections } from '@/config/navigation.i18n';
import { userMenuSections } from '@/config/navigation.menus';
import type { NavItem, NavSection } from '@/config/navigation.types';

export type ContextSidebarGroupConfig = {
  groupKey: string;
  /** French fallback label */
  defaultLabel: string;
  paths: string[];
};

export type ContextSidebarConfig = {
  id: string;
  sectionKey: string;
  rootPath: string;
  ariaLabel: string;
  /** Breadcrumb root label override key (sidebar.sections.*) */
  breadcrumbSectionKey?: string;
  includePaths?: string[];
  excludePaths?: string[];
  groups?: ContextSidebarGroupConfig[];
  collapsibleGroups?: boolean;
};

export type ContextSidebarNavGroup = {
  groupKey: string;
  label: string;
  items: NavItem[];
};

export type ContextSidebarNavResult = {
  sectionLabel: string;
  rootPath: string;
  items: NavItem[];
  groups: ContextSidebarNavGroup[] | null;
};

export const CONTEXT_SIDEBAR_CONFIGS = {
  finance: {
    id: 'finance',
    sectionKey: 'finance_paiements',
    rootPath: '/dashboard/payments',
    ariaLabel: 'Navigation finance',
  },
  analytics: {
    id: 'analytics',
    sectionKey: 'analytics_seo',
    rootPath: '/dashboard/analytics',
    ariaLabel: 'Navigation analytics',
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
    groups: [
      {
        groupKey: 'gestion',
        defaultLabel: 'Gestion',
        paths: ['/dashboard/products', '/dashboard/my-courses'],
      },
      {
        groupKey: 'produits_digitaux',
        defaultLabel: 'Produits Digitaux',
        paths: [
          '/dashboard/digital-products',
          '/dashboard/my-downloads',
          '/dashboard/my-licenses',
          '/dashboard/digital-products/bundles',
          '/dashboard/digital-products/bundles/create',
          '/dashboard/digital/updates',
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
    includePaths: [
      '/dashboard/customers',
      '/dashboard/referrals',
      '/dashboard/affiliates',
      '/account/wishlist',
      '/account/alerts',
    ],
  },
  orders: {
    id: 'orders',
    sectionKey: 'ventes_logistique',
    rootPath: '/dashboard/orders',
    breadcrumbSectionKey: 'commandes',
    ariaLabel: 'Navigation des commandes',
    includePaths: [
      '/dashboard/orders',
      '/dashboard/advanced-orders',
      '/vendor/messaging',
      '/dashboard/shipping',
      '/dashboard/payments',
    ],
  },
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

export function getSellerNavSections(): NavSection[] {
  return filterNavSections(enrichNavSections(userMenuSections), 'seller', { sidebarOnly: false });
}

export function resolveContextSidebarNav(
  sections: NavSection[],
  config: ContextSidebarConfig,
  t: TFunction
): ContextSidebarNavResult {
  const section = sections.find(s => s.sectionKey === config.sectionKey);
  if (!section) {
    return { sectionLabel: '', rootPath: config.rootPath, items: [], groups: null };
  }

  const filteredItems = filterItemsByPaths(section.items, config);
  const [translated] = translateNavSections([{ ...section, items: filteredItems }], t);

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
