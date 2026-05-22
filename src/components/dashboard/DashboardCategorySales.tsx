import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatFcfa } from '@/lib/format-currency';
import {
  getAllProductTypes,
  PRODUCT_TYPE_CONFIG,
  type ProductType,
} from '@/constants/product-types';
import { Smartphone, Package, Wrench, GraduationCap, Palette } from 'lucide-react';

const TYPE_ICONS: Record<ProductType, React.ComponentType<{ className?: string }>> = {
  digital: Smartphone,
  physical: Package,
  service: Wrench,
  course: GraduationCap,
  artist: Palette,
};

const BAR_COLORS: Record<ProductType, string> = {
  digital: 'bg-violet-500',
  physical: 'bg-blue-500',
  service: 'bg-emerald-500',
  course: 'bg-amber-500',
  artist: 'bg-pink-500',
};

const ICON_BG: Record<ProductType, string> = {
  digital: 'bg-violet-500/15',
  physical: 'bg-blue-500/15',
  service: 'bg-emerald-500/15',
  course: 'bg-amber-500/15',
  artist: 'bg-pink-500/15',
};

const ICON_COLOR: Record<ProductType, string> = {
  digital: 'text-violet-600',
  physical: 'text-blue-600',
  service: 'text-emerald-600',
  course: 'text-amber-600',
  artist: 'text-pink-600',
};

interface DashboardCategorySalesProps {
  revenueByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  onViewAll?: () => void;
  className?: string;
}

export const DashboardCategorySales = React.memo<DashboardCategorySalesProps>(
  ({ revenueByType, onViewAll, className }) => {
    const { t } = useTranslation();

    const rows = useMemo(() => {
      const total = Object.values(revenueByType).reduce((s, v) => s + v, 0);
      return getAllProductTypes()
        .map(type => ({
          type,
          label: PRODUCT_TYPE_CONFIG[type].label,
          revenue: revenueByType[type],
          percent: total > 0 ? Math.round((revenueByType[type] / total) * 100) : 0,
        }))
        .filter(r => r.revenue > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    }, [revenueByType]);

    return (
      <div className={cn('dashboard-premium-panel h-full flex flex-col', className)}>
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h2 className="dashboard-premium-panel-title">
              {t('dashboard.categorySales.title', 'Ventes par catégorie')}
            </h2>
            <p className="dashboard-premium-panel-subtitle">
              {t('dashboard.categorySales.subtitle', 'Répartition de vos revenus')}
            </p>
          </div>
          {onViewAll && (
            <Button variant="ghost" size="sm" className="text-sm shrink-0" onClick={onViewAll}>
              {t('common.viewAll', 'Voir tout')}
            </Button>
          )}
        </div>
        <div className="space-y-4 sm:space-y-5 flex-1">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              {t('dashboard.categorySales.empty', 'Aucune vente par catégorie pour le moment')}
            </p>
          ) : (
            rows.map(row => {
              const Icon = TYPE_ICONS[row.type];
              return (
                <div key={row.type} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                          ICON_BG[row.type]
                        )}
                      >
                        <Icon className={cn('h-4 w-4', ICON_COLOR[row.type])} />
                      </span>
                      <span className="text-sm sm:text-base font-medium text-foreground truncate">
                        {row.label}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm sm:text-base font-semibold tabular-nums">
                        {formatFcfa(row.revenue, { compact: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">{row.percent}%</p>
                    </div>
                  </div>
                  <div className="dashboard-category-bar">
                    <div
                      className={cn('dashboard-category-bar-fill', BAR_COLORS[row.type])}
                      style={{ width: `${Math.max(row.percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
);

DashboardCategorySales.displayName = 'DashboardCategorySales';
