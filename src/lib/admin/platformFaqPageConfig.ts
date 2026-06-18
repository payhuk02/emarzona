/**
 * Page FAQ plateforme (/faq) — métadonnées et personnalisation admin (SEO + en-tête).
 */

import { CircleHelp } from 'lucide-react';
import type { PageConfig } from '@/components/admin/customization/pages/types';

export const PLATFORM_FAQ_PAGE_ID = 'platformFaq';
export const PLATFORM_FAQ_ROUTE = '/faq';

export const PLATFORM_FAQ_DEFAULTS = {
  title: 'Foire aux questions',
  subtitle:
    'Réponses structurées pour vendeurs et acheteurs : boutique, paiements, livraison, cours et produits digitaux.',
  seoTitle: 'FAQ — Questions fréquentes | Emarzona',
  seoDescription:
    'Toutes les réponses sur Emarzona : créer une boutique, vendre en ligne (digital, physique, services, cours, artiste), paiements Moneroo, livraison FedEx et compte acheteur.',
  seoKeywords:
    'Emarzona FAQ, e-commerce Afrique, boutique en ligne, Moneroo, cours en ligne, produits digitaux, livraison FedEx, commission vendeur',
  heroCtaHelp: "Centre d'aide",
  heroCtaContact: 'Nous contacter',
} as const;

export const PLATFORM_FAQ_DEFAULTS_EN = {
  title: 'Frequently asked questions',
  subtitle:
    'Structured answers for sellers and buyers: store setup, payments, shipping, courses and digital products.',
  seoTitle: 'FAQ — Frequently asked questions | Emarzona',
  seoDescription:
    'Answers about Emarzona: launch a store, sell online (digital, physical, services, courses, artist), Moneroo payments, FedEx shipping and buyer accounts.',
  seoKeywords:
    'Emarzona FAQ, e-commerce Africa, online store, Moneroo, online courses, digital products, FedEx shipping, seller commission',
} as const;

export function getPlatformFaqLocaleDefaults(locale: 'fr' | 'en') {
  return locale === 'en' ? PLATFORM_FAQ_DEFAULTS_EN : PLATFORM_FAQ_DEFAULTS;
}

export function buildPlatformFaqPageConfig(): PageConfig {
  return {
    id: PLATFORM_FAQ_PAGE_ID,
    name: 'FAQ plateforme',
    route: PLATFORM_FAQ_ROUTE,
    description:
      'Titre, sous-titre et SEO de la page FAQ (/faq). Les questions sont gérées dans Admin > FAQ plateforme.',
    icon: CircleHelp,
    sections: [
      {
        id: 'seo',
        name: 'SEO',
        type: 'content',
        elements: [
          {
            id: 'seo.title',
            label: 'Titre SEO',
            type: 'text',
            key: `${PLATFORM_FAQ_PAGE_ID}.seo.title`,
            defaultValue: PLATFORM_FAQ_DEFAULTS.seoTitle,
          },
          {
            id: 'seo.description',
            label: 'Description SEO',
            type: 'textarea',
            key: `${PLATFORM_FAQ_PAGE_ID}.seo.description`,
            defaultValue: PLATFORM_FAQ_DEFAULTS.seoDescription,
          },
          {
            id: 'seo.keywords',
            label: 'Mots-clés SEO',
            type: 'text',
            key: `${PLATFORM_FAQ_PAGE_ID}.seo.keywords`,
            defaultValue: PLATFORM_FAQ_DEFAULTS.seoKeywords,
            description: 'Séparés par des virgules — utilisés dans les meta keywords.',
          },
        ],
      },
      {
        id: 'content',
        name: 'En-tête de page',
        type: 'content',
        elements: [
          {
            id: 'content.title',
            label: 'Titre affiché',
            type: 'text',
            key: `${PLATFORM_FAQ_PAGE_ID}.content.title`,
            defaultValue: PLATFORM_FAQ_DEFAULTS.title,
          },
          {
            id: 'content.subtitle',
            label: 'Sous-titre',
            type: 'textarea',
            key: `${PLATFORM_FAQ_PAGE_ID}.content.subtitle`,
            defaultValue: PLATFORM_FAQ_DEFAULTS.subtitle,
          },
        ],
      },
    ],
  };
}
