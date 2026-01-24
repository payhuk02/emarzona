/**
 * Composant Stats Cards du Dashboard
 * 
 * Affiche les 4 cartes principales de statistiques du tableau de bord :
 * - Produits (total et actifs)
 * - Commandes (total et en attente)
 * - Clients (total enregistrés)
 * - Revenus (total et tendance)
 * 
 * @component
 * @param {DashboardStatsType} stats - Les statistiques à afficher
 * @returns {JSX.Element} Le composant de statistiques
 * 
 * @example
 * ```tsx
 * <DashboardStats stats={dashboardStats} />
 * ```
 * 
 * @remarks
 * - Utilise React.memo pour éviter les re-renders inutiles
 * - Supporte l'internationalisation via react-i18next
 * - Accessible avec ARIA labels complets
 * - Responsive avec classes Tailwind adaptatives
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { DashboardStats as DashboardStatsType } from '@/hooks/useDashboardStatsOptimized';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

export const DashboardStats = React.memo<DashboardStatsProps>(({ stats }) => {
  const { t } = useTranslation();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  const statsCards = [
    {
      label: t('dashboard.stats.products.title'),
      value: stats.totalProducts ?? 0,
      description: t('dashboard.stats.products.active', {
        count: stats.activeProducts,
      }),
      icon: Package,
      color: 'from-green-600 to-emerald-600',
      trend: `+${stats.trends.productGrowth}%`,
    },
    {
      label: t('dashboard.stats.orders.title'),
      value: stats.totalOrders,
      description: t('dashboard.stats.orders.pending', {
        count: stats.pendingOrders,
      }),
      icon: ShoppingCart,
      color: 'from-blue-600 to-cyan-600',
      trend: `+${stats.trends.orderGrowth}%`,
    },
    {
      label: t('dashboard.stats.customers.title'),
      value: stats.totalCustomers,
      description: t('dashboard.stats.customers.registered'),
      icon: Users,
      color: 'from-purple-600 to-pink-600',
      trend: `+${stats.trends.customerGrowth}%`,
    },
    {
      label: t('dashboard.stats.revenue.title'),
      value: `${stats.totalRevenue.toLocaleString()} FCFA`,
      description: t('dashboard.stats.revenue.total'),
      icon: DollarSign,
      color: 'from-yellow-600 to-orange-600',
      trend: `+${stats.trends.revenueGrowth}%`,
    },
  ];

  return (
    <div
      ref={statsRef}
      className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      role="region"
      aria-label={t('dashboard.stats.ariaLabel', 'Statistiques du tableau de bord')}
    >
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 100}ms` }}
            role="article"
            aria-labelledby={`stat-${index}-title`}
            aria-describedby={`stat-${index}-description stat-${index}-trend`}
          >
            <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardTitle 
                id={`stat-${index}-title`}
                className="text-sm sm:text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2"
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" aria-hidden="true" />
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div
                className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 break-words`}
                aria-label={`Valeur: ${stat.value}`}
              >
                {stat.value}
              </div>
              <p 
                id={`stat-${index}-description`}
                className="text-sm sm:text-[11px] md:text-xs text-muted-foreground mb-1.5 sm:mb-2 leading-tight"
              >
                {stat.description}
              </p>
              <Badge
                id={`stat-${index}-trend`}
                variant="default"
                className="text-xs sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
                aria-label={`Tendance: ${stat.trend}`}
              >
                {stat.trend}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

DashboardStats.displayName = 'DashboardStats';
