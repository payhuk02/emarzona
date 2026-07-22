/**
 * Navigation horizontale contextuelle (mega-menu) — style Systeme.io / enterprise SaaS.
 * Les sections Principal / Mon Compte restent dans AppSidebar compact.
 */

import { PHASE6_CONTEXT_CONFIGS } from '@/config/navigation.context.phase6';
import type { ContextSidebarGroupConfig } from '@/config/navigation.context.types';
import {
  BUYER_DISCOVERY_PATHS,
  isBuyerDiscoveryPath,
  resolveNavPersona,
  toCommerceNavPersona,
} from '@/config/navigation.persona';
import type { SidebarPersona } from '@/config/navigation.types';

export { BUYER_DISCOVERY_PATHS, isBuyerDiscoveryPath };

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

/** Ordre des domaines dans la barre horizontale vendeur */
export const SELLER_HORIZONTAL_NAV_SECTIONS: HorizontalNavSectionSpec[] = [
  {
    domainKey: 'produits_cours',
    sectionKey: 'produits_cours',
    shortLabelKey: 'sidebar.chrome.sellerNavProduits',
    shortLabel: 'Produits',
    rootPath: '/dashboard/products',
  },
  {
    domainKey: 'ventes',
    sectionKey: 'ventes_logistique',
    shortLabelKey: 'sidebar.chrome.sellerNavVentes',
    shortLabel: 'Ventes',
    rootPath: '/dashboard/orders',
  },
  {
    domainKey: 'logistique',
    sectionKey: 'ventes_logistique',
    shortLabelKey: 'sidebar.chrome.sellerNavLogistique',
    shortLabel: 'Logistique',
    rootPath: '/dashboard/inventory',
  },
  {
    domainKey: 'finance_paiements',
    sectionKey: 'finance_paiements',
    shortLabelKey: 'sidebar.chrome.sellerNavFinance',
    shortLabel: 'Finance',
    rootPath: '/dashboard/payments',
  },
  {
    domainKey: 'marketing_croissance',
    sectionKey: 'marketing_croissance',
    shortLabelKey: 'sidebar.chrome.sellerNavMarketing',
    shortLabel: 'Marketing',
    rootPath: '/dashboard/marketing',
  },
  {
    domainKey: 'analytics_seo',
    sectionKey: 'analytics_seo',
    shortLabelKey: 'sidebar.chrome.sellerNavAnalytics',
    shortLabel: 'Analytics',
    rootPath: '/dashboard/analytics',
  },
  {
    domainKey: 'recommandations_ia',
    sectionKey: 'recommandations_ia',
    shortLabelKey: 'sidebar.chrome.sellerNavIA',
    shortLabel: 'IA',
    rootPath: '/dashboard/ai-chatbot',
  },
  {
    domainKey: 'systemes_integrations',
    sectionKey: 'systemes_integrations',
    shortLabelKey: 'sidebar.chrome.sellerNavSystemes',
    shortLabel: 'Systèmes',
    rootPath: '/dashboard/integrations',
  },
  {
    domainKey: 'configuration',
    sectionKey: 'configuration',
    shortLabelKey: 'sidebar.chrome.sellerNavParametres',
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
  ventes: PHASE6_CONTEXT_CONFIGS.sales.groups.filter(g =>
    ['commandes_clients', 'services_reservations'].includes(g.groupKey)
  ),
  logistique: PHASE6_CONTEXT_CONFIGS.sales.groups.filter(g =>
    ['logistique_inventaire', 'optimisation', 'produits_physiques'].includes(g.groupKey)
  ),
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
        '/dashboard/courses',
        '/dashboard/artist-products',
        '/dashboard/auctions',
        '/dashboard/portfolios',
      ],
    },
    {
      groupKey: 'digital',
      defaultLabel: 'Produits Digitaux',
      paths: [
        '/dashboard/digital-products',
        '/dashboard/my-licenses',
        '/dashboard/license-management',
        '/dashboard/digital-products/bundles',
        '/dashboard/my-downloads',
        '/dashboard/digital/updates',
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
      paths: ['/account/orders', '/account/returns'],
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

function matchesNavPath(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function shouldShowSellerHorizontalNav(pathname: string): boolean {
  return SELLER_HORIZONTAL_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function shouldShowBuyerHorizontalNav(pathname: string): boolean {
  if (matchesNavPath(pathname, '/account')) return true;
  if (isBuyerDiscoveryPath(pathname)) return true;
  return false;
}

const BOTTOM_NAV_AUTH_PATHS = new Set(['/login', '/register', '/auth']);

/** Affiche la bottom-nav mobile globale (exclut checkout, admin, landing, auth). */
export function shouldShowBottomNavigation(pathname: string): boolean {
  if (pathname === '/') return false;
  if (BOTTOM_NAV_AUTH_PATHS.has(pathname)) return false;
  if (matchesNavPath(pathname, '/checkout')) return false;
  if (matchesNavPath(pathname, '/admin')) return false;
  return true;
}

export function shouldShowHorizontalNav(pathname: string): boolean {
  return shouldShowSellerHorizontalNav(pathname) || shouldShowBuyerHorizontalNav(pathname);
}

/**
 * Persona horizontale/bottom — alignée sur resolveNavPersona (zones path + pin).
 * `preferredPersona` = pin sidebar (ou persona déjà résolue sur routes soft).
 */
export function resolveHorizontalNavPersona(
  pathname: string,
  preferredPersona: SidebarPersona = 'seller',
  isAdmin = preferredPersona === 'admin'
): 'seller' | 'buyer' {
  return toCommerceNavPersona(resolveNavPersona(pathname, isAdmin, preferredPersona));
}
