/**
 * Chargement paresseux des traductions landing premium (1 locale à la fois).
 */
import i18n from './config';
import { normalizeLanguageCode, type LanguageCode } from './languages';
import {
  isLandingPremiumLocaleTracked,
  trackLandingPremiumLocale,
} from './landing-premium-registry';

export { isLandingPremiumLocaleLoaded } from './landing-premium-registry';

const localeLoaders: Record<LanguageCode, () => Promise<{ default: Record<string, unknown> }>> = {
  fr: () => import('./locales/landing-premium/fr.json'),
  en: () => import('./locales/landing-premium/en.json'),
  es: () => import('./locales/landing-premium/es.json'),
  de: () => import('./locales/landing-premium/de.json'),
  pt: () => import('./locales/landing-premium/pt.json'),
};

export async function ensureLandingPremiumLocale(lng?: string): Promise<LanguageCode> {
  const code = normalizeLanguageCode(lng ?? i18n.language ?? 'fr');

  if (isLandingPremiumLocaleTracked(code)) {
    return code;
  }

  const mod = await localeLoaders[code]();
  i18n.addResourceBundle(code, 'translation', { landingPremium: mod.default }, true, true);
  trackLandingPremiumLocale(code);

  return code;
}
