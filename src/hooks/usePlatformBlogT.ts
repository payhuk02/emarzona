import { useCallback } from 'react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import type { TOptions } from 'i18next';

/** Chaînes UI blog (landingPremium.blog.*). */
export function usePlatformBlogT() {
  const { t: landingT, i18n } = useLandingPremiumT();

  const t = useCallback(
    (key: string, options?: TOptions) => landingT(`blog.${key}`, options),
    [landingT]
  );

  return { t, i18n };
}
