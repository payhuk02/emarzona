import { useTranslation } from 'react-i18next';

/** Traductions du landing premium (préfixe landingPremium). */
export function useLandingPremiumT() {
  return useTranslation('translation', { keyPrefix: 'landingPremium' });
}
