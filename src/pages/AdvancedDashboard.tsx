import { SidebarTrigger } from '@/components/ui/sidebar';
import { AppPageShell } from '@/components/layout/AppPageShell';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  Target,
  Bell,
  Settings,
  Eye,
  Star,
  Calendar,
  Zap,
} from 'lucide-react';
import { useDashboardStatsOptimized as useAdvancedDashboardStats } from '@/hooks/useDashboardStats';
import { useStore } from '@/hooks/useStore';
import { useNotifications, useMarkAsRead } from '@/hooks/useNotifications';
import {
  AdvancedStatsCard,
  RevenueChart,
  OrdersChart,
  ActivityFeed,
  PerformanceMetrics,
} from '@/components/dashboard/AdvancedDashboardComponents';
import {
  QuickActions,
  NotificationCard,
  GoalProgress,
  RecentActivity,
  DashboardControls,
} from '@/components/dashboard/InteractiveWidgets';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';

const AdvancedDashboard = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { stats, loading, refetch } = useAdvancedDashboardStats({ storeId: store?.id });
  const navigate = useNavigate();
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  const { data: notificationsData } = useNotifications({ page: 1, pageSize: 5 });
  const { mutate: markAsRead } = useMarkAsRead();

  // Notifications dynamiques depuis la base de données
  const notifications = useMemo(() => {
    if (!notificationsData?.data) return [];
    return notificationsData.data.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: (n.priority === 'high' || n.priority === 'urgent' ? 'warning' : 'info') as
        | 'info'
        | 'success'
        | 'warning'
        | 'error',
      timestamp: n.created_at,
      read: n.is_read,
    }));
  }, [notificationsData]);

  // Objectifs dynamiques basés sur les statistiques actuelles (temporaire avant backend complet)
  const goals = useMemo(() => {
    if (!stats) return [];

    return [
      {
        id: '1',
        title: t('dashboard.goals.monthlyRevenue'),
        target: stats.totalRevenue > 0 ? stats.totalRevenue * 1.2 : 500000,
        current: stats.totalRevenue,
        unit: 'FCFA',
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        color: 'primary',
      },
      {
        id: '2',
        title: t('dashboard.goals.newCustomers'),
        target: stats.totalCustomers > 0 ? Math.floor(stats.totalCustomers * 1.5) : 50,
        current: stats.totalCustomers,
        unit: t('dashboard.goals.customersUnit'),
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        color: 'green',
      },
      {
        id: '3',
        title: t('dashboard.goals.productsSold'),
        target: stats.totalOrders > 0 ? Math.floor(stats.totalOrders * 1.3) : 100,
        current: stats.totalOrders,
        unit: t('dashboard.goals.ordersUnit'),
        deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
        color: 'blue',
      },
    ];
  }, [stats, t]);

  const handleRefresh = async () => {
    await refetch();
    setLastUpdated(new Date().toISOString());
  };

  const handleExport = () => {
    // Logique d'export des données
    logger.info('Exporting dashboard data');
  };

  const handleFilter = () => {
    // Logique de filtrage
    logger.debug('Opening filter options');
  };

  const handleSettings = () => {
    navigate('/dashboard/settings');
  };

  const handleCreateProduct = () => {
    navigate('/dashboard/products/new');
  };

  const handleCreateOrder = () => {
    navigate('/dashboard/orders');
  };

  const handleViewAnalytics = () => {
    navigate('/dashboard/analytics');
  };

  const handleManageCustomers = () => {
    navigate('/dashboard/customers');
  };

  const handleViewStore = () => {
    navigate('/dashboard/store');
  };

  const handleMarkNotificationAsRead = (id: string) => {
    logger.debug('Marking notification as read', { notificationId: id });
    markAsRead(id);
  };

  const handleViewAllNotifications = () => {
    logger.debug('Viewing all notifications');
  };

  const handleViewAllActivity = () => {
    logger.debug('Viewing all activity');
  };

  if (storeLoading || loading) {
    return (
      <AppPageShell>
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">{t('dashboard.loading')}</p>
        </div>
      </AppPageShell>
    );
  }

  if (!store || !stats) {
    return (
      <AppPageShell mainClassName="p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-hero overflow-x-hidden">
        <div className="max-w-3xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold mb-4">{t('dashboard.welcome')}</h2>
          <p className="text-muted-foreground mb-6">{t('dashboard.createStorePrompt')}</p>
          <Button onClick={() => navigate('/dashboard/store')} size="lg">
            {t('dashboard.createStoreButton')}
          </Button>
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
        <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-3 sm:px-4 md:px-6">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
              {t('dashboard.title')} - {store.name}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              {t('dashboard.online')}
            </Badge>
            <Button variant="ghost" size="sm" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Controls */}
        <DashboardControls
          onRefresh={handleRefresh}
          onExport={handleExport}
          onFilter={handleFilter}
          onSettings={handleSettings}
          lastUpdated={lastUpdated}
        />

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <AdvancedStatsCard
            title={t('dashboard.stats.products.title')}
            value={stats.totalProducts}
            description={t('dashboard.stats.products.active', {
              count: stats.activeProducts,
              defaultValue_one: '{{count}} actif',
              defaultValue_other: '{{count}} actifs',
            })}
            icon={Package}
            color="green"
            trend={{
              value: stats.trends.productGrowth,
              label: t('dashboard.trends.vsLastMonth'),
              period: '30j',
            }}
          />
          <AdvancedStatsCard
            title={t('dashboard.stats.orders.title')}
            value={stats.totalOrders}
            description={t('dashboard.stats.orders.pending', { count: stats.pendingOrders })}
            icon={ShoppingCart}
            color="blue"
            trend={{
              value: stats.trends.orderGrowth,
              label: t('dashboard.trends.vsLastMonth'),
              period: '30j',
            }}
          />
          <AdvancedStatsCard
            title={t('dashboard.stats.customers.title')}
            value={stats.totalCustomers}
            description={t('dashboard.stats.customers.registered')}
            icon={Users}
            color="purple"
            trend={{
              value: stats.trends.customerGrowth,
              label: t('dashboard.trends.vsLastMonth'),
              period: '30j',
            }}
          />
          <AdvancedStatsCard
            title={t('dashboard.stats.revenue.title')}
            value={`${stats.totalRevenue.toLocaleString()} FCFA`}
            description={t('dashboard.stats.revenue.total')}
            icon={DollarSign}
            color="yellow"
            trend={{
              value: stats.trends.revenueGrowth,
              label: t('dashboard.trends.vsLastMonth'),
              period: '30j',
            }}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions
          onCreateProduct={handleCreateProduct}
          onCreateOrder={handleCreateOrder}
          onViewAnalytics={handleViewAnalytics}
          onManageCustomers={handleManageCustomers}
          onViewStore={handleViewStore}
          onSettings={handleSettings}
        />

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart data={stats.revenueByMonth} />
          <OrdersChart data={stats.ordersByStatus} />
        </div>

        {/* Performance Metrics */}
        <PerformanceMetrics metrics={stats.performanceMetrics} trends={stats.trends} />

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <NotificationCard
              notifications={notifications}
              onMarkAsRead={handleMarkNotificationAsRead}
              onViewAll={handleViewAllNotifications}
            />
          </div>
          <div className="lg:col-span-1">
            <GoalProgress goals={goals} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity activities={stats.recentActivity} onViewAll={handleViewAllActivity} />
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={stats.recentActivity} />
      </div>
    </AppPageShell>
  );
};

export default AdvancedDashboard;
