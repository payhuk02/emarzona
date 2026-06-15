import type { SidebarPersona } from '@/config/navigation.types';

export type NavActiveMatchMode = 'exact' | 'prefix';

/** Hub routes: prefix mode matches only the exact path, not child segments. */
const PREFIX_EXACT_ONLY_PATHS = new Set(['/dashboard', '/account']);

function normalizeSearch(search: string | undefined): string {
  if (!search) return '';
  return search.startsWith('?') ? search.slice(1) : search;
}

/**
 * Whether a nav item matches the current route.
 * - exact: pathname (+ optional ?query) must match — sidebar / command palette
 * - prefix: item path or any child segment — top nav, bottom nav, context nav
 */
export const isNavItemActive = (
  itemUrl: string,
  pathname: string,
  search: string | undefined,
  mode: NavActiveMatchMode = 'exact'
): boolean => {
  const [itemPath, itemQuery = ''] = itemUrl.split('?');
  const normalizedSearch = normalizeSearch(search);

  if (mode === 'exact') {
    if (pathname !== itemPath) return false;
    if (!itemQuery) return true;
    return normalizedSearch === itemQuery;
  }

  if (PREFIX_EXACT_ONLY_PATHS.has(itemPath)) {
    if (pathname !== itemPath) return false;
    if (itemQuery) return normalizedSearch === itemQuery;
    return true;
  }

  if (pathname === itemPath) {
    if (itemQuery) return normalizedSearch === itemQuery;
    return true;
  }

  if (!itemPath || itemPath === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(`${itemPath}/`);
};

export const parseNavTo = (url: string): string | { pathname: string; search: string } => {
  const [pathname, query = ''] = url.split('?');
  return query ? { pathname, search: `?${query}` } : url;
};

export const getNavItemPath = (url: string) => url.split('?')[0];

/** Cible du clic logo sidebar selon la persona active. */
export function resolveSidebarLogoHome(persona: SidebarPersona): string {
  if (persona === 'buyer') return '/account';
  if (persona === 'admin') return '/admin';
  return '/dashboard';
}

/** Clé i18n pour l'aria-label du logo sidebar. */
export function resolveSidebarLogoAriaKey(persona: SidebarPersona): string {
  if (persona === 'buyer') return 'sidebar.chrome.backToAccount';
  if (persona === 'admin') return 'sidebar.chrome.backToAdmin';
  return 'sidebar.chrome.backToDashboard';
}
