import { useCallback } from 'react';
import { useTranslation, type TFunction, type TOptions } from 'react-i18next';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { STORE_FOOTER_PAGE_ID } from '@/lib/admin/storeFooterCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';

/** Traductions pied de page boutique avec surcharge admin (pages.storeFooter). */
export function useStoreFooterT(): { t: TFunction } {
  const { t: i18nT } = useTranslation('translation', { keyPrefix: 'storefront.footer' });
  const { pageCustomization } = usePageCustomization(STORE_FOOTER_PAGE_ID);

  const t = useCallback(
    (key: string, options?: TOptions) => {
      const custom = getPageCustomizationValue(pageCustomization as Record<string, unknown>, key);
      if (typeof custom === 'string' && custom.length > 0 && !options?.returnObjects) {
        if (options && typeof options === 'object' && Object.keys(options).length > 0) {
          let result = custom;
          for (const [optKey, optValue] of Object.entries(options)) {
            if (optKey === 'returnObjects' || optKey === 'defaultValue') continue;
            result = result.replace(
              new RegExp(`{{\\s*${optKey}\\s*}}`, 'g'),
              String(optValue ?? '')
            );
          }
          return result;
        }
        return custom;
      }

      if (options?.returnObjects) {
        return i18nT(key, options);
      }

      return i18nT(key, options);
    },
    [pageCustomization, i18nT]
  ) as TFunction;

  return { t };
}
