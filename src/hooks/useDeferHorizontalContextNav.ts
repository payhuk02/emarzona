import { useDeferredMount } from '@/hooks/useDeferredMount';

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

/**
 * Retarde le montage de HorizontalContextNav sur /dashboard uniquement
 * pour améliorer FCP/LCP (nav lourde + mega-menu).
 */
export function useDeferHorizontalContextNav(pathname: string, idleTimeoutMs = 600): boolean {
  const isDashboardHome = normalizePath(pathname) === '/dashboard';
  const deferredReady = useDeferredMount(isDashboardHome, idleTimeoutMs);
  return isDashboardHome ? deferredReady : true;
}
