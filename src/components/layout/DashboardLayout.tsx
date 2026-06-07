import { ReactNode } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';

interface DashboardLayoutProps {
  children: ReactNode;
}

/** Shell vendeur unifié (sidebar dashboard + zone contenu). */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AppPageShell mainClassName="pb-16 md:pb-0">{children}</AppPageShell>;
}
