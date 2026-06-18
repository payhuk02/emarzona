/**
 * Page index blog plateforme (/blog) — métadonnées et personnalisation admin.
 */

import { Newspaper } from 'lucide-react';
import type { PageConfig } from '@/components/admin/customization/pages/types';

export const PLATFORM_BLOG_PAGE_ID = 'platformBlog';
export const PLATFORM_BLOG_ROUTE = '/blog';

export const PLATFORM_BLOG_DEFAULTS = {
  title: 'Blog Emarzona',
  subtitle:
    'Conseils e-commerce, guides vendeurs, études de cas et nouveautés produit pour développer votre activité en ligne.',
  seoTitle: 'Blog e-commerce | Emarzona',
  seoDescription:
    'Articles Emarzona : lancer une boutique, optimiser le SEO, panier multi-types, paiements Moneroo et croissance en Afrique.',
  seoKeywords:
    'blog Emarzona, e-commerce Afrique, conseils vendeur, boutique en ligne, marketing digital',
} as const;

export const PLATFORM_BLOG_DEFAULTS_EN = {
  title: 'Emarzona Blog',
  subtitle:
    'E-commerce tips, seller guides, case studies and product updates to grow your online business.',
  seoTitle: 'E-commerce blog | Emarzona',
  seoDescription:
    'Emarzona articles: launch a store, SEO, multi-type cart, Moneroo payments and growth in Africa.',
  seoKeywords: 'Emarzona blog, e-commerce Africa, seller tips, online store, digital marketing',
} as const;

export function getPlatformBlogLocaleDefaults(locale: 'fr' | 'en') {
  return locale === 'en' ? PLATFORM_BLOG_DEFAULTS_EN : PLATFORM_BLOG_DEFAULTS;
}

export function buildPlatformBlogPageConfig(): PageConfig {
  return {
    id: PLATFORM_BLOG_PAGE_ID,
    name: 'Blog plateforme',
    route: PLATFORM_BLOG_ROUTE,
    description:
      'Titre, sous-titre et SEO de la page index blog (/blog). Les articles sont gérés dans Admin > Blog plateforme.',
    icon: Newspaper,
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
            key: `${PLATFORM_BLOG_PAGE_ID}.seo.title`,
            defaultValue: PLATFORM_BLOG_DEFAULTS.seoTitle,
          },
          {
            id: 'seo.description',
            label: 'Description SEO',
            type: 'textarea',
            key: `${PLATFORM_BLOG_PAGE_ID}.seo.description`,
            defaultValue: PLATFORM_BLOG_DEFAULTS.seoDescription,
          },
          {
            id: 'seo.keywords',
            label: 'Mots-clés SEO',
            type: 'text',
            key: `${PLATFORM_BLOG_PAGE_ID}.seo.keywords`,
            defaultValue: PLATFORM_BLOG_DEFAULTS.seoKeywords,
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
            key: `${PLATFORM_BLOG_PAGE_ID}.content.title`,
            defaultValue: PLATFORM_BLOG_DEFAULTS.title,
          },
          {
            id: 'content.subtitle',
            label: 'Sous-titre',
            type: 'textarea',
            key: `${PLATFORM_BLOG_PAGE_ID}.content.subtitle`,
            defaultValue: PLATFORM_BLOG_DEFAULTS.subtitle,
          },
        ],
      },
    ],
  };
}
