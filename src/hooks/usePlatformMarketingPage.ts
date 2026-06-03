import { useMemo } from 'react';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import type { PlatformMarketingPageMeta } from '@/lib/admin/platformMarketingPagesConfig';

export function usePlatformMarketingPage(meta: PlatformMarketingPageMeta) {
  const { pageCustomization } = usePageCustomization(meta.pageId);
  const { pageCustomization: landingCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);

  return useMemo(() => {
    const data = pageCustomization as Record<string, unknown>;
    const read = (suffix: string, fallback: string) =>
      getPageCustomizationValue(data, `${meta.pageId}.${suffix}`) ??
      getPageCustomizationValue(data, suffix) ??
      fallback;

    const contactEmail =
      getPageCustomizationValue(
        landingCustomization as Record<string, unknown>,
        'footer.contactEmail'
      ) ?? 'contact@emarzona.com';

    let body = read('content.body', meta.defaultBody);
    if (meta.slug === 'contact') {
      const emailHref = `mailto:${contactEmail}`;
      if (!body.includes(contactEmail)) {
        body = `<p><strong>E-mail général :</strong> <a href="${emailHref}">${contactEmail}</a></p>${body}`;
      }
    }

    return {
      title: read('content.title', meta.defaultTitle),
      subtitle: read('content.subtitle', meta.defaultSubtitle),
      body,
      seoTitle: read('seo.title', `${meta.defaultTitle} | Emarzona`),
      seoDescription: read('seo.description', meta.defaultSubtitle),
    };
  }, [pageCustomization, landingCustomization, meta]);
}
