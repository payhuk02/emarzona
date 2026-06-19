import { ReactNode } from 'react';
import { StoreScopedPageShell } from '@/components/seller/StoreScopedPageShell';

interface DashboardLayoutProps {
  children: ReactNode;
}

/** Shell vendeur unifié — dual-mode si monté sous `/admin/*` (StoreScopedPageShell). */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <StoreScopedPageShell>{children}</StoreScopedPageShell>;
}
