/**
 * Composant Charts du Dashboard
 * Affiche tous les graphiques de visualisation des données
 */

import React, { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/hooks/useDashboardStatsOptimized';

// Lazy load des composants de graphiques
const RevenueChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.RevenueChart,
  }))
);
const OrdersChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.OrdersChart,
  }))
);
const OrdersTrendChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.OrdersTrendChart,
  }))
);
const RevenueVsOrdersChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.RevenueVsOrdersChart,
  }))
);
const CustomersTrendChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.CustomersTrendChart,
  }))
);
const PerformanceMetrics = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.PerformanceMetrics,
  }))
);

interface DashboardChartsProps {
  stats: DashboardStats;
}

export const DashboardCharts = React.memo<DashboardChartsProps>(({ stats }) => {
  const hasRevenueData = stats.revenueByMonth.length > 0;
  const hasOrdersData = stats.ordersByStatus.length > 0;
  const hasCustomersData = stats.revenueByMonth.some(item => item.customers > 0);

  if (!hasRevenueData) {
    return null;
  }

  return (
    <>
      {/* Première ligne de graphiques */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
          <RevenueChart data={stats.revenueByMonth} />
        </Suspense>
        {hasOrdersData && (
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
            <OrdersChart data={stats.ordersByStatus} />
          </Suspense>
        )}
      </div>

      {/* Deuxième ligne de graphiques */}
      <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
          <OrdersTrendChart data={stats.revenueByMonth} />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
          <RevenueVsOrdersChart data={stats.revenueByMonth} />
        </Suspense>
      </div>

      {/* Troisième ligne - Graphique clients */}
      {hasCustomersData && (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
            <CustomersTrendChart data={stats.revenueByMonth} />
          </Suspense>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}>
          <PerformanceMetrics metrics={stats.performanceMetrics} />
        </Suspense>
      </div>
    </>
  );
});

DashboardCharts.displayName = 'DashboardCharts';
