import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, ShoppingCart, Package, User, CreditCard } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DashboardStats } from '@/hooks/useDashboardStats';

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  order: ShoppingCart,
  product: Package,
  customer: User,
  payment: CreditCard,
};

interface DashboardRecentActivityProps {
  activities: DashboardStats['recentActivity'];
}

export const DashboardRecentActivity = React.memo<DashboardRecentActivityProps>(
  ({ activities }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const list = activities.slice(0, 6);

    return (
      <div className="dashboard-premium-panel h-full flex flex-col">
        <div className="mb-5 sm:mb-6">
          <h2 className="dashboard-premium-panel-title">
            {t('dashboard.recentActivity.title', 'Activité récente')}
          </h2>
          <p className="dashboard-premium-panel-subtitle">
            {t('dashboard.recentActivity.subtitle', 'Dernières actions sur votre boutique')}
          </p>
        </div>
        <div className="flex-1 space-y-0">
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Activity className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm sm:text-base">
                {t('dashboard.recentActivity.empty', 'Aucune activité récente')}
              </p>
            </div>
          ) : (
            list.map(item => {
              const Icon = TYPE_ICON[item.type] ?? Activity;
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3.5 border-b border-border/40 last:border-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-foreground leading-snug">
                      {item.message}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(item.timestamp), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <Button
          variant="outline"
          className="w-full mt-5 text-sm sm:text-base min-h-[44px]"
          onClick={() => navigate('/dashboard/analytics')}
        >
          {t('dashboard.recentActivity.viewAll', "Voir toute l'activité")}
        </Button>
      </div>
    );
  }
);

DashboardRecentActivity.displayName = 'DashboardRecentActivity';
