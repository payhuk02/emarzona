/**
 * Layout discovery acheteur — shell unifié si connecté, PremiumNav pour invités.
 * AppPageShell est lazy pour ne pas tirer AppSidebar dans les chunks marketplace invités.
 */

import { lazy, ReactNode, Suspense } from 'react';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import '@/styles/landing-premium.css';

const AppPageShell = lazy(() =>
  import('@/components/layout/AppPageShell').then(m => ({ default: m.AppPageShell }))
);

export type BuyerDiscoveryPageLayoutProps = {
  authenticated: boolean;
  mainAriaLabel: string;
  children: ReactNode;
  guestClassName?: string;
  shellMainClassName?: string;
  /** When true (default), guests get PremiumNav + nav offset padding. */
  guestPremiumNav?: boolean;
};

function AuthShellFallback() {
  return (
    <div className="flex min-h-screen w-full bg-background" aria-busy="true">
      <div className="hidden md:block w-14 shrink-0 border-r border-border bg-muted/30" />
      <div className="flex min-w-0 flex-1 flex-col p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function BuyerDiscoveryPageLayout({
  authenticated,
  mainAriaLabel,
  children,
  guestClassName = 'min-h-screen overflow-x-hidden bg-background',
  shellMainClassName = 'overflow-x-hidden',
  guestPremiumNav = true,
}: BuyerDiscoveryPageLayoutProps) {
  if (authenticated) {
    return (
      <Suspense fallback={<AuthShellFallback />}>
        <AppPageShell mainClassName={shellMainClassName}>{children}</AppPageShell>
      </Suspense>
    );
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
