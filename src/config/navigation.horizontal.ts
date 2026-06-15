/**
 * Navigation horizontale contextuelle (mega-menu) — style Systeme.io / enterprise SaaS.
 * Les sections Principal / Mon Compte restent dans AppSidebar compact.
 */

import { PHASE6_CONTEXT_CONFIGS } from '@/config/navigation.context.phase6';
import type { ContextSidebarGroupConfig } from '@/config/navigation.context.types';
import type { SidebarPersona } from '@/config/navigation.types';

export type HorizontalNavSectionSpec = {
  /** Identifiant stable pour clés React (peut différer de sectionKey côté acheteur) */
  domainKey: string;
  sectionKey: string;
  /** Libellé court dans la barre horizontale */
  shortLabel: string;
  /** Clé i18n optionnelle pour shortLabel */
  shortLabelKey?: string;
  /** Chemin racine pour lien direct si un seul item ou highlight */
  rootPath?: string;
  /** Filtre explicite de paths (domaines hors account.groups) */
  includePaths?: string[];
  /** Sections menu à parcourir avec includePaths */
  sourceSectionKeys?: string[];
};

/** Découverte & shopping public — barre horizontale acheteur */
export const BUYER_DISCOVERY_PATHS = [
  '/marketplace',
  '/auctions',
  '/recommendations',
  '/discover',
  '/trending',
  '/recommendations/history-based',
  '/personalization/quiz',
  '/personalization/recommendations',
] as const;

/** Ordre des domaines dans la barre horizontale vendeur */
export const SELLER_HORIZONTAL_NAV_SECTIONS: HorizontalNavSectionSpec[] = [
  {
    domainKey: 'produits_cours',
    sectionKey: 'produits_cours',
    shortLabel: 'Produits',
    rootPath: '/dashboard/products',
  },
  {
    domainKey: 'ventes_logistique',
    sectionKey: 'ventes_logistique',
    shortLabel: 'Ventes',
    rootPath: '/dashboard/orders',
  },
  {
    domainKey: 'finance_paiements',
    sectionKey: 'finance_paiements',
    shortLabel: 'Finance',
    rootPath: '/dashboard/payments',
  },
  {
    domainKey: 'marketing_croissance',
    sectionKey: 'marketing_croissance',
    shortLabel: 'Marketing',
    rootPath: '/dashboard/marketing',
  },
  {
    domainKey: 'analytics_seo',
    sectionKey: 'analytics_seo',
    shortLabel: 'Analytics',
    rootPath: '/dashboard/analytics',
  },
  {
    domainKey: 'recommandations_ia',
    sectionKey: 'recommandations_ia',
    shortLabel: 'IA',
    rootPath: '/dashboard/ai-chatbot',
  },
  {
    domainKey: 'systemes_integrations',
    sectionKey: 'systemes_integrations',
    shortLabel: 'Systèmes',
    rootPath: '/dashboard/integrations',
  },
  {
    domainKey: 'configuration',
    sectionKey: 'configuration',
    shortLabel: 'Paramètres',
    rootPath: '/dashboard/settings',
  },
];

/** Domaines acheteur — alignés sur PHASE6_CONTEXT_CONFIGS.account.groups + découverte */
export const BUYER_HORIZONTAL_NAV_SECTIONS: HorizontalNavSectionSpec[] = [
  {
    domainKey: 'decouvrir',
    sectionKey: 'principal',
    shortLabelKey: 'sidebar.chrome.buyerNavDecouvrir',
    shortLabel: 'Découvrir',
    rootPath: '/marketplace',
    includePaths: [...BUYER_DISCOVERY_PATHS],
    sourceSectionKeys: ['principal', 'recommandations_ia'],
  },
  {
    domainKey: 'profil_compte',
    sectionKey: 'mon_compte',
    shortLabelKey: 'sidebar.chrome.buyerNavCompte',
    shortLabel: 'Compte',
    rootPath: '/account',
  },
  {
    domainKey: 'achats',
    sectionKey: 'mon_compte',
    shortLabelKey: 'sidebar.chrome.buyerNavAchats',
    shortLabel: 'Achats',
    rootPath: '/account/orders',
  },
  {
    domainKey: 'portails',
    sectionKey: 'mon_compte',
    shortLabelKey: 'sidebar.chrome.buyerNavPortails',
    shortLabel: 'Portails',
    rootPath: '/account/digital',
  },
  {
    domainKey: 'services_fidelite',
    sectionKey: 'mon_compte',
    shortLabelKey: 'sidebar.chrome.buyerNavServices',
    shortLabel: 'Services',
    rootPath: '/account/bookings',
  },
  {
    domainKey: 'notifications',
    sectionKey: 'systemes_integrations',
    shortLabelKey: 'sidebar.chrome.buyerNavNotifications',
    shortLabel: 'Notifications',
    rootPath: '/notifications',
    includePaths: ['/notifications', '/settings/notifications'],
    sourceSectionKeys: ['systemes_integrations', 'configuration'],
  },
];

/** Sous-groupes mega-menu (Ventes = Phase 6 sales groups) */
export const HORIZONTAL_MEGA_SUBGROUPS: Partial<
  Record<string, Pick<ContextSidebarGroupConfig, 'groupKey' | 'defaultLabel' | 'paths'>[]>
> = {
  ventes_logistique: PHASE6_CONTEXT_CONFIGS.sales.groups,
  finance_paiements: [
    {
      groupKey: 'encaissements',
      defaultLabel: 'Encaissements',
      paths: [
        '/dashboard/payments',
        '/dashboard/payments-customers',
        '/dashboard/payment-management',
        '/dashboard/pay-balance',
        '/dashboard/withdrawals',
      ],
    },
    {
      groupKey: 'fiscalite',
      defaultLabel: 'Fiscalité & moyens',
      paths: ['/dashboard/taxes', '/dashboard/payment-methods', '/dashboard/payment-connections'],
    },
  ],
  produits_cours: [
    {
      groupKey: 'catalogue',
      defaultLabel: 'Catalogue',
      paths: [
        '/dashboard/products',
        '/dashboard/digital-products',
        '/dashboard/my-courses',
        '/dashboard/auctions',
        '/dashboard/portfolios',
      ],
    },
    {
      groupKey: 'cours',
      defaultLabel: 'Cours & contenu',
      paths: [
        '/dashboard/courses/live-sessions',
        '/dashboard/courses/assignments',
        '/dashboard/cohorts',
        '/dashboard/reviews',
      ],
    },
    {
      groupKey: 'digital_ops',
      defaultLabel: 'Digital',
      paths: [
        '/dashboard/my-licenses',
        '/dashboard/license-management',
        '/dashboard/digital-products/bundles',
        '/dashboard/my-downloads',
        '/dashboard/digital/updates',
      ],
    },
  ],
  marketing_croissance: [
    {
      groupKey: 'campagnes',
      defaultLabel: 'Campagnes',
      paths: [
        '/dashboard/marketing',
        '/dashboard/promotions',
        '/dashboard/coupons',
        '/dashboard/abandoned-carts',
        '/dashboard/emails/campaigns',
      ],
    },
    {
      groupKey: 'email_automation',
      defaultLabel: 'Email & automation',
      paths: [
        '/dashboard/emails/sequences',
        '/dashboard/emails/segments',
        '/dashboard/emails/workflows',
        '/dashboard/emails/analytics',
        '/dashboard/emails/tags',
        '/dashboard/emails/templates/editor',
      ],
    },
    {
      groupKey: 'croissance',
      defaultLabel: 'Croissance',
      paths: [
        '/dashboard/customers',
        '/dashboard/referrals',
        '/dashboard/affiliates',
        '/dashboard/store-affiliates',
        '/dashboard/gamification',
        '/dashboard/promotions/stats',
      ],
    },
  ],
};

/** Sous-groupes mega-menu acheteur */
export const BUYER_HORIZONTAL_MEGA_SUBGROUPS: Partial<
  Record<string, Pick<ContextSidebarGroupConfig, 'groupKey' | 'defaultLabel' | 'paths'>[]>
> = {
  decouvrir: [
    {
      groupKey: 'boutique',
      defaultLabel: 'Boutique',
      paths: ['/marketplace', '/auctions'],
    },
    {
      groupKey: 'recommandations_ia',
      defaultLabel: 'Pour vous',
      paths: [
        '/recommendations',
        '/discover',
        '/trending',
        '/recommendations/history-based',
        '/personalization/quiz',
        '/personalization/recommendations',
      ],
    },
  ],
  achats: [
    {
      groupKey: 'commandes',
      defaultLabel: 'Commandes',
      paths: ['/account/orders', '/account/returns', '/cart'],
    },
    {
      groupKey: 'facturation',
      defaultLabel: 'Facturation',
      paths: ['/account/invoices', '/account/gift-cards', '/account/warranties'],
    },
  ],
  portails: [
    {
      groupKey: 'mon_portail_digital',
      defaultLabel: 'Digital',
      paths: ['/account/downloads', '/account/digital'],
    },
    {
      groupKey: 'produits_physiques',
      defaultLabel: 'Physique',
      paths: ['/account/physical'],
    },
    {
      groupKey: 'mes_cours',
      defaultLabel: 'Cours',
      paths: ['/account/courses'],
    },
  ],
};

const SELLER_HORIZONTAL_PREFIXES = ['/dashboard', '/vendor', '/affiliate', '/notifications'];

export function shouldShowSellerHorizontalNav(pathname: string): boolean {
  return SELLER_HORIZONTAL_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowBuyerHorizontalNav(pathname: string): boolean {
  if (pathname === '/account' || pathname.startsWith('/account/')) return true;
  return pathname.startsWith('/checkout/multi-store');
}

export function shouldShowHorizontalNav(pathname: string): boolean {
  return shouldShowSellerHorizontalNav(pathname) || shouldShowBuyerHorizontalNav(pathname);
}

export function resolveHorizontalNavPersona(
  pathname: string,
  preferredPersona: SidebarPersona = 'seller'
): 'seller' | 'buyer' {
  const isNotificationPath =
    pathname === '/notifications' ||
    pathname.startsWith('/notifications/') ||
    pathname === '/settings/notifications' ||
    pathname.startsWith('/settings/notifications/');

  if (isNotificationPath) {
    return preferredPersona === 'buyer' ? 'buyer' : 'seller';
  }

  if (shouldShowBuyerHorizontalNav(pathname)) return 'buyer';
  return 'seller';
}
