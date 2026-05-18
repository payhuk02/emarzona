/** Chemins publics d'authentification (connexion / inscription séparés). */
export const AUTH_LOGIN_PATH = '/login' as const;
export const AUTH_REGISTER_PATH = '/register' as const;

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
