import { useCallback, useEffect, useState } from 'react';
import { useTranslation, type TFunction, type TOptions } from 'react-i18next';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { LANDING_PREMIUM_PAGE_ID } from '@/lib/admin/landingPremiumCustomization';
import { getPageCustomizationValue } from '@/lib/admin/pageCustomizationKeys';
import {
  ensureLandingPremiumLocale,
  isLandingPremiumLocaleLoaded,
} from '@/i18n/landing-premium-loader';

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
  localeReady: boolean;
} {
  const { t: i18nT, i18n } = useTranslation('translation', { keyPrefix: 'landingPremium' });
  const { pageCustomization } = usePageCustomization(LANDING_PREMIUM_PAGE_ID);
  const [localeReady, setLocaleReady] = useState(() => isLandingPremiumLocaleLoaded(i18n.language));

  useEffect(() => {
    let cancelled = false;
    setLocaleReady(isLandingPremiumLocaleLoaded(i18n.language));
    void ensureLandingPremiumLocale(i18n.language).then(() => {
      if (!cancelled) setLocaleReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

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
    [pageCustomization, i18nT, localeReady]
  ) as TFunction;

  return { t, i18n, localeReady };
}
