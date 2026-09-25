/**
 * Fallback Suspense adapté au contexte de route — garde une chrome plausible
 * au lieu d'un spinner plein écran qui casse la sensation de fluidité.
 *
 * `OutletChunkFallback` : contenu seul (shell déjà monté via layout persistant).
 * `RouteChunkFallback` : premier chargement (layout lazy pas encore monté).
 */

import { useEffect, type ReactNode, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { beginRouteChunkLoad, endRouteChunkLoad } from '@/lib/navigation-chunk-pending';

function useTrackChunkPending() {
  useEffect(() => {
    beginRouteChunkLoad();
    return () => endRouteChunkLoad();
  }, []);
}

/** Skeleton contenu — sidebar/header restent stables (Suspense interne au layout). */
export function OutletChunkFallback() {
  useTrackChunkPending();
  return (
    <div
      className="aria-busy-skeleton flex w-full flex-col gap-4 p-4 md:p-6"
      data-testid="outlet-chunk-fallback"
      data-busy-quiet
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

/** Isole le lazy page pour ne pas démonter le layout / les guards parents. */
export function RouteOutletSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<OutletChunkFallback />}>{children}</Suspense>;
}

function DashboardRouteSkeleton() {
  useTrackChunkPending();
  return (
    <div
      className="aria-busy-skeleton flex min-h-screen w-full bg-background"
      data-busy-quiet
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hidden md:block w-14 shrink-0 border-r border-border bg-muted/30" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-14 shrink-0 border-b border-border px-4 flex items-center">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 space-y-4 p-4 md:p-6">
          <Skeleton className="h-8 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function AccountRouteSkeleton() {
  useTrackChunkPending();
  return (
    <div
      className="aria-busy-skeleton flex min-h-screen w-full bg-background"
      data-busy-quiet
      aria-busy="true"
      aria-live="polite"
    >
      <div className="hidden md:block w-56 shrink-0 border-r border-border p-4 space-y-3">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}

function PublicRouteSkeleton() {
  useTrackChunkPending();
  return (
    <div
      className="aria-busy-skeleton flex min-h-[50vh] w-full flex-col items-center justify-center gap-4 p-8"
      data-busy-quiet
      aria-busy="true"
      aria-live="polite"
    >
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="mt-4 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function RouteChunkFallback() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
    return <DashboardRouteSkeleton />;
  }
  if (pathname.startsWith('/account')) {
    return <AccountRouteSkeleton />;
  }
  return <PublicRouteSkeleton />;
}
