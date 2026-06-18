import { useCallback } from 'react';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import type { TOptions } from 'i18next';

/** Chaînes UI de la page /faq (landingPremium.faq.*). */
export function usePlatformFaqT() {
  const { t: landingT, i18n } = useLandingPremiumT();

  const t = useCallback(
    (key: string, options?: TOptions) => landingT(`faq.${key}`, options),
    [landingT]
  );

  return { t, i18n };
}
