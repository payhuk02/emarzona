/**
 * Navigation horizontale contextuelle (mega-menu) — style Systeme.io / enterprise SaaS.
 * Les sections Principal / Mon Compte restent dans AppSidebar compact.
 */

import { PHASE6_CONTEXT_CONFIGS } from '@/config/navigation.context.phase6';
import type { ContextSidebarGroupConfig } from '@/config/navigation.context.types';

export type HorizontalNavSectionSpec = {
  sectionKey: string;
  /** Libellé court dans la barre horizontale */
  shortLabel: string;
  /** Chemin racine pour lien direct si un seul item ou highlight */
  rootPath?: string;
};

/** Ordre des domaines dans la barre horizontale vendeur */
export const SELLER_HORIZONTAL_NAV_SECTIONS: HorizontalNavSectionSpec[] = [
  { sectionKey: 'produits_cours', shortLabel: 'Produits', rootPath: '/dashboard/products' },
  { sectionKey: 'ventes_logistique', shortLabel: 'Ventes', rootPath: '/dashboard/orders' },
  { sectionKey: 'finance_paiements', shortLabel: 'Finance', rootPath: '/dashboard/payments' },
  {
    sectionKey: 'marketing_croissance',
    shortLabel: 'Marketing',
    rootPath: '/dashboard/marketing',
  },
  { sectionKey: 'analytics_seo', shortLabel: 'Analytics', rootPath: '/dashboard/analytics' },
  { sectionKey: 'recommandations_ia', shortLabel: 'IA', rootPath: '/dashboard/ai-chatbot' },
  {
    sectionKey: 'systemes_integrations',
    shortLabel: 'Systèmes',
    rootPath: '/dashboard/integrations',
  },
  { sectionKey: 'configuration', shortLabel: 'Paramètres', rootPath: '/dashboard/settings' },
];

/** Sous-groupes mega-menu (Ventes = Phase 6 sales groups) */
export const HORIZONTAL_MEGA_SUBGROUPS: Partial<
  Record<string, Pick<ContextSidebarGroupConfig, 'groupKey' | 'defaultLabel' | 'paths'>[]>
> = {
  ventes_logistique: PHASE6_CONTEXT_CONFIGS.sales.groups,
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

const SELLER_HORIZONTAL_PREFIXES = ['/dashboard', '/vendor', '/affiliate', '/notifications'];

export function shouldShowSellerHorizontalNav(pathname: string): boolean {
  return SELLER_HORIZONTAL_PREFIXES.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
