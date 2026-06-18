/**
 * Pages légales liées au pied de page (contenu éditable depuis Admin > Personnalisation > Pages).
 */

import { Cookie, FileText, RefreshCw, Shield, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageConfig } from '@/components/admin/customization/pages/types';
import type { LegalDocumentType } from '@/types/legal';
import { LEGAL_PAGE_BODIES } from '@/lib/admin/platformFooterPageDefaults';

export interface PlatformLegalPageMeta {
  documentType: LegalDocumentType;
  pageId: string;
  route: string;
  name: string;
  icon: LucideIcon;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBody: string;
  defaultSeoDescription: string;
}

export const PLATFORM_LEGAL_PAGES: PlatformLegalPageMeta[] = [
  {
    documentType: 'terms',
    pageId: 'platformLegalTerms',
    route: '/legal/terms',
    name: "Conditions d'utilisation",
    icon: FileText,
    defaultTitle: "Conditions Générales d'Utilisation",
    defaultSubtitle: 'Règles, droits et obligations des utilisateurs de la plateforme Emarzona.',
    defaultBody: LEGAL_PAGE_BODIES.terms,
    defaultSeoDescription:
      "Conditions générales d'utilisation de la plateforme Emarzona. Règles, droits et obligations des utilisateurs vendeurs et acheteurs.",
  },
  {
    documentType: 'sales',
    pageId: 'platformLegalSales',
    route: '/legal/cgv',
    name: 'Conditions générales de vente',
    icon: ShoppingBag,
    defaultTitle: 'Conditions Générales de Vente',
    defaultSubtitle: 'Modalités applicables aux achats réalisés sur la plateforme Emarzona.',
    defaultBody: LEGAL_PAGE_BODIES.sales,
    defaultSeoDescription:
      'Conditions générales de vente Emarzona : prix, commande, livraison, rétractation et responsabilités.',
  },
  {
    documentType: 'privacy',
    pageId: 'platformLegalPrivacy',
    route: '/legal/privacy',
    name: 'Politique de confidentialité',
    icon: Shield,
    defaultTitle: 'Politique de Confidentialité',
    defaultSubtitle:
      'Comment Emarzona collecte, utilise et protège vos données personnelles (RGPD).',
    defaultBody: LEGAL_PAGE_BODIES.privacy,
    defaultSeoDescription:
      'Politique de confidentialité Emarzona : collecte, utilisation et protection de vos données personnelles conformément au RGPD.',
  },
  {
    documentType: 'cookies',
    pageId: 'platformLegalCookies',
    route: '/legal/cookies',
    name: 'Politique des cookies',
    icon: Cookie,
    defaultTitle: 'Politique des Cookies',
    defaultSubtitle: 'Types de cookies utilisés, finalités et gestion de vos préférences.',
    defaultBody: LEGAL_PAGE_BODIES.cookies,
    defaultSeoDescription:
      'Politique des cookies Emarzona : types de cookies utilisés, finalités, durée de conservation et gestion des préférences.',
  },
  {
    documentType: 'refund',
    pageId: 'platformLegalRefund',
    route: '/legal/refund',
    name: 'Politique de remboursement',
    icon: RefreshCw,
    defaultTitle: 'Politique de Remboursement',
    defaultSubtitle: 'Conditions et procédures de remboursement pour les achats sur Emarzona.',
    defaultBody: LEGAL_PAGE_BODIES.refund,
    defaultSeoDescription:
      'Politique de remboursement Emarzona : conditions, délais et procédure pour demander un remboursement.',
  },
];

export function getPlatformLegalPageByType(
  type: LegalDocumentType
): PlatformLegalPageMeta | undefined {
  return PLATFORM_LEGAL_PAGES.find(p => p.documentType === type);
}

export function getPlatformLegalPageByRoute(route: string): PlatformLegalPageMeta | undefined {
  return PLATFORM_LEGAL_PAGES.find(p => p.route === route);
}

export function buildPlatformLegalPageConfigs(): PageConfig[] {
  return PLATFORM_LEGAL_PAGES.map(page => ({
    id: page.pageId,
    name: page.name,
    route: page.route,
    description: `Contenu légal : ${page.name} (pied de page)`,
    icon: page.icon,
    sections: [
      {
        id: 'seo',
        name: 'SEO',
        type: 'content' as const,
        elements: [
          {
            id: 'seo.title',
            label: 'Titre SEO',
            type: 'text' as const,
            key: `${page.pageId}.seo.title`,
            defaultValue: page.defaultTitle,
          },
          {
            id: 'seo.description',
            label: 'Description SEO',
            type: 'textarea' as const,
            key: `${page.pageId}.seo.description`,
            defaultValue: page.defaultSeoDescription,
          },
        ],
      },
      {
        id: 'content',
        name: 'Contenu',
        type: 'content' as const,
        elements: [
          {
            id: 'content.title',
            label: 'Titre de page',
            type: 'text' as const,
            key: `${page.pageId}.content.title`,
            defaultValue: page.defaultTitle,
          },
          {
            id: 'content.subtitle',
            label: 'Sous-titre',
            type: 'textarea' as const,
            key: `${page.pageId}.content.subtitle`,
            defaultValue: page.defaultSubtitle,
          },
          {
            id: 'content.body',
            label: 'Corps (éditeur riche)',
            type: 'richtext' as const,
            key: `${page.pageId}.content.body`,
            defaultValue: page.defaultBody,
            description:
              'Titres, listes, liens, images, tableaux… Le contenu est mis en forme automatiquement sur la page publique.',
          },
        ],
      },
    ],
  }));
}
