import { useMemo } from 'react';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { normalizeContentForDisplay } from '@/lib/content/plain-text-content';
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
    body = normalizeContentForDisplay(body);

    if (meta.slug === 'contact' && !body.includes(contactEmail)) {
      body = `E-mail général : ${contactEmail}\n\n${body}`;
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
