import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  AUTH_LOGIN_PATH,
  AUTH_REGISTER_PATH,
  getPlatformLoginUrl,
  getPlatformRegisterUrl,
} from '@/lib/auth-routes';

const REGISTER_PATHS = new Set([
  AUTH_REGISTER_PATH,
  '/register',
  '/signup',
  '/inscription',
  '/auth/signup',
]);

/**
 * Sur *.myemarzona.shop, /login et /register n'existent pas côté boutique :
 * redirection vers www.emarzona.com/login (ou /register).
 */
export function RedirectToPlatformAuth() {
  const { pathname } = useLocation();

  useEffect(() => {
    const target = REGISTER_PATHS.has(pathname) ? getPlatformRegisterUrl() : getPlatformLoginUrl();
    window.location.replace(target);
  }, [pathname]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
