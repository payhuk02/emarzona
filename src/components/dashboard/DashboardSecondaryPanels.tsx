/**
 * Sections secondaires du tableau de bord (graphiques, listes, métriques).
 * Chargées en lazy après les KPI pour améliorer le TTI.
 */

import type { RefObject } from 'react';
import { Activity, Package, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
    <div className="space-y-5 sm:space-y-6 mt-1">
      {stats.revenueByMonth.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          <div className="lg:col-span-2">
            <DashboardSalesEvolution data={stats.revenueByMonth} />
          </div>
          <DashboardCategorySales revenueByType={stats.revenueByType} onViewAll={onViewAnalytics} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {stats.recentOrders.length > 0 ? (
          <RecentOrdersCard orders={stats.recentOrders} variant="premium" />
        ) : (
          <div className="dashboard-premium-panel flex items-center justify-center min-h-[220px] text-muted-foreground text-sm">
            {t('dashboard.orders.empty', 'Aucune commande récente')}
          </div>
        )}
        {stats.topProducts.length > 0 ? (
          <TopProductsCard products={stats.topProducts} variant="premium" />
        ) : (
          <div className="dashboard-premium-panel flex items-center justify-center min-h-[220px] text-muted-foreground text-sm">
            {t('dashboard.products.empty', 'Aucun produit vendu')}
          </div>
        )}
        <div className="md:col-span-2 lg:col-span-1">
          <DashboardRecentActivity activities={stats.recentActivity} />
        </div>
      </div>

      <DashboardFooterMetrics stats={stats} />

      <div
        ref={actionsRef}
        className="dashboard-quick-actions"
        role="list"
        aria-label={t('dashboard.quickActions.ariaLabel', 'Actions rapides')}
      >
        {[
          {
            title: t('dashboard.quickActions.newProduct', 'Nouveau produit'),
            icon: Package,
            onClick: onCreateProduct,
          },
          {
            title: t('dashboard.quickActions.newOrder', 'Nouvelle commande'),
            icon: ShoppingCart,
            onClick: onCreateOrder,
          },
          {
            title: t('dashboard.quickActions.analytics', 'Voir les analyses'),
            icon: Activity,
            onClick: onViewAnalytics,
          },
        ].map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              role="listitem"
              onClick={action.onClick}
              className="dashboard-quick-action-chip"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden />
              {action.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
