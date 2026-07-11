import { detectSubdomain } from '@/lib/subdomain-detector';

/** Chemins publics d'authentification (connexion / inscription séparés). */
export const AUTH_LOGIN_PATH = '/login' as const;
export const AUTH_REGISTER_PATH = '/register' as const;

/** Origine plateforme — auth toujours sur emarzona.com, jamais sur myemarzona.shop */
export const PLATFORM_ORIGIN = 'https://www.emarzona.com';

export type AuthTab = 'login' | 'signup';

const REGISTER_PATHS = new Set([
  AUTH_REGISTER_PATH,
  '/register',
  '/signup',
  '/inscription',
  '/auth/signup',
]);

const LOGIN_PATHS = new Set([AUTH_LOGIN_PATH, '/login', '/connexion', '/auth', '/auth/login']);

export function getAuthTabFromPathname(pathname: string): AuthTab {
  if (REGISTER_PATHS.has(pathname)) {
    return 'signup';
  }
  if (LOGIN_PATHS.has(pathname)) {
    return 'login';
  }
  return 'login';
}

export function getAuthPathForTab(
  tab: AuthTab
): typeof AUTH_LOGIN_PATH | typeof AUTH_REGISTER_PATH {
  return tab === 'signup' ? AUTH_REGISTER_PATH : AUTH_LOGIN_PATH;
}

/** URL absolue sur le domaine plateforme (ex. https://www.emarzona.com/login) */
export function getPlatformUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${PLATFORM_ORIGIN}${normalized}`;
}

/** Lien SPA sur emarzona.com ou URL absolue depuis une boutique (*.myemarzona.shop). */
export function resolvePlatformNavTarget(path: string): {
  href: string;
  useSpaLink: boolean;
} {
  if (isOffPlatformHost()) {
    return { href: getPlatformUrl(path), useSpaLink: false };
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return { href: normalized, useSpaLink: true };
}

export function getPlatformLoginUrl(): string {
  return getPlatformUrl(AUTH_LOGIN_PATH);
}

export function getPlatformRegisterUrl(): string {
  return getPlatformUrl(AUTH_REGISTER_PATH);
}

/** Chemin messagerie vendeur (plateforme emarzona.com). */
export function getVendorMessagingPath(storeId: string, productId?: string | null): string {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : '';
  return `/vendor/messaging/${encodeURIComponent(storeId)}${query}`;
}

/** true hors domaine plateforme (boutique *.myemarzona.shop ou domaine personnalisé) */
export function isOffPlatformHost(): boolean {
  if (typeof window === 'undefined') return false;
  const { isPlatformDomain } = detectSubdomain();
  return !isPlatformDomain;
}

/**
 * Redirige vers l'auth plateforme si on est sur un domaine boutique,
 * sinon utilise la navigation SPA relative (emarzona.com).
 */
export function redirectToPlatformLogin(navigate?: (path: string) => void): void {
  if (isOffPlatformHost()) {
    window.location.assign(getPlatformLoginUrl());
    return;
  }
  if (navigate) {
    navigate(AUTH_LOGIN_PATH);
    return;
  }
  window.location.assign(getPlatformLoginUrl());
}

export function redirectToPlatformRegister(navigate?: (path: string) => void): void {
  if (isOffPlatformHost()) {
    window.location.assign(getPlatformRegisterUrl());
    return;
  }
  if (navigate) {
    navigate(AUTH_REGISTER_PATH);
    return;
  }
  window.location.assign(getPlatformRegisterUrl());
}
