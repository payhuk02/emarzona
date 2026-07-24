import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Package, Truck, Users } from 'lucide-react';
import { formatFcfa } from '@/lib/format-currency';
import type { DashboardStats } from '@/hooks/useDashboardStats';

interface DashboardFooterMetricsProps {
  stats: DashboardStats;
}

export const DashboardFooterMetrics = React.memo<DashboardFooterMetricsProps>(({ stats }) => {
  const { t } = useTranslation();
  const { performanceMetrics, operational } = stats;

  const completionRate = performanceMetrics.conversionRate;

  const items = [
    {
      label: t('dashboard.footer.completion', 'Taux de complétion'),
      value: `${completionRate.toFixed(1)}%`,
      icon: CheckCircle2,
    },
    {
      label: t('dashboard.footer.toShip', 'À expédier'),
      value: String(operational.ordersToFulfill),
      icon: Truck,
    },
    {
      label: t('dashboard.footer.avgBasket', 'Panier moyen'),
      value: formatFcfa(performanceMetrics.averageOrderValue),
      icon: Package,
    },
    {
      label: t('dashboard.footer.retention', 'Clients avec commande'),
      value: `${performanceMetrics.customerRetention}%`,
      icon: Users,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      role="region"
      aria-label={t('dashboard.footer.ariaLabel', 'Indicateurs secondaires')}
    >
      {items.map(item => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="dashboard-mini-metric">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="dashboard-mini-metric-label truncate">{item.label}</span>
            </div>
            <p className="dashboard-mini-metric-value break-words">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
});

DashboardFooterMetrics.displayName = 'DashboardFooterMetrics';
