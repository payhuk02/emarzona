/**
 * Helpers partagés pour le consentement cookies (bannière, scripts tiers, footer).
 */

import type { CookiePreferences } from '@/types/legal';

// ---------------------------------------------------------------------------
// Cookie helpers — consent stored as first-party cookie for server-side access
// and cross-subdomain sharing (*.myemarzona.shop).
// ---------------------------------------------------------------------------

const CONSENT_COOKIE = 'emarzona_consent';
const PREFS_COOKIE = 'emarzona_cookie_prefs';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function setCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  const domain = location.hostname.endsWith('.myemarzona.shop')
    ? '.myemarzona.shop'
    : location.hostname.endsWith('emarzona.com')
      ? '.emarzona.com'
      : '';
  const domainPart = domain ? `; domain=${domain}` : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax; Secure${domainPart}`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const OPEN_COOKIE_SETTINGS_EVENT = 'emarzona:open-cookie-settings';

export function hasCookieConsentGiven(): boolean {
  // Check cookie first (new), then fall back to localStorage (legacy migration)
  if (getCookie(CONSENT_COOKIE) === 'true') return true;
  if (typeof localStorage !== 'undefined' && localStorage.getItem('cookieConsentGiven') === 'true') {
    // Migrate legacy localStorage value to cookie
    setCookie(CONSENT_COOKIE, 'true');
    return true;
  }
  return false;
}

export function getStoredCookiePreferences(): Partial<CookiePreferences> | null {
  // Check cookie first (new), then fall back to localStorage (legacy migration)
  const fromCookie = getCookie(PREFS_COOKIE);
  if (fromCookie) {
    try {
      return JSON.parse(fromCookie) as Partial<CookiePreferences>;
    } catch { /* fall through */ }
  }
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('cookiePreferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved) as Partial<CookiePreferences>;
        // Migrate to cookie
        setCookie(PREFS_COOKIE, saved);
        return prefs;
      } catch { /* ignore */ }
    }
  }
  return null;
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
