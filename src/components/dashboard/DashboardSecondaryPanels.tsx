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
    <div className="space-y-6 sm:space-y-8 mt-6">
      {stats.revenueByMonth.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          <div className="xl:col-span-2">
            <DashboardSalesEvolution data={stats.revenueByMonth} />
          </div>
          <DashboardCategorySales revenueByType={stats.revenueByType} onViewAll={onViewAnalytics} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {stats.recentOrders.length > 0 ? (
          <RecentOrdersCard orders={stats.recentOrders} variant="premium" />
        ) : (
          <div className="dashboard-premium-panel flex items-center justify-center min-h-[250px] text-muted-foreground text-sm">
            {t('dashboard.orders.empty', 'Aucune commande récente')}
          </div>
        )}
        {stats.topProducts.length > 0 ? (
          <TopProductsCard products={stats.topProducts} variant="premium" />
        ) : (
          <div className="dashboard-premium-panel flex items-center justify-center min-h-[250px] text-muted-foreground text-sm">
            {t('dashboard.products.empty', 'Aucun produit vendu')}
          </div>
        )}
        <DashboardRecentActivity activities={stats.recentActivity} />
      </div>

      <DashboardFooterMetrics stats={stats} />

      <div
        ref={actionsRef}
        className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mt-4"
        role="list"
        aria-label={t('dashboard.quickActions.ariaLabel', 'Actions rapides')}
      >
        {[
          {
            title: t('dashboard.quickActions.newProduct', 'Nouveau produit'),
            icon: Package,
            onClick: onCreateProduct,
            theme: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            title: t('dashboard.quickActions.newOrder', 'Nouvelle commande'),
            icon: ShoppingCart,
            onClick: onCreateOrder,
            theme: 'text-blue-600 dark:text-blue-400',
          },
          {
            title: t('dashboard.quickActions.analytics', 'Voir les analyses'),
            icon: Activity,
            onClick: onViewAnalytics,
            theme: 'text-violet-600 dark:text-violet-400',
          },
        ].map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={action.onClick}
              className="dashboard-premium-panel group flex items-center justify-center gap-3 text-sm sm:text-base font-bold transition-all duration-300 hover:scale-[1.02] cursor-pointer text-foreground"
            >
              <div className={cn("p-2 rounded-xl bg-muted/50 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3", action.theme)}>
                <Icon className="h-6 w-6 shrink-0" aria-hidden />
              </div>
              {action.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
