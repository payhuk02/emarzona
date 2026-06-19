import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AppPageShell } from '@/components/layout/AppPageShell';

/** Routes plateforme `/admin/*` — shell admin MFA ; routes vendeur `/dashboard/*` — AppPageShell. */
export function isPlatformAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin/');
}

type Props = {
  children: ReactNode;
};

/**
 * Shell dual-mode pour modules store-scoped montés sous `/admin/*` et `/dashboard/*`.
 */
export function StoreScopedPageShell({ children }: Props) {
  const { pathname } = useLocation();

  if (isPlatformAdminRoute(pathname)) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <AppPageShell>{children}</AppPageShell>;
}
