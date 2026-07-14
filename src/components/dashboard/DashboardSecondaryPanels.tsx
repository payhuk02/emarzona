/**
 * Sections secondaires du tableau de bord (graphiques, listes, métriques).
 * Chargées en lazy après les KPI pour améliorer le TTI.
 */

import type { RefObject } from 'react';
import { Activity, Package, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/hooks/useDashboardStats';
import { DashboardSalesEvolution } from '@/components/dashboard/DashboardSalesEvolution';
import { DashboardCategorySales } from '@/components/dashboard/DashboardCategorySales';
import { DashboardRecentActivity } from '@/components/dashboard/DashboardRecentActivity';
import { DashboardFooterMetrics } from '@/components/dashboard/DashboardFooterMetrics';
import { RecentOrdersCard } from '@/components/dashboard/RecentOrdersCard';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';

interface DashboardSecondaryPanelsProps {
  stats: DashboardStats;
  onViewAnalytics: () => void;
  onCreateProduct: () => void;
  onCreateOrder: () => void;
  actionsRef: RefObject<HTMLDivElement | null>;
}

export function DashboardSecondaryPanels({
  stats,
  onViewAnalytics,
  onCreateProduct,
  onCreateOrder,
  actionsRef,
}: DashboardSecondaryPanelsProps) {
  const { t } = useTranslation();

  return (
    <>
      {stats.revenueByMonth.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
          <div className="xl:col-span-2">
            <DashboardSalesEvolution data={stats.revenueByMonth} />
          </div>
          <DashboardCategorySales revenueByType={stats.revenueByType} onViewAll={onViewAnalytics} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {stats.recentOrders.length > 0 ? (
          <RecentOrdersCard orders={stats.recentOrders} variant="premium" />
        ) : (
          <div className="dashboard-premium-panel flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
            {t('dashboard.orders.empty', 'Aucune commande récente')}
          </div>
        )}
        {stats.topProducts.length > 0 ? (
          <TopProductsCard products={stats.topProducts} variant="premium" />
        ) : (
          <div className="dashboard-premium-panel flex items-center justify-center min-h-[200px] text-muted-foreground text-sm">
            {t('dashboard.products.empty', 'Aucun produit vendu')}
          </div>
        )}
        <DashboardRecentActivity activities={stats.recentActivity} />
      </div>

      <DashboardFooterMetrics stats={stats} />

      <div
        ref={actionsRef}
        className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3"
        role="list"
        aria-label={t('dashboard.quickActions.ariaLabel', 'Actions rapides')}
      >
        {[
          {
            title: t('dashboard.quickActions.newProduct'),
            icon: Package,
            onClick: onCreateProduct,
            theme: 'border-emerald-200/80 hover:bg-emerald-50/50',
          },
          {
            title: t('dashboard.quickActions.newOrder'),
            icon: ShoppingCart,
            onClick: onCreateOrder,
            theme: 'border-blue-200/80 hover:bg-blue-50/50',
          },
          {
            title: t('dashboard.quickActions.analytics'),
            icon: Activity,
            onClick: onViewAnalytics,
            theme: 'border-violet-200/80 hover:bg-violet-50/50',
          },
        ].map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className={cn(
                'dashboard-premium-panel flex items-center justify-center gap-2 text-sm sm:text-base font-semibold transition-colors',
                action.theme
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              {action.title}
            </button>
          );
        })}
      </div>
    </>
  );
}
