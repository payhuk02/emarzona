/**
 * Cartes KPI premium — style maquette (couleurs + vagues)
 */

import React from 'react';
import { DollarSign, ShoppingCart, Users, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { formatFcfa } from '@/lib/format-currency';
import { DashboardMetricCard } from '@/components/dashboard/DashboardMetricCard';
import type { DashboardStats as DashboardStatsType } from '@/hooks/useDashboardStats';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export const DashboardStats = React.memo<DashboardStatsProps>(({ stats }) => {
  const { t } = useTranslation();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  const avgBasket = stats.performanceMetrics?.averageOrderValue ?? 0;

  const cards = [
    {
      label: t('dashboard.stats.revenue.title', 'Revenus totaux'),
      value: formatFcfa(stats.totalRevenue),
      trend: stats.trends.revenueGrowth,
      icon: DollarSign,
      theme: 'purple' as const,
    },
    {
      label: t('dashboard.stats.orders.title', 'Commandes'),
      value: stats.totalOrders.toLocaleString('fr-FR'),
      trend: stats.trends.orderGrowth,
      icon: ShoppingCart,
      theme: 'blue' as const,
    },
    {
      label: t('dashboard.stats.customers.title', 'Clients'),
      value: stats.totalCustomers.toLocaleString('fr-FR'),
      trend: stats.trends.customerGrowth,
      icon: Users,
      theme: 'green' as const,
    },
    {
      label: t('dashboard.stats.avgBasket', 'Panier moyen'),
      value: formatFcfa(avgBasket),
      trend: stats.trends.orderGrowth,
      icon: Wallet,
      theme: 'orange' as const,
    },
  ];

  return (
    <div
      ref={statsRef}
      className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
      role="region"
      aria-label={t('dashboard.stats.ariaLabel', 'Statistiques du tableau de bord')}
    >
      {cards.map(card => (
        <DashboardMetricCard
          key={card.label}
          label={card.label}
          value={card.value}
          trendPercent={card.trend}
          icon={card.icon}
          theme={card.theme}
        />
      ))}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
