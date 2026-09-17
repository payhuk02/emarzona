import { ReactNode } from 'react';

/** Routes plateforme `/admin/*` — shell via AdminAppLayout ; `/dashboard/*` — AuthenticatedAppLayout. */
export function isPlatformAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/admin/');
}

type Props = {
  children: ReactNode;
};

/**
 * Shell dual-mode pour modules store-scoped montés sous `/admin/*` et `/dashboard/*`.
 * Ne remonte plus AdminLayout/AppPageShell (fournis par les layouts parents).
 */
export function StoreScopedPageShell({ children }: Props) {
  return <>{children}</>;
}
