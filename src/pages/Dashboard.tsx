import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SkipToMainContent } from '@/components/accessibility/SkipToMainContent';
import {
  Activity,
  Zap,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
} from 'lucide-react';
import { useDashboardStatsOptimized as useDashboardStats } from '@/hooks/useDashboardStatsOptimized';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLCPPreload } from '@/hooks/useLCPPreload';
import { usePlatformLogo } from '@/hooks/usePlatformLogo';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import type { Notification } from '@/types/notifications';
// ✅ PHASE 2: Lazy load des composants analytics lourds (utilisent recharts)
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
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardNotifications } from '@/components/dashboard/DashboardNotifications';
import {
  useNotifications,
  useUnreadCount,
  useRealtimeNotifications,
} from '@/hooks/useNotifications';
import { CoreWebVitalsMonitor } from '@/components/dashboard/CoreWebVitalsMonitor';
import { SessionExpiryWarning } from '@/components/auth/SessionExpiryWarning';
import { DashboardErrorHandler } from '@/components/dashboard/DashboardErrorHandler';
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

  // ✅ PERFORMANCE: Stabiliser les callbacks avec useRef pour éviter les re-renders
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
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

  // ✅ VALIDATION: Type-safe transformation des notifications Supabase
  interface DashboardNotification {
    id: string;
    title: string;
    message: string;
    type: 'warning' | 'success';
    timestamp: string;
    read: boolean;
  }

  // Fonction de validation stricte des notifications
  const validateNotification = (notif: unknown): notif is Notification => {
    if (!notif || typeof notif !== 'object') return false;
    const n = notif as Record<string, unknown>;
    return (
      typeof n.id === 'string' &&
      typeof n.title === 'string' &&
      typeof n.message === 'string' &&
      typeof n.created_at === 'string' &&
      (n.is_read === undefined || typeof n.is_read === 'boolean')
    );
  };

  // Transformer les notifications Supabase en format compatible avec le Dashboard
  const notifications = useMemo<DashboardNotification[]>(() => {
    const dbNotifications = notificationsResult?.data || [];
    return dbNotifications
      .filter(validateNotification)
      .map((notif): DashboardNotification => ({
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

  // ✅ ACCESSIBILITÉ: État pour les annonces aria-live
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      setStatusMessage('Actualisation des données en cours...');
      logger.info('Actualisation du dashboard...', {});
      await refetch();
      setStatusMessage('Données actualisées avec succès');
      logger.info('Dashboard actualisé avec succès', {});
      // Effacer le message après 3 secondes
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: unknown) {
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
      // ✅ ACCESSIBILITÉ: Annoncer le changement de période
      if (startDate && endDate) {
        const start = startDate.toLocaleDateString('fr-FR');
        const end = endDate.toLocaleDateString('fr-FR');
        setStatusMessage(`Période modifiée : du ${start} au ${end}`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    },
    []
  );

  const handleCreateProduct = useCallback(() => {
    navigateRef.current('/dashboard/products/new');
  }, []);

  const handleCreateOrder = useCallback(() => {
    navigateRef.current('/dashboard/orders');
  }, []);

  const handleViewAnalytics = useCallback(() => {
    navigateRef.current('/dashboard/analytics');
  }, []);

  const handleManageCustomers = useCallback(() => {
    navigateRef.current('/dashboard/customers');
  }, []);

  const handleViewStore = useCallback(() => {
    navigateRef.current('/dashboard/store');
  }, []);

  const handleSettings = useCallback(() => {
    navigateRef.current('/dashboard/settings');
  }, []);

  // Animations au scroll
  const actionsRef = useScrollAnimation<HTMLDivElement>();

  // ✅ PERFORMANCE: Mémoriser les props pour éviter les re-renders inutiles
  const dashboardHeaderProps = useMemo(() => ({
    period,
    onPeriodChange: setPeriod,
    customStartDate,
    customEndDate,
    onCustomDateChange: handleCustomDateChange,
    onExport: handleExport,
    onRefresh: handleRefresh,
    isRefreshing,
    unreadCount,
  }), [period, customStartDate, customEndDate, handleCustomDateChange, handleExport, handleRefresh, isRefreshing, unreadCount]);

  const dashboardNotificationsProps = useMemo(() => ({
    notifications,
    notificationsEnabled,
    stats,
    onViewStore: handleViewStore,
    onManageCustomers: handleManageCustomers,
    onSettings: handleSettings,
  }), [notifications, notificationsEnabled, stats, handleViewStore, handleManageCustomers, handleSettings]);

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
      {/* ✅ ACCESSIBILITÉ: Skip link pour navigation clavier */}
      <SkipToMainContent />
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main id="main-content" className="flex-1 overflow-auto" role="main" tabIndex={-1}>
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Session Expiry Warning */}
            <SessionExpiryWarning />

            {/* Header - Responsive & Animated */}
            <DashboardHeader {...dashboardHeaderProps} />

            {/* ✅ ACCESSIBILITÉ: Aria-live region pour les mises à jour dynamiques */}
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {statusMessage}
            </div>

            {/* Gestion d'erreurs améliorée */}
            <DashboardErrorHandler
              error={error || hookError}
              onRetry={handleRefresh}
              isRetrying={isRefreshing}
            />
            {/* Stats Cards - Responsive & Animated */}
            {stats && <DashboardStats stats={stats} />}

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

            {/* Core Web Vitals Monitor - Métriques de performance */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <CoreWebVitalsMonitor />
            </div>

            {/* Charts Section - Graphiques de visualisation */}
            {stats && <DashboardCharts stats={stats} />}

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

            {/* Bottom Row - Notifications, Activity & Quick Settings */}
            {stats && <DashboardNotifications {...dashboardNotificationsProps} />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
