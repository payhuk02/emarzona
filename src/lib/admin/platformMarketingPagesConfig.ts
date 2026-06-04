/**
 * Pages marketing liées au pied de page (contenu éditable depuis Admin > Personnalisation > Pages).
 */

import { Building2, Briefcase, FileText, HelpCircle, Mail, Newspaper, Plug } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PageConfig } from '@/components/admin/customization/pages/types';

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

const defaultBody = (title: string) =>
  `<p>Cette page est gérée depuis le panneau d'administration Emarzona (<strong>Personnalisation → Pages → ${title}</strong>). Adaptez le titre, le sous-titre et le contenu HTML selon vos besoins.</p>`;

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
    defaultBody: defaultBody('À propos'),
  },
  {
    slug: 'contact',
    pageId: 'platformContact',
    route: '/contact',
    name: 'Contact',
    icon: Mail,
    defaultTitle: 'Contactez-nous',
    defaultSubtitle: 'Notre équipe vous répond sous 24 à 48 h ouvrées.',
    defaultBody:
      '<p><strong>E-mail général :</strong> <a href="mailto:contact@emarzona.com">contact@emarzona.com</a></p><p><strong>Support :</strong> <a href="mailto:support@emarzona.com">support@emarzona.com</a></p><p><strong>Partenariats :</strong> <a href="mailto:partners@emarzona.com">partners@emarzona.com</a></p>',
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
    defaultBody: defaultBody('Carrières'),
  },
  {
    slug: 'press',
    pageId: 'platformPress',
    route: '/press',
    name: 'Presse',
    icon: Newspaper,
    defaultTitle: 'Espace presse',
    defaultSubtitle: 'Communiqués, ressources médias et contacts presse.',
    defaultBody:
      '<p><strong>Presse :</strong> <a href="mailto:press@emarzona.com">press@emarzona.com</a></p>',
  },
  {
    slug: 'blog',
    pageId: 'platformBlog',
    route: '/blog',
    name: 'Blog',
    icon: FileText,
    defaultTitle: 'Blog Emarzona',
    defaultSubtitle: 'Conseils e-commerce, études de cas et nouveautés produit.',
    defaultBody: defaultBody('Blog'),
  },
  {
    slug: 'docs',
    pageId: 'platformDocs',
    route: '/docs',
    name: 'Documentation',
    icon: FileText,
    defaultTitle: 'Documentation',
    defaultSubtitle: 'Guides pour démarrer, vendre et optimiser votre boutique.',
    defaultBody: defaultBody('Documentation'),
  },
  {
    slug: 'help',
    pageId: 'platformHelp',
    route: '/help',
    name: "Centre d'aide",
    icon: HelpCircle,
    defaultTitle: "Centre d'aide",
    defaultSubtitle: 'FAQ, tutoriels et assistance pour vendeurs et acheteurs.',
    defaultBody: defaultBody("Centre d'aide"),
  },
  {
    slug: 'integrations',
    pageId: 'platformIntegrations',
    route: '/integrations',
    name: 'Intégrations',
    icon: Plug,
    defaultTitle: 'Intégrations',
    defaultSubtitle: 'Paiements, logistique, marketing et outils connectés à Emarzona.',
    defaultBody: defaultBody('Intégrations'),
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
            label: 'Corps (HTML)',
            type: 'textarea' as const,
            key: `${page.pageId}.content.body`,
            defaultValue: page.defaultBody,
            description: 'HTML autorisé (p, h2, ul, a, strong…)',
          },
        ],
      },
    ],
  }));
}
