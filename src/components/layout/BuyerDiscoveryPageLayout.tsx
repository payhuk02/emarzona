/**
 * Layout discovery acheteur — shell unifié si connecté, page standalone pour invités.
 */

import { ReactNode } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { cn } from '@/lib/utils';

export type BuyerDiscoveryPageLayoutProps = {
  authenticated: boolean;
  mainAriaLabel: string;
  children: ReactNode;
  guestClassName?: string;
  shellMainClassName?: string;
};

export function BuyerDiscoveryPageLayout({
  authenticated,
  mainAriaLabel,
  children,
  guestClassName = 'min-h-screen overflow-x-hidden bg-background',
  shellMainClassName = 'overflow-x-hidden',
}: BuyerDiscoveryPageLayoutProps) {
  if (authenticated) {
    return <AppPageShell mainClassName={shellMainClassName}>{children}</AppPageShell>;
  }

  return (
    <div className={cn(guestClassName)} role="main" id="main-content" aria-label={mainAriaLabel}>
      {children}
    </div>
  );
}
