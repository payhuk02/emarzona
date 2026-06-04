import { useMemo } from 'react';
import { useStoreFooterT } from '@/hooks/useStoreFooterT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { STORE_FOOTER_PAGE_ID } from '@/lib/admin/storeFooterCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import {
  STORE_FOOTER_NAV_LINKS,
  STORE_FOOTER_LEGAL_LABELS,
  resolveFooterLinkType,
  type ResolvedStoreFooterLink,
} from '@/lib/admin/storeFooterLinksConfig';
import type { StoreLegalPages } from '@/hooks/useStores';
import { generateStoreUrl } from '@/lib/store-utils';

export function useStoreFooterLinks(options: {
  storeSlug?: string;
  subdomain?: string | null;
  legalPages?: StoreLegalPages | null;
}) {
  const { t } = useStoreFooterT();
  const { pageCustomization } = usePageCustomization(STORE_FOOTER_PAGE_ID);
  const { storeSlug, subdomain, legalPages } = options;

  const navLinks = useMemo(
    () =>
      STORE_FOOTER_NAV_LINKS.map(link => {
        const href =
          getPageCustomizationValue(pageCustomization as Record<string, unknown>, link.hrefKey) ??
          link.defaultHref;
        return {
          linkKey: link.linkKey,
          label: t(link.labelKey),
          href,
          type: resolveFooterLinkType(href),
        } satisfies ResolvedStoreFooterLink;
      }),
    [pageCustomization, t]
  );

  const legalLinks = useMemo(() => {
    const baseUrl = storeSlug ? generateStoreUrl(storeSlug, subdomain) : '';
    return STORE_FOOTER_LEGAL_LABELS.filter(item => legalPages?.[item.legalField]).map(item => ({
      linkKey: item.legalKey,
      label: t(item.labelKey),
      href: baseUrl ? `${baseUrl}/legal/${item.path}` : `#${item.path}`,
      type: 'route' as const,
    }));
  }, [legalPages, storeSlug, subdomain, t]);

  const sectionTitles = useMemo(
    () => ({
      links: t('linksTitle'),
      legal: t('legal'),
      location: t('location'),
      followUs: t('followUs'),
    }),
    [t]
  );

  const locationItems = useMemo(
    () => [
      { key: 'africa', label: t('africa'), icon: '🌍' },
      { key: 'french', label: t('french'), icon: '🗣️' },
      { key: 'multiCurrency', label: t('multiCurrency'), icon: '💰' },
    ],
    [t]
  );

  return { navLinks, legalLinks, sectionTitles, locationItems };
}
