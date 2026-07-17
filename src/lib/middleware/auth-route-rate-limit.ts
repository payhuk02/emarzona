/**
 * Rate limit Edge pour les pages /auth (complément P0-4 — couche IP avant Supabase).
 * N'affecte pas /auth/sso/* (SSO enterprise).
 */

export const AUTH_ROUTE_RATE_LIMIT_PER_MINUTE = 60;
export const AUTH_ROUTE_RATE_WINDOW_SECONDS = 60;

export function isAuthRateLimitPath(pathname: string): boolean {
  if (!pathname.startsWith('/auth')) return false;
  if (pathname.startsWith('/auth/sso/')) return false;
  return true;
}

export function buildAuthRouteRateLimitKey(ip: string): string {
  return `rate_limit:auth_page:${ip}`;
}
