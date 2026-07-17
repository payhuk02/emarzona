/**
 * Cartes KPI premium — style maquette (couleurs + vagues)
 * Révélation progressive : revenus/commandes d'abord, clients/panier après idle.
 */

import React from 'react';
import { DollarSign, ShoppingCart, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatLocaleNumber } from '@/lib/i18n/locale-format';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDeferredMount } from '@/hooks/useDeferredMount';
import { formatFcfa } from '@/lib/format-currency';
import { DashboardMetricCard } from '@/components/dashboard/DashboardMetricCard';
import { DashboardMetricCardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import type { DashboardStats as DashboardStatsType } from '@/hooks/useDashboardStats';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export const DashboardStats = React.memo<DashboardStatsProps>(({ stats }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const showSecondaryKpis = useDeferredMount(true, 200);

  const avgBasket = stats.performanceMetrics?.averageOrderValue ?? 0;

  const primaryCards = [
    {
      label: t('dashboard.stats.revenue.title', 'Revenus totaux'),
      value: formatFcfa(stats.totalRevenue),
      trend: stats.trends.revenueGrowth,
      icon: DollarSign,
      theme: 'purple' as const,
    },
    {
      label: t('dashboard.stats.orders.title', 'Commandes'),
      value: formatLocaleNumber(stats.totalOrders, locale),
      trend: stats.trends.orderGrowth,
      icon: ShoppingCart,
      theme: 'blue' as const,
    },
  ];

  const secondaryCards = [
    {
      label: t('dashboard.stats.customers.title', 'Clients'),
      value: formatLocaleNumber(stats.totalCustomers, locale),
      trend: stats.trends.customerGrowth,
      icon: Users,
      theme: 'green' as const,
    },
    {
      label: t('dashboard.stats.avgBasket', 'Panier moyen'),
      value: formatFcfa(avgBasket),
      trend: stats.trends.revenueGrowth,
      icon: Wallet,
      theme: 'orange' as const,
    },
  ];

  const periodHint = stats.periodLabel;

  const renderCard = (card: (typeof primaryCards)[number]) => (
    <DashboardMetricCard
      key={card.label}
      label={card.label}
      value={card.value}
      trendPercent={card.trend}
      icon={card.icon}
      theme={card.theme}
    />
  );

  return (
    <div ref={statsRef} className="space-y-3">
      <p className="text-xs sm:text-sm text-muted-foreground">
        {t('dashboard.stats.periodHint', 'KPI sur la période : {{period}}', { period: periodHint })}
      </p>
      <div
        className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        role="region"
        aria-label={t('dashboard.stats.ariaLabel', 'Statistiques du tableau de bord')}
      >
        {primaryCards.map(renderCard)}
        {showSecondaryKpis ? (
          secondaryCards.map(renderCard)
        ) : (
          <>
            <DashboardMetricCardSkeleton />
            <DashboardMetricCardSkeleton />
          </>
        )}
      </div>
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
