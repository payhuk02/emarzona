/**
 * Helpers partagés pour le consentement cookies (bannière, scripts tiers, footer).
 */

import type { CookiePreferences } from '@/types/legal';

export const OPEN_COOKIE_SETTINGS_EVENT = 'emarzona:open-cookie-settings';

export function hasCookieConsentGiven(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('cookieConsentGiven') === 'true';
}

export function getStoredCookiePreferences(): Partial<CookiePreferences> | null {
  if (typeof localStorage === 'undefined') return null;
  const saved = localStorage.getItem('cookiePreferences');
  if (!saved) return null;
  try {
    return JSON.parse(saved) as Partial<CookiePreferences>;
  } catch {
    return null;
  }
}

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
}

export function hasFunctionalCookieConsent(
  preferences?: Partial<CookiePreferences> | null
): boolean {
  if (!hasCookieConsentGiven()) return false;
  return preferences?.functional === true || preferences?.marketing === true;
}

export function hasAnalyticsCookieConsent(
  preferences?: Partial<CookiePreferences> | null
): boolean {
  if (!hasCookieConsentGiven()) return false;
  return preferences?.analytics === true;
}
