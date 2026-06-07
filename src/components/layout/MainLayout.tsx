/**
 * @deprecated Use AppPageShell — thin wrapper kept for backward compatibility.
 */

import { ReactNode } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import type { LayoutType } from '@/components/layout/layout.types';

export type { LayoutType } from '@/components/layout/layout.types';

interface MainLayoutProps {
  children: ReactNode;
  layoutType?: LayoutType;
  /** @deprecated TopNav removed — utility bar is always used via AppPageShell */
  showTopNav?: boolean;
}

export const MainLayout = ({ children, layoutType }: MainLayoutProps) => {
  return <AppPageShell layoutType={layoutType}>{children}</AppPageShell>;
};
