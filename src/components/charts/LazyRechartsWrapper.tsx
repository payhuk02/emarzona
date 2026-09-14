/**
 * Lazy Recharts Wrapper Component
 * Charge Recharts de manière lazy et expose les composants nécessaires
 */

import { useState, useEffect, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface LazyRechartsWrapperProps {
  children: (recharts: typeof import('recharts')) => ReactNode;
  /** Libellé pour lecteurs d’écran (role=img) */
  ariaLabel?: string;
  /** Résumé textuel sr-only */
  summary?: string;
}

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
 * Wrapper pour utiliser Recharts de manière lazy
 * Usage:
 * <LazyRechartsWrapper>
 *   {(recharts) => (
 *     <recharts.LineChart data={data}>
 *       <recharts.Line dataKey="value" />
 *     </recharts.LineChart>
 *   )}
 * </LazyRechartsWrapper>
 */
export const LazyRechartsWrapper = ({ children, ariaLabel, summary }: LazyRechartsWrapperProps) => {
  const [recharts, setRecharts] = useState<typeof import('recharts') | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('recharts').then(module => {
      setRecharts(module);
      setLoading(false);
    });
  }, []);

  if (loading || !recharts) {
    return <ChartsLoadingFallback />;
  }

  const chart = children(recharts);
  if (!ariaLabel && !summary) {
    return <>{chart}</>;
  }

  return (
    <div role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel} className="h-full w-full">
      {summary ? <div className="sr-only">{summary}</div> : null}
      {chart}
    </div>
  );
};
