/**
 * Layout discovery acheteur — shell unifié si connecté, PremiumNav pour invités.
 */

import { ReactNode } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { cn } from '@/lib/utils';
import '@/styles/landing-premium.css';

export type BuyerDiscoveryPageLayoutProps = {
  authenticated: boolean;
  mainAriaLabel: string;
  children: ReactNode;
  guestClassName?: string;
  shellMainClassName?: string;
  /** When true (default), guests get PremiumNav + nav offset padding. */
  guestPremiumNav?: boolean;
};

export function BuyerDiscoveryPageLayout({
  authenticated,
  mainAriaLabel,
  children,
  guestClassName = 'min-h-screen overflow-x-hidden bg-background',
  shellMainClassName = 'overflow-x-hidden',
  guestPremiumNav = true,
}: BuyerDiscoveryPageLayoutProps) {
  if (authenticated) {
    return <AppPageShell mainClassName={shellMainClassName}>{children}</AppPageShell>;
  }

  return (
    <div
      className={cn('landing-premium', guestClassName)}
      role="main"
      id="main-content"
      aria-label={mainAriaLabel}
    >
      {guestPremiumNav && <PremiumNav />}
      {guestPremiumNav ? <div className="pt-[var(--lp-nav-offset)]">{children}</div> : children}
    </div>
  );
}
