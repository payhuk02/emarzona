import { useMemo } from 'react';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import type { PlatformMarketingPageMeta } from '@/lib/admin/platformMarketingPagesConfig';

export function usePlatformMarketingPage(meta: PlatformMarketingPageMeta) {
  const { pageCustomization } = usePageCustomization(meta.pageId);

  return useMemo(() => {
    const data = pageCustomization as Record<string, unknown>;
    const read = (suffix: string, fallback: string) =>
      getPageCustomizationValue(data, `${meta.pageId}.${suffix}`) ??
      getPageCustomizationValue(data, suffix) ??
      fallback;

    return {
      title: read('content.title', meta.defaultTitle),
      subtitle: read('content.subtitle', meta.defaultSubtitle),
      body: read('content.body', meta.defaultBody),
      seoTitle: read('seo.title', `${meta.defaultTitle} | Emarzona`),
      seoDescription: read('seo.description', meta.defaultSubtitle),
    };
  }, [pageCustomization, meta]);
}
