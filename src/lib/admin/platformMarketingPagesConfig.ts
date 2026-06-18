/**
 * Pages marketing liées au pied de page (contenu éditable depuis Admin > Personnalisation > Pages).
 */

import { Building2, Briefcase, FileText, HelpCircle, Mail, Newspaper, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageConfig } from '@/components/admin/customization/pages/types';
import { MARKETING_PAGE_BODIES } from '@/lib/admin/platformFooterPageDefaults';

export interface PlatformMarketingPageMeta {
  slug: string;
  pageId: string;
  route: string;
  name: string;
  icon: LucideIcon;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBody: string;
}

export const PLATFORM_MARKETING_PAGES: PlatformMarketingPageMeta[] = [
  {
    slug: 'about',
    pageId: 'platformAbout',
    route: '/about',
    name: 'À propos',
    icon: Building2,
    defaultTitle: "À propos d'Emarzona",
    defaultSubtitle:
      'La plateforme e-commerce tout-en-un pour vendre, gérer et développer votre activité en ligne.',
    defaultBody: MARKETING_PAGE_BODIES.about,
  },
  {
    slug: 'contact',
    pageId: 'platformContact',
    route: '/contact',
    name: 'Contact',
    icon: Mail,
    defaultTitle: 'Contactez-nous',
    defaultSubtitle: 'Notre équipe vous répond sous 24 à 48 h ouvrées.',
    defaultBody: MARKETING_PAGE_BODIES.contact,
  },
  {
    slug: 'careers',
    pageId: 'platformCareers',
    route: '/careers',
    name: 'Carrières',
    icon: Briefcase,
    defaultTitle: 'Carrières',
    defaultSubtitle:
      'Rejoignez une équipe qui construit le commerce de demain en Afrique et dans le monde.',
    defaultBody: MARKETING_PAGE_BODIES.careers,
  },
  {
    slug: 'press',
    pageId: 'platformPress',
    route: '/press',
    name: 'Presse',
    icon: Newspaper,
    defaultTitle: 'Espace presse',
    defaultSubtitle: 'Communiqués, ressources médias et contacts presse.',
    defaultBody: MARKETING_PAGE_BODIES.press,
  },
  {
    slug: 'blog',
    pageId: 'platformBlog',
    route: '/blog',
    name: 'Blog',
    icon: FileText,
    defaultTitle: 'Blog Emarzona',
    defaultSubtitle: 'Conseils e-commerce, études de cas et nouveautés produit.',
    defaultBody: MARKETING_PAGE_BODIES.blog,
  },
  {
    slug: 'docs',
    pageId: 'platformDocs',
    route: '/docs',
    name: 'Documentation',
    icon: FileText,
    defaultTitle: 'Documentation',
    defaultSubtitle: 'Guides pour démarrer, vendre et optimiser votre boutique.',
    defaultBody: MARKETING_PAGE_BODIES.docs,
  },
  {
    slug: 'help',
    pageId: 'platformHelp',
    route: '/help',
    name: "Centre d'aide",
    icon: HelpCircle,
    defaultTitle: "Centre d'aide",
    defaultSubtitle: 'FAQ, tutoriels et assistance pour vendeurs et acheteurs.',
    defaultBody: MARKETING_PAGE_BODIES.help,
  },
  {
    slug: 'integrations',
    pageId: 'platformIntegrations',
    route: '/integrations',
    name: 'Intégrations',
    icon: Plug,
    defaultTitle: 'Intégrations',
    defaultSubtitle: 'Paiements, logistique, marketing et outils connectés à Emarzona.',
    defaultBody: MARKETING_PAGE_BODIES.integrations,
  },
];

export function getPlatformMarketingPageBySlug(
  slug: string
): PlatformMarketingPageMeta | undefined {
  return PLATFORM_MARKETING_PAGES.find(p => p.slug === slug);
}

export function buildPlatformMarketingPageConfigs(): PageConfig[] {
  return PLATFORM_MARKETING_PAGES.map(page => ({
    id: page.pageId,
    name: page.name,
    route: page.route,
    description: `Contenu de la page ${page.name} (pied de page / navigation)`,
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
            defaultValue: `${page.defaultTitle} | Emarzona`,
          },
          {
            id: 'seo.description',
            label: 'Description SEO',
            type: 'textarea' as const,
            key: `${page.pageId}.seo.description`,
            defaultValue: page.defaultSubtitle,
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
