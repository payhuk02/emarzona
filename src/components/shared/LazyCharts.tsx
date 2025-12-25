/**
 * LazyCharts - Wrapper pour le lazy loading des composants de graphiques
 * Optimise les performances en chargeant Recharts uniquement quand nécessaire
 */

import { lazy, Suspense, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Lazy load Recharts
const RechartsProvider = lazy(() => 
  import('recharts').then(module => ({
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>
  }))
);

// Composant de chargement
const ChartsLoadingFallback = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[300px] w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Wrapper pour les composants utilisant Recharts
 * Charge Recharts de manière lazy pour améliorer les performances
 */
export function withLazyCharts<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function LazyChartsWrapper(props: P) {
    return (
      <Suspense fallback={<ChartsLoadingFallback />}>
        <RechartsProvider>
          <Component {...props} />
        </RechartsProvider>
      </Suspense>
    );
  };
}

/**
 * Hook pour utiliser Recharts de manière lazy
 */
export function useLazyCharts() {
  return {
    isLoading: false, // Sera géré par Suspense
  };
}

