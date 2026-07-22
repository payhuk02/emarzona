/**
 * Structure du pied de page boutique (StoreFooter).
 * Libellés : i18n storefront.footer + admin pages.storeFooter.
 * URLs navigation : ancre par défaut (#products, #about…).
 */

import { resolveFooterLinkType, type FooterLinkResolveType } from '@/lib/admin/footerLinksConfig';

export type StoreFooterNavLinkKey = 'products' | 'about' | 'reviews' | 'contact';

export interface StoreFooterNavLinkDefinition {
  linkKey: StoreFooterNavLinkKey;
  labelKey: string;
  hrefKey: string;
  defaultHref: string;
}

export interface StoreFooterLegalLabelDefinition {
  legalKey: string;
  labelKey: string;
  legalField: keyof import('@/hooks/useStores').StoreLegalPages;
  path: string;
}

export const STORE_FOOTER_NAV_LINKS: StoreFooterNavLinkDefinition[] = [
  {
    linkKey: 'products',
    labelKey: 'links.products',
    hrefKey: 'links.products.href',
    defaultHref: '#products',
  },
  {
    linkKey: 'about',
    labelKey: 'links.about',
    hrefKey: 'links.about.href',
    defaultHref: '#about',
  },
  {
    linkKey: 'reviews',
    labelKey: 'links.reviews',
    hrefKey: 'links.reviews.href',
    defaultHref: '#reviews',
  },
  {
    linkKey: 'contact',
    labelKey: 'links.contact',
    hrefKey: 'links.contact.href',
    defaultHref: '#contact',
  },
];

export const STORE_FOOTER_LEGAL_LABELS: StoreFooterLegalLabelDefinition[] = [
  { legalKey: 'terms', labelKey: 'terms', legalField: 'terms_of_service', path: 'terms' },
  { legalKey: 'privacy', labelKey: 'privacy', legalField: 'privacy_policy', path: 'privacy' },
  { legalKey: 'returns', labelKey: 'returnPolicy', legalField: 'return_policy', path: 'returns' },
  {
    legalKey: 'shipping',
    labelKey: 'shippingPolicy',
    legalField: 'shipping_policy',
    path: 'shipping',
  },
  { legalKey: 'refund', labelKey: 'refund', legalField: 'refund_policy', path: 'refund' },
  { legalKey: 'cookies', labelKey: 'cookiePolicy', legalField: 'cookie_policy', path: 'cookies' },
  {
    legalKey: 'disclaimer',
    labelKey: 'disclaimer',
    legalField: 'disclaimer',
    path: 'disclaimer',
  },
  { legalKey: 'faq', labelKey: 'faq', legalField: 'faq_content', path: 'faq' },
];

/** True when a legal page field has publishable content (non-empty after trim). */
export function hasLegalPageContent(
  legalPages: import('@/hooks/useStores').StoreLegalPages | null | undefined,
  field: keyof import('@/hooks/useStores').StoreLegalPages
): boolean {
  const value = legalPages?.[field];
  return typeof value === 'string' && value.trim().length > 0;
}

export function listConfiguredLegalFooterLinks(
  legalPages: import('@/hooks/useStores').StoreLegalPages | null | undefined
): StoreFooterLegalLabelDefinition[] {
  return STORE_FOOTER_LEGAL_LABELS.filter(item => hasLegalPageContent(legalPages, item.legalField));
}

export interface ResolvedStoreFooterLink {
  linkKey: string;
  label: string;
  href: string;
  type: FooterLinkResolveType;
}

export { resolveFooterLinkType };
