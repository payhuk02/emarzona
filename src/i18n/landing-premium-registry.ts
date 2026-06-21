/**
 * Locales landingPremium déjà disponibles (bundle initial ou chargées à la demande).
 */
import { normalizeLanguageCode, type LanguageCode } from './languages';

const loadedLocales = new Set<LanguageCode>(['fr', 'en']);

export function markLandingPremiumLocaleLoaded(lng: LanguageCode): void {
  loadedLocales.add(lng);
}

export function isLandingPremiumLocaleLoaded(lng?: string): boolean {
  return loadedLocales.has(normalizeLanguageCode(lng ?? 'fr'));
}

export function isLandingPremiumLocaleTracked(code: LanguageCode): boolean {
  return loadedLocales.has(code);
}

export function trackLandingPremiumLocale(code: LanguageCode): void {
  loadedLocales.add(code);
}
