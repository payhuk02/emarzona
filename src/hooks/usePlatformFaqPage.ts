import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import {
  getPlatformFaqLocaleDefaults,
  PLATFORM_FAQ_PAGE_ID,
} from '@/lib/admin/platformFaqPageConfig';
import { resolvePlatformFaqLocale } from '@/lib/platform/platformFaqLocale';

export function usePlatformFaqPage() {
  const { pageCustomization } = usePageCustomization(PLATFORM_FAQ_PAGE_ID);
  const { i18n } = useTranslation();
  const locale = resolvePlatformFaqLocale(i18n.language);
  const defaults = getPlatformFaqLocaleDefaults(locale);

  return useMemo(() => {
    const data = pageCustomization as Record<string, unknown>;
    const read = (suffix: string, fallback: string) =>
      getPageCustomizationValue(data, `${PLATFORM_FAQ_PAGE_ID}.${suffix}`) ??
      getPageCustomizationValue(data, suffix) ??
      fallback;

    return {
      locale,
      title: read('content.title', defaults.title),
      subtitle: read('content.subtitle', defaults.subtitle),
      seoTitle: read('seo.title', defaults.seoTitle),
      seoDescription: read('seo.description', defaults.seoDescription),
      seoKeywords: read('seo.keywords', defaults.seoKeywords),
    };
  }, [pageCustomization, defaults, locale]);
}
