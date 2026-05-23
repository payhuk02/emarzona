import { useCallback } from 'react';
import { useTranslation, type TFunction, type TOptions } from 'react-i18next';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';

function applyArrayOverrides<T>(
  base: T[],
  prefix: string,
  customization: Record<string, unknown>
): T[] {
  return base.map((item, index) => {
    if (typeof item === 'string') {
      const override = customization[`${prefix}.${index}`];
      return (typeof override === 'string' && override.length > 0 ? override : item) as T;
    }

    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const obj = item as Record<string, unknown>;
      const result = { ...obj };
      for (const field of Object.keys(obj)) {
        const key = `${prefix}.${index}.${field}`;
        const override = customization[key];
        if (typeof override === 'string' && override.length > 0) {
          result[field] = override;
        }
      }
      return result as T;
    }

    return item;
  });
}

/** Traductions landing premium avec surcharge admin (pages.landingPremium). */
export function useLandingPremiumT(): {
  t: TFunction;
  i18n: ReturnType<typeof useTranslation>['i18n'];
} {
  const { t: i18nT, i18n } = useTranslation('translation', { keyPrefix: 'landingPremium' });
  const { pageCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);

  const t = useCallback(
    (key: string, options?: TOptions) => {
      const custom = pageCustomization[key];
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
        const base = i18nT(key, { ...options, returnObjects: true });
        if (Array.isArray(base)) {
          return applyArrayOverrides(
            base as unknown[],
            key,
            pageCustomization as Record<string, unknown>
          );
        }
        return base;
      }

      return i18nT(key, options);
    },
    [pageCustomization, i18nT]
  ) as TFunction;

  return { t, i18n };
}
