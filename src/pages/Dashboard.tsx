import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Activity,
  Zap,
  Bell,
  Settings,
  LayoutDashboard,
  AlertCircle,
  Download,
  RefreshCw,
  Target,
  MoreVertical,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback, lazy, Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLCPPreload } from '@/hooks/useLCPPreload';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
// ✅ PHASE 2: Lazy load des composants analytics lourds (utilisent recharts)
const RevenueChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.RevenueChart,
  }))
);
const OrdersChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.OrdersChart,
  }))
);
const PerformanceMetrics = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.PerformanceMetrics,
  }))
);
const OrdersTrendChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.OrdersTrendChart,
  }))
);
const RevenueVsOrdersChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.RevenueVsOrdersChart,
  }))
);
const CustomersTrendChart = lazy(() =>
  import('@/components/dashboard/AdvancedDashboardComponents').then(m => ({
    default: m.CustomersTrendChart,
  }))
);
const ProductTypeCharts = lazy(() =>
  import('@/components/dashboard/ProductTypeCharts').then(m => ({
    default: m.ProductTypeCharts,
  }))
);
const ProductTypePerformanceMetrics = lazy(() =>
  import('@/components/dashboard/ProductTypePerformanceMetrics').then(m => ({
    default: m.ProductTypePerformanceMetrics,
  }))
);
// Composants non-lourds (pas de lazy loading nécessaire)
import { RecentOrdersCard } from '@/components/dashboard/RecentOrdersCard';
import { TopProductsCard } from '@/components/dashboard/TopProductsCard';
import { ProductTypeBreakdown } from '@/components/dashboard/ProductTypeBreakdown';
import {
  ProductTypeQuickFilters,
  type ProductTypeFilter,
} from '@/components/dashboard/ProductTypeQuickFilters';
import { PeriodFilter, PeriodType } from '@/components/dashboard/PeriodFilter';
import {
  useNotifications,
  useUnreadCount,
  useRealtimeNotifications,
} from '@/hooks/useNotifications';
import '@/styles/dashboard-responsive.css';

const Dashboard = () => {
  // ✅ PERFORMANCE: Preload logo platform (potentielle LCP sur dashboard)
  const platformLogo = usePlatformLogo();

  useEffect(() => {
    if (platformLogo) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = platformLogo;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [platformLogo]);
  const { t } = useTranslation();
  const { getValue } = usePageCustomization('dashboard');
  const { store, loading: storeLoading } = useStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const {
    stats,
    loading,
    error: hookError,
    refetch,
  } = useDashboardStats({
    period,
    customStartDate,
    customEndDate,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<ProductTypeFilter>('all');

  // ✅ PHASE 2: Déferrer les notifications (non-critique pour le premier render)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Activer les notifications après le premier render (déferré)
  useEffect(() => {
    // Utiliser requestIdleCallback ou setTimeout pour déferrer
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          setNotificationsEnabled(true);
        },
        { timeout: 2000 }
      );
    } else {
      setTimeout(() => {
        setNotificationsEnabled(true);
      }, 100);
    }
  }, []);

  // Récupérer les vraies notifications depuis Supabase (inclut les messages) - Déferré
  const { data: notificationsResult } = useNotifications({
    page: 1,
    pageSize: 5, // Afficher les 5 dernières notifications
    includeArchived: false,
  });
  const { data: unreadCount = 0 } = useUnreadCount();

  // S'abonner aux notifications en temps réel - Déferré (seulement si activé)
  useRealtimeNotifications();

  // Transformer les notifications Supabase en format compatible avec le Dashboard
  const notifications = useMemo(() => {
    const dbNotifications = notificationsResult?.data || [];
    return dbNotifications.map(notif => ({
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type:
        notif.priority === 'urgent' || notif.priority === 'high'
          ? ('warning' as const)
          : ('success' as const),
      timestamp: notif.created_at,
      read: notif.is_read || false,
    }));
  }, [notificationsResult?.data]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      logger.info('Actualisation du dashboard...', {});
      await refetch();
      logger.info('Dashboard actualisé avec succès', {});
    } catch (_err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      const error =
        err instanceof Error ? err : new Error("Erreur lors de l'actualisation du dashboard");
      logger.error(error, {
        error: err,
        message: errorMessage,
      });
      setError(errorMessage || 'Erreur lors du chargement des données');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleExport = useCallback(() => {
    try {
      const data = {
        stats,
        exportedAt: new Date().toISOString(),
        period,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      logger.info('Export du dashboard réussi', {});
    } catch (err) {
      logger.error("Erreur lors de l'export", { error: err });
    }
  }, [stats, period]);

  const handleCustomDateChange = useCallback(
    (startDate: Date | undefined, endDate: Date | undefined) => {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    },
    []
  );

  const handleCreateProduct = useCallback(() => {
    navigate('/dashboard/products/new');
  }, [navigate]);

  const handleCreateOrder = useCallback(() => {
    navigate('/dashboard/orders');
  }, [navigate]);

  const handleViewAnalytics = useCallback(() => {
    navigate('/dashboard/analytics');
  }, [navigate]);

  const handleManageCustomers = useCallback(() => {
    navigate('/dashboard/customers');
  }, [navigate]);

  const handleViewStore = useCallback(() => {
    navigate('/dashboard/store');
  }, [navigate]);

  const handleSettings = useCallback(() => {
    navigate('/dashboard/settings');
  }, [navigate]);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const actionsRef = useScrollAnimation<HTMLDivElement>();
  const bottomRef = useScrollAnimation<HTMLDivElement>();

  // Loading state
  if (storeLoading || loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store state
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                  <LayoutDashboard className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {getValue('dashboard.welcome')}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                    {t('dashboard.createStorePrompt')}
                  </p>
                  <Button
                    onClick={() => navigate('/dashboard/store')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white min-h-[44px] text-sm sm:text-base touch-manipulation"
                  >
                    {getValue('dashboard.createStoreButton')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mt-1 sm:mt-0 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                        <LayoutDashboard
                          className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 text-purple-500 dark:text-purple-400"
                          aria-hidden="true"
                        />
                      </div>
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                        {getValue('dashboard.title') || t('dashboard.title')}
                      </span>
                    </div>
                  </h1>
                  <p className="text-sm sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    Vue d'ensemble de votre boutique
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Notifications Bell - Desktop */}
                <div className="hidden sm:block relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] min-w-[44px] p-0 relative touch-manipulation"
                    aria-label="Notifications"
                    title="Notifications"
                    onClick={() => {
                      // Naviguer vers la page des notifications
                      navigate('/notifications');
                    }}
                  >
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-semibold"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Desktop controls */}
                <PeriodFilter
                  period={period}
                  onPeriodChange={setPeriod}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  onCustomDateChange={handleCustomDateChange}
                  className="hidden sm:flex"
                />
                <Badge
                  variant="outline"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hidden sm:flex items-center gap-1.5 min-h-[44px]"
                  aria-label={getValue('dashboard.online') || 'En ligne'}
                >
                  <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
                  {getValue('dashboard.online')}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="hidden sm:flex min-h-[44px] gap-2 touch-manipulation"
                  aria-label="Exporter les données"
                  title="Exporter les données"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden lg:inline">Exporter</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="min-h-[44px] min-w-[44px] p-0 touch-manipulation"
                  aria-label={getValue('dashboard.refresh')}
                  title={getValue('dashboard.refresh')}
                >
                  <RefreshCw
                    className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                </Button>

                {/* Mobile menu - All controls accessible */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="sm:hidden min-h-[44px] min-w-[44px] p-0 touch-manipulation"
                      aria-label="Menu des options"
                    >
                      <MoreVertical className="h-5 w-5" aria-hidden="true" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh]">
                    <SheetHeader>
                      <SheetTitle>Options du tableau de bord</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                      {/* Notifications on Mobile */}
                      {unreadCount > 0 && (
                        <div className="space-y-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start min-h-[44px]"
                            onClick={() => navigate('/notifications')}
                          >
                            <Bell className="h-4 w-4 mr-2" aria-hidden="true" />
                            <span className="flex-1">Notifications</span>
                            <Badge variant="destructive" className="ml-2">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                          </Button>
                        </div>
                      )}
                      {/* Period Filter on Mobile */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Période</div>
                        <PeriodFilter
                          period={period}
                          onPeriodChange={setPeriod}
                          customStartDate={customStartDate}
                          customEndDate={customEndDate}
                          onCustomDateChange={handleCustomDateChange}
                          className="w-full"
                        />
                      </div>
                      {/* Online Status */}
                      <div className="flex items-center space-x-2 p-2 rounded-md bg-muted/50">
                        <Activity className="h-4 w-4" aria-hidden="true" />
                        <span className="flex-1 text-sm">{getValue('dashboard.online')}</span>
                      </div>
                      {/* Export */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start min-h-[44px]"
                        onClick={handleExport}
                      >
                        <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                        <span>Exporter les données</span>
                      </Button>
                      {/* Refresh */}
                      <Button
                        variant="ghost"
                        className="w-full justify-start min-h-[44px]"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                      >
                        <RefreshCw
                          className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
                          aria-hidden="true"
                        />
                        <span>{getValue('dashboard.refresh')}</span>
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Error Alert */}
            {(error || hookError) && (
              <Alert
                variant="destructive"
                className="animate-in fade-in slide-in-from-top-4 duration-500"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm sm:text-base">
                  {t('dashboard.error.title')}
                </AlertTitle>
                <AlertDescription className="text-xs sm:text-sm mt-1">
                  {error || hookError}
                </AlertDescription>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="min-h-[44px] text-xs sm:text-sm touch-manipulation"
                    aria-label={t('dashboard.retry')}
                  >
                    {t('dashboard.retry')}
                  </Button>
                </div>
              </Alert>
            )}
            {/* Stats Cards - Responsive & Animated */}
            {stats && (
              <div
                ref={statsRef}
                className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                role="region"
                aria-label={t('dashboard.stats.ariaLabel', 'Statistiques du tableau de bord')}
              >
                {[
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
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card
                      key={stat.label}
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                        <CardTitle className="text-sm sm:text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                          <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                          {stat.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                        <div
                          className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 break-words`}
                        >
                          {stat.value}
                        </div>
                        <p className="text-sm sm:text-[11px] md:text-xs text-muted-foreground mb-1.5 sm:mb-2 leading-tight">
                          {stat.description}
                        </p>
                        <Badge
                          variant="default"
                          className="text-xs sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
                        >
                          {stat.trend}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Quick Actions - Responsive & Animated */}
            <Card
              ref={actionsRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-labelledby="quick-actions-title"
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                <CardTitle
                  id="quick-actions-title"
                  className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Zap
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  {t('dashboard.quickActions.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div
                  className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  role="list"
                  aria-label={t('dashboard.quickActions.ariaLabel', 'Actions rapides disponibles')}
                >
                  {[
                    {
                      title: t('dashboard.quickActions.newProduct'),
                      description: t('dashboard.quickActions.newProductDesc'),
                      icon: Package,
                      color: 'from-green-600 to-emerald-600',
                      onClick: handleCreateProduct,
                    },
                    {
                      title: t('dashboard.quickActions.newOrder'),
                      description: t('dashboard.quickActions.newOrderDesc'),
                      icon: ShoppingCart,
                      color: 'from-blue-600 to-cyan-600',
                      onClick: handleCreateOrder,
                    },
                    {
                      title: t('dashboard.quickActions.analytics'),
                      description: t('dashboard.quickActions.analyticsDesc'),
                      icon: Activity,
                      color: 'from-purple-600 to-pink-600',
                      onClick: handleViewAnalytics,
                    },
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Card
                        key={action.title}
                        className="cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group touch-manipulation min-h-[100px] sm:min-h-[120px] md:min-h-[140px] animate-in fade-in slide-in-from-bottom-4"
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={action.onClick}
                        role="listitem"
                        aria-label={action.title}
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            action.onClick();
                          }
                        }}
                      >
                        <CardContent className="p-2.5 sm:p-3 md:p-4 lg:p-6 h-full flex flex-col justify-center">
                          <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3">
                            <div
                              className={`p-2 sm:p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${action.color === 'from-green-600 to-emerald-600' ? 'from-green-500/10 to-emerald-500/10' : action.color === 'from-blue-600 to-cyan-600' ? 'from-blue-500/10 to-cyan-500/10' : 'from-purple-500/10 to-pink-500/10'} group-hover:opacity-80 transition-colors shrink-0`}
                            >
                              <Icon
                                className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${action.color === 'from-green-600 to-emerald-600' ? 'text-green-500' : action.color === 'from-blue-600 to-cyan-600' ? 'text-blue-500' : 'text-purple-500'}`}
                                aria-hidden="true"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1 break-words">
                                {action.title}
                              </h3>
                              <p className="text-sm sm:text-[11px] md:text-xs lg:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                {action.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Charts Section - Graphiques de visualisation */}
            {stats && stats.revenueByMonth.length > 0 && (
              <>
                {/* Première ligne de graphiques */}
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <RevenueChart data={stats.revenueByMonth} />
                  {stats.ordersByStatus.length > 0 && <OrdersChart data={stats.ordersByStatus} />}
                </div>

                {/* Deuxième ligne de graphiques */}
                <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <OrdersTrendChart data={stats.revenueByMonth} />
                  <RevenueVsOrdersChart data={stats.revenueByMonth} />
                </div>

                {/* Troisième ligne - Graphique clients */}
                {stats.revenueByMonth.some(item => item.customers > 0) && (
                  <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
                      <CustomersTrendChart data={stats.revenueByMonth} />
                    </Suspense>
                  </div>
                )}
              </>
            )}

            {/* Performance Metrics */}
            {stats && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
                        <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      Métriques de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <Suspense fallback={<Skeleton className="h-[200px] w-full rounded-lg" />}>
                      <PerformanceMetrics metrics={stats.performanceMetrics} />
                    </Suspense>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Product Type Quick Filters */}
            {stats && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <ProductTypeQuickFilters
                      selectedType={selectedProductType}
                      onTypeChange={setSelectedProductType}
                      stats={stats}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Product Type Breakdown */}
            {stats && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ProductTypeBreakdown
                  productsByType={stats.productsByType}
                  revenueByType={stats.revenueByType}
                  ordersByType={stats.ordersByType}
                />
              </div>
            )}

            {/* Product Type Charts */}
            {stats && stats.revenueByTypeAndMonth && stats.revenueByTypeAndMonth.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-lg" />}>
                  <ProductTypeCharts
                    revenueByTypeAndMonth={stats.revenueByTypeAndMonth}
                    ordersByType={stats.ordersByType}
                    selectedType={selectedProductType}
                  />
                </Suspense>
              </div>
            )}

            {/* Product Type Performance Metrics */}
            {stats && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-lg" />}>
                  <ProductTypePerformanceMetrics
                    performanceMetricsByType={stats.performanceMetricsByType}
                    selectedType={selectedProductType}
                  />
                </Suspense>
              </div>
            )}

            {/* Top Products & Recent Orders */}
            {stats && (stats.topProducts.length > 0 || stats.recentOrders.length > 0) && (
              <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {stats.topProducts.length > 0 && <TopProductsCard products={stats.topProducts} />}
                {stats.recentOrders.length > 0 && <RecentOrdersCard orders={stats.recentOrders} />}
              </div>
            )}

            {/* Bottom Row - Responsive & Animated */}
            <div
              ref={bottomRef}
              className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
              role="region"
              aria-label={t(
                'dashboard.bottomSection.ariaLabel',
                'Notifications et activité récente'
              )}
            >
              {/* Notifications - ✅ PHASE 2: Déferré pour améliorer le TBT */}
              {notificationsEnabled && (
                <Card
                  id="notifications-section"
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  role="region"
                  aria-labelledby="notifications-title"
                >
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <CardTitle
                      id="notifications-title"
                      className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg"
                    >
                      <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
                        <Bell
                          className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400"
                          aria-hidden="true"
                        />
                      </div>
                      {t('dashboard.notifications.title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <div
                      className="space-y-3"
                      role="list"
                      aria-label={t(
                        'dashboard.notifications.list.ariaLabel',
                        'Liste des notifications'
                      )}
                    >
                      {notifications.length === 0 ? (
                        <div className="text-center py-4 sm:py-6">
                          <Bell className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 text-muted-foreground opacity-50" />
                          <p className="text-sm sm:text-xs md:text-sm text-muted-foreground">
                            Aucune notification
                          </p>
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-3 md:p-4 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation min-h-[50px] sm:min-h-[60px] cursor-pointer"
                            role="listitem"
                            tabIndex={0}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                              }
                            }}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              <div className="p-1 sm:p-1.5 sm:p-2 rounded-full bg-blue-500/10">
                                <Bell
                                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-blue-500"
                                  aria-hidden="true"
                                />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1">
                                {notification.title}
                              </h4>
                              <p className="text-sm sm:text-xs md:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-xs sm:text-xs md:text-xs text-muted-foreground">
                                  {new Date(notification.timestamp).toLocaleString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {!notification.read && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
                                  >
                                    {t('dashboard.notificationsBadge.new')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Activity */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20">
                      <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 dark:text-green-400" />
                    </div>
                    {t('dashboard.recentActivity.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="space-y-3">
                    {stats.recentActivity.length === 0 ? (
                      <div className="text-center py-4 sm:py-6">
                        <Activity className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1.5 sm:mb-2 text-muted-foreground opacity-50" />
                        <p className="text-sm sm:text-xs md:text-sm text-muted-foreground">
                          Aucune activité récente
                        </p>
                      </div>
                    ) : (
                      stats.recentActivity.map(activity => (
                        <div
                          key={activity.id}
                          className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-3 md:p-4 rounded-lg hover:bg-muted/50 transition-colors touch-manipulation min-h-[50px] sm:min-h-[60px] cursor-pointer"
                          tabIndex={0}
                          onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                            }
                          }}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="p-1 sm:p-1.5 sm:p-2 rounded-full bg-green-500/10">
                              <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-green-500" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-xs md:text-sm font-medium mb-0.5 sm:mb-1 line-clamp-2 leading-relaxed">
                              {activity.message}
                            </h4>
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="text-xs sm:text-xs md:text-xs text-muted-foreground">
                                {new Date(activity.timestamp).toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {activity.status && (
                                <Badge
                                  variant="outline"
                                  className="text-xs sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
                                >
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Settings */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                  <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-gray-500/10 to-gray-500/5 backdrop-blur-sm border border-gray-500/20">
                      <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                    Paramètres Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-9 sm:h-10 md:h-12 text-sm sm:text-xs md:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors"
                      onClick={handleViewStore}
                    >
                      <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 md:mr-3" />
                      <span className="hidden sm:inline">Paramètres Boutique</span>
                      <span className="sm:hidden">Boutique</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-9 sm:h-10 md:h-12 text-sm sm:text-xs md:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors"
                      onClick={handleManageCustomers}
                    >
                      <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 md:mr-3" />
                      <span className="hidden sm:inline">Gérer les Clients</span>
                      <span className="sm:hidden">Clients</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-9 sm:h-10 md:h-12 text-sm sm:text-xs md:text-sm touch-manipulation min-h-[44px] hover:bg-muted/50 transition-colors"
                      onClick={handleSettings}
                    >
                      <Settings className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-1.5 sm:mr-2 md:mr-3" />
                      <span className="hidden sm:inline">Configuration</span>
                      <span className="sm:hidden">Config</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
