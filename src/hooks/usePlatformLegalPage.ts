import { useMemo } from 'react';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { normalizeContentForDisplay } from '@/lib/content/plain-text-content';
import type { PlatformLegalPageMeta } from '@/lib/admin/platformLegalPagesConfig';
import type { LegalDocument } from '@/types/legal';

export function usePlatformLegalPage(
  meta: PlatformLegalPageMeta,
  dbDocument?: LegalDocument | null
) {
  const { pageCustomization } = usePageCustomization(meta.pageId);

  return useMemo(() => {
    const data = pageCustomization as Record<string, unknown>;
    const read = (suffix: string, fallback: string) =>
      getPageCustomizationValue(data, `${meta.pageId}.${suffix}`) ??
      getPageCustomizationValue(data, suffix) ??
      fallback;

    const adminBody =
      getPageCustomizationValue(data, `${meta.pageId}.content.body`) ??
      getPageCustomizationValue(data, 'content.body');

    let body = meta.defaultBody;
    if (adminBody) {
      body = normalizeContentForDisplay(adminBody);
    } else if (dbDocument?.content?.trim()) {
      body = normalizeContentForDisplay(dbDocument.content);
    }

    const effectiveDate = dbDocument?.effective_date
      ? new Date(dbDocument.effective_date).toLocaleDateString('fr-FR')
      : null;
    const version = dbDocument?.version ?? '1.0';

    return {
      title: read('content.title', meta.defaultTitle),
      subtitle: read('content.subtitle', meta.defaultSubtitle),
      body,
      seoTitle: read('seo.title', meta.defaultTitle),
      seoDescription: read('seo.description', meta.defaultSeoDescription),
      effectiveDate,
      version,
    };
  }, [pageCustomization, meta, dbDocument]);
}
