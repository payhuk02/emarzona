/**
 * Shell discovery (marketplace, community, discover…) monté une fois au niveau route.
 * Connecté : AppPageShell persistant (Marketplace ↔ Community sans remount chrome).
 * Invité : PremiumNav persistant + contenu.
 */

import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteOutletSuspense } from '@/components/navigation/RouteChunkFallback';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/landing-premium.css';

const AppPageShell = lazy(() =>
  import('@/components/layout/AppPageShell').then(m => ({ default: m.AppPageShell }))
);

const PremiumNav = lazy(() =>
  import('@/components/landing/premium/PremiumNav').then(m => ({ default: m.PremiumNav }))
);

export type BuyerDiscoveryOutletContext = {
  discoveryChromeActive: true;
  authenticated: boolean;
};

export const BUYER_DISCOVERY_OUTLET_CONTEXT_AUTH: BuyerDiscoveryOutletContext = {
  discoveryChromeActive: true,
  authenticated: true,
};

export const BUYER_DISCOVERY_OUTLET_CONTEXT_GUEST: BuyerDiscoveryOutletContext = {
  discoveryChromeActive: true,
  authenticated: false,
};

function AuthShellFallback() {
  return (
    <div
      className="aria-busy-skeleton flex min-h-screen w-full bg-background"
      data-busy-quiet
      aria-busy="true"
    >
      <div className="hidden md:block w-14 shrink-0 border-r border-border bg-muted/30" />
      <div className="flex min-w-0 flex-1 flex-col p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

function GuestNavFallback() {
  return (
    <div className="h-[var(--lp-nav-offset)] shrink-0 border-b border-border/40" aria-hidden />
  );
}

export function BuyerDiscoveryShellLayout() {
  const { user, loading: authLoading } = useAuth();

  // Évite le flash PremiumNav → AppPageShell pour les sessions déjà connectées
  if (authLoading) {
    return <AuthShellFallback />;
  }

  if (user) {
    return (
      <Suspense fallback={<AuthShellFallback />}>
        <AppPageShell mainClassName="overflow-x-hidden">
          <RouteOutletSuspense>
            <Outlet context={BUYER_DISCOVERY_OUTLET_CONTEXT_AUTH} />
          </RouteOutletSuspense>
        </AppPageShell>
      </Suspense>
    );
  }

  return (
    <div className="landing-premium marketplace-premium min-h-screen overflow-x-hidden bg-background">
      <Suspense fallback={<GuestNavFallback />}>
        <PremiumNav />
      </Suspense>
      <div className="pt-[var(--lp-nav-offset)]">
        <main id="main-content" role="main" tabIndex={-1} className="outline-none">
          <RouteOutletSuspense>
            <Outlet context={BUYER_DISCOVERY_OUTLET_CONTEXT_GUEST} />
          </RouteOutletSuspense>
        </main>
      </div>
    </div>
  );
}
