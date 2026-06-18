/**
 * Structure des liens du pied de page landing premium.
 * Les libellés viennent de i18n / admin (footer.columns.*).
 * Les URLs sont surchargées via pages.landingPremium (footer.links.*).
 */

export type FooterLinkKey =
  | 'features'
  | 'marketplace'
  | 'pricing'
  | 'integrations'
  | 'blog'
  | 'docs'
  | 'help'
  | 'community'
  | 'about'
  | 'contact'
  | 'careers'
  | 'press';

export type FooterColumnKey = 'product' | 'resources' | 'company';

export interface FooterLinkDefinition {
  linkKey: FooterLinkKey;
  /** Clé i18n relative (sans préfixe landingPremium) */
  labelKey: string;
  /** Clé personnalisation admin pour l'URL */
  hrefKey: string;
  defaultHref: string;
}

export interface FooterColumnDefinition {
  colKey: FooterColumnKey;
  links: FooterLinkDefinition[];
}

export const FOOTER_COLUMNS: FooterColumnDefinition[] = [
  {
    colKey: 'product',
    links: [
      {
        linkKey: 'features',
        labelKey: 'footer.columns.product.features',
        hrefKey: 'footer.links.product.features',
        defaultHref: '/#fonctionnalites',
      },
      {
        linkKey: 'marketplace',
        labelKey: 'footer.columns.product.marketplace',
        hrefKey: 'footer.links.product.marketplace',
        defaultHref: '/marketplace',
      },
      {
        linkKey: 'pricing',
        labelKey: 'footer.columns.product.pricing',
        hrefKey: 'footer.links.product.pricing',
        defaultHref: '/#tarifs',
      },
      {
        linkKey: 'integrations',
        labelKey: 'footer.columns.product.integrations',
        hrefKey: 'footer.links.product.integrations',
        defaultHref: '/integrations',
      },
    ],
  },
  {
    colKey: 'resources',
    links: [
      {
        linkKey: 'blog',
        labelKey: 'footer.columns.resources.blog',
        hrefKey: 'footer.links.resources.blog',
        defaultHref: '/blog',
      },
      {
        linkKey: 'docs',
        labelKey: 'footer.columns.resources.docs',
        hrefKey: 'footer.links.resources.docs',
        defaultHref: '/docs',
      },
      {
        linkKey: 'help',
        labelKey: 'footer.columns.resources.help',
        hrefKey: 'footer.links.resources.help',
        defaultHref: '/help',
      },
      {
        linkKey: 'community',
        labelKey: 'footer.columns.resources.community',
        hrefKey: 'footer.links.resources.community',
        defaultHref: '/community',
      },
    ],
  },
  {
    colKey: 'company',
    links: [
      {
        linkKey: 'about',
        labelKey: 'footer.columns.company.about',
        hrefKey: 'footer.links.company.about',
        defaultHref: '/about',
      },
      {
        linkKey: 'contact',
        labelKey: 'footer.columns.company.contact',
        hrefKey: 'footer.links.company.contact',
        defaultHref: '/contact',
      },
      {
        linkKey: 'careers',
        labelKey: 'footer.columns.company.careers',
        hrefKey: 'footer.links.company.careers',
        defaultHref: '/careers',
      },
      {
        linkKey: 'press',
        labelKey: 'footer.columns.company.press',
        hrefKey: 'footer.links.company.press',
        defaultHref: '/press',
      },
    ],
  },
];

export const FOOTER_LEGAL_LINKS = [
  {
    linkKey: 'terms' as const,
    labelKey: 'footer.terms',
    hrefKey: 'footer.links.legal.terms',
    defaultHref: '/legal/terms',
  },
  {
    linkKey: 'cgv' as const,
    labelKey: 'footer.cgv',
    hrefKey: 'footer.links.legal.cgv',
    defaultHref: '/legal/cgv',
  },
  {
    linkKey: 'privacy' as const,
    labelKey: 'footer.privacy',
    hrefKey: 'footer.links.legal.privacy',
    defaultHref: '/legal/privacy',
  },
  {
    linkKey: 'cookies' as const,
    labelKey: 'footer.cookies',
    hrefKey: 'footer.links.legal.cookies',
    defaultHref: '/legal/cookies',
  },
  {
    linkKey: 'refund' as const,
    labelKey: 'footer.refund',
    hrefKey: 'footer.links.legal.refund',
    defaultHref: '/legal/refund',
  },
] as const;

export const FOOTER_SOCIAL_NETWORKS = [
  { network: 'facebook', hrefKey: 'footer.social.facebook', defaultHref: '' },
  { network: 'twitter', hrefKey: 'footer.social.twitter', defaultHref: '' },
  { network: 'instagram', hrefKey: 'footer.social.instagram', defaultHref: '' },
  { network: 'linkedin', hrefKey: 'footer.social.linkedin', defaultHref: '' },
  { network: 'youtube', hrefKey: 'footer.social.youtube', defaultHref: '' },
] as const;

export type FooterLinkResolveType = 'route' | 'external' | 'anchor' | 'mailto';

export function resolveFooterLinkType(href: string): FooterLinkResolveType {
  const trimmed = href.trim();
  if (!trimmed) return 'route';
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) return 'mailto';
  if (/^https?:\/\//i.test(trimmed)) return 'external';
  if (trimmed.startsWith('#')) return 'anchor';
  if (trimmed.startsWith('/')) return 'route';
  return 'external';
}
