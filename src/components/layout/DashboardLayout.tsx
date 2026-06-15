import { ReactNode } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';

interface DashboardLayoutProps {
  children: ReactNode;
}

/** Shell vendeur unifié (sidebar dashboard + zone contenu). */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppPageShell>{children}</AppPageShell>;
}
