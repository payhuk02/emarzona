import { useMemo } from 'react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import {
  FOOTER_COLUMNS,
  FOOTER_LEGAL_LINKS,
  FOOTER_SOCIAL_NETWORKS,
  resolveFooterLinkType,
  type FooterLinkResolveType,
} from '@/lib/admin/footerLinksConfig';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, type LucideIcon } from 'lucide-react';

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
};

const SOCIAL_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  twitter: 'X',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
};

export interface ResolvedFooterLink {
  linkKey: string;
  label: string;
  href: string;
  type: FooterLinkResolveType;
}

export interface ResolvedFooterSocial {
  network: string;
  label: string;
  href: string;
  icon: LucideIcon;
}

export function useFooterLinks() {
  const { t } = useLandingPremiumT();
  const { pageCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);

  const getHref = (hrefKey: string, defaultHref: string): string => {
    return (
      getPageCustomizationValue(pageCustomization as Record<string, unknown>, hrefKey) ??
      defaultHref
    );
  };

  const columns = useMemo(
    () =>
      FOOTER_COLUMNS.map(col => ({
        colKey: col.colKey,
        title: t(`footer.columns.${col.colKey}.title`),
        links: col.links.map(link => {
          const href = getHref(link.hrefKey, link.defaultHref);
          return {
            linkKey: link.linkKey,
            label: t(link.labelKey),
            href,
            type: resolveFooterLinkType(href),
          } satisfies ResolvedFooterLink;
        }),
      })),
    [pageCustomization, t]
  );

  const legalLinks = useMemo(
    () =>
      FOOTER_LEGAL_LINKS.map(link => {
        const href = getHref(link.hrefKey, link.defaultHref);
        return {
          linkKey: link.linkKey,
          label: t(link.labelKey),
          href,
          type: resolveFooterLinkType(href),
        } satisfies ResolvedFooterLink;
      }),
    [pageCustomization, t]
  );

  const socials = useMemo(() => {
    const result: ResolvedFooterSocial[] = [];
    for (const s of FOOTER_SOCIAL_NETWORKS) {
      const href = getHref(s.hrefKey, s.defaultHref).trim();
      if (!href) continue;
      const icon = SOCIAL_ICONS[s.network];
      if (!icon) continue;
      result.push({
        network: s.network,
        label: SOCIAL_LABELS[s.network] ?? s.network,
        href,
        icon,
      });
    }
    return result;
  }, [pageCustomization]);

  const contactEmail =
    getPageCustomizationValue(
      pageCustomization as Record<string, unknown>,
      'footer.contactEmail'
    ) ?? 'contact@emarzona.com';

  return { columns, legalLinks, socials, contactEmail };
}
