/**
 * Utilitaires pour la gestion des cookies
 * Fournit des fonctions réutilisables pour gérer les cookies de manière sécurisée
 */

// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface CookieOptions {
  /**
   * Durée de vie en jours
   * @default 365
   */
  expires?: number;
  /**
   * Date d'expiration spécifique
   */
  expiresDate?: Date;
  /**
   * Chemin du cookie
   * @default '/'
   */
  path?: string;
  /**
   * Domaine du cookie
   */
  domain?: string;
  /**
   * Secure (HTTPS uniquement)
   * @default false
   */
  secure?: boolean;
  /**
   * SameSite policy
   * @default 'Lax'
   */
  sameSite?: 'Strict' | 'Lax' | 'None';
  /**
   * HttpOnly (non accessible via JavaScript)
   * Note: Ne peut être défini que côté serveur
   * @default false
   */
  httpOnly?: boolean;
}

/**
 * Définit un cookie
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') {
    // ✅ PHASE 2: Remplacer console.warn par logger
    logger.warn('setCookie: document is not available');
    return;
  }

  const {
    expires = 365,
    expiresDate,
    path = '/',
    domain,
    secure = false,
    sameSite = 'Lax',
  } = options;

  let  cookieString= `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Gérer l'expiration
  if (expiresDate) {
    cookieString += `; expires=${expiresDate.toUTCString()}`;
  } else if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Ajouter le chemin
  if (path) {
    cookieString += `; path=${path}`;
  }

  // Ajouter le domaine
  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  // Ajouter Secure
  if (secure) {
    cookieString += '; secure';
  }

  // Ajouter SameSite
  if (sameSite) {
    cookieString += `; SameSite=${sameSite}`;
  }

  document.cookie = cookieString;
}

/**
 * Obtient un cookie
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let  i= 0; i < cookies.length; i++) {
    let  cookie= cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
}

/**
 * Supprime un cookie
 */
export function removeCookie(
  name: string,
  options: Pick<CookieOptions, 'path' | 'domain'> = {}
): void {
  const { path = '/', domain } = options;
  setCookie(name, '', {
    expires: -1,
    path,
    domain,
  });
}

/**
 * Vérifie si un cookie existe
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/**
 * Obtient tous les cookies
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }

  const  cookies: Record<string, string> = {};
  const cookieStrings = document.cookie.split(';');

  for (const cookieString of cookieStrings) {
    const [name, value] = cookieString.trim().split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/**
 * Supprime tous les cookies
 */
export function clearAllCookies(): void {
  const cookies = getAllCookies();
  for (const name of Object.keys(cookies)) {
    removeCookie(name);
  }
}

/**
 * Définit un cookie JSON
 */
export function setCookieJSON<T>(name: string, value: T, options: CookieOptions = {}): void {
  try {
    const jsonString = JSON.stringify(value);
    setCookie(name, jsonString, options);
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error(`Error setting cookie ${name}`, { error, name });
  }
}

/**
 * Obtient un cookie JSON
 */
export function getCookieJSON<T>(name: string): T | null {
  const cookieValue = getCookie(name);
  if (!cookieValue) {
    return null;
  }

  try {
    return JSON.parse(cookieValue) as T;
  } catch (error) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error(`Error parsing cookie ${name}`, { error, name });
    return null;
  }
}

/**
 * Obtient ou définit un cookie avec une valeur par défaut
 */
export function getOrSetCookie(
  name: string,
  defaultValue: string,
  options: CookieOptions = {}
): string {
  const existing = getCookie(name);
  if (existing !== null) {
    return existing;
  }

  setCookie(name, defaultValue, options);
  return defaultValue;
}

/**
 * Obtient ou définit un cookie JSON avec une valeur par défaut
 */
export function getOrSetCookieJSON<T>(
  name: string,
  defaultValue: T,
  options: CookieOptions = {}
): T {
  const existing = getCookieJSON<T>(name);
  if (existing !== null) {
    return existing;
  }

  setCookieJSON(name, defaultValue, options);
  return defaultValue;
}

/**
 * Vérifie si les cookies sont supportés
 */
export function areCookiesSupported(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }

  try {
    const testName = '__cookie_test__';
    setCookie(testName, 'test');
    const exists = hasCookie(testName);
    removeCookie(testName);
    return exists;
  } catch {
    return false;
  }
}






