import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';

/** Routes plateforme `/admin/*` — shell admin MFA ; routes vendeur `/dashboard/*` — AppPageShell. */
export function isPlatformAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin/');
}

type Props = {
  children: ReactNode;
};

/**
 * Shell dual-mode pour modules store-scoped montés sous `/admin/*` et `/dashboard/*`.
 *
 * Sous `/dashboard/*`, ne pas remonter AppPageShell : AuthenticatedAppLayout
 * le fournit déjà (évite double sidebar / barre horizontale).
 */
export function StoreScopedPageShell({ children }: Props) {
  const { pathname } = useLocation();

  if (isPlatformAdminRoute(pathname)) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <>{children}</>;
}
