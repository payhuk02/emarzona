import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SkipToMainContent } from '@/components/accessibility/SkipToMainContent';
import { Activity, Package, ShoppingCart } from 'lucide-react';
import { useDashboardStatsOptimized as useDashboardStats } from '@/hooks/useDashboardStats';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useLCPPreload } from '@/hooks/useLCPPreload';
import { useSessionHealth } from '@/hooks/useSessionHealth';
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
import { PeriodType } from '@/components/dashboard/PeriodFilter';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { DashboardNotifications } from '@/components/dashboard/DashboardNotifications';
import {
  useNotifications,
  useUnreadCount,
  useRealtimeNotifications,
} from '@/hooks/useNotifications';
import { DashboardFullSkeleton, StatsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { CoreWebVitalsMonitor } from '@/components/dashboard/CoreWebVitalsMonitor';
// import { SessionExpiryWarning } from '@/components/auth/SessionExpiryWarning'; // ✅ Supprimé pour gestion silencieuse
import { DashboardErrorHandler } from '@/components/dashboard/DashboardErrorHandler';
import { DashboardCategorySales } from '@/components/dashboard/DashboardCategorySales';
import { DashboardFooterMetrics } from '@/components/dashboard/DashboardFooterMetrics';
import { DashboardSalesEvolution } from '@/components/dashboard/DashboardSalesEvolution';
import { DashboardRecentActivity } from '@/components/dashboard/DashboardRecentActivity';
import '@/styles/dashboard-premium.css';

/**
 * Page principale du Dashboard
 *
 * Affiche un tableau de bord complet avec :
 * - Statistiques en temps réel (produits, commandes, clients, revenus)
 * - Graphiques de performance par type de produit
 * - Commandes récentes
 * - Produits les plus vendus
 * - Actions rapides
 * - Notifications
 *
 * @component
 * @returns {JSX.Element} Le composant Dashboard
 *
 * @remarks
 * - Utilise lazy loading pour les composants analytics lourds
 * - Preload du logo platform pour améliorer LCP
 * - Gestion d'erreurs robuste avec ErrorBoundary
 * - Optimisations de performance (useMemo, useCallback)
 * - Responsive design avec classes Tailwind
 * - Accessible avec ARIA labels complets
 *
 * @example
 * ```tsx
 * <Route path="/dashboard" element={<Dashboard />} />
 * ```
 */
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

  // ✅ SESSION HEALTH: Surveillance proactive de la santé des sessions
  const {
    isHealthy: sessionHealthy,
    connectionStatus,
    refreshSessionIfNeeded,
  } = useSessionHealth();
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
    isUpdating,
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

  // ✅ SESSION HEALTH: Vérifier la santé de la session périodiquement
  useEffect(() => {
    if (!sessionHealthy && connectionStatus === 'online') {
      logger.warn('⚠️ [Dashboard] Session potentially unhealthy, attempting refresh');
      refreshSessionIfNeeded();
    }
  }, [sessionHealthy, connectionStatus, refreshSessionIfNeeded]);

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
    return dbNotifications.filter(validateNotification).map(
      (notif): DashboardNotification => ({
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type:
          notif.priority === 'urgent' || notif.priority === 'high'
            ? ('warning' as const)
            : ('success' as const),
        timestamp: notif.created_at,
        read: notif.is_read || false,
      })
    );
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

  /**
   * Exporte les données du dashboard au format JSON
   *
   * @function handleExport
   * @returns {void}
   *
   * @remarks
   * - Génère un fichier JSON avec les statistiques actuelles
   * - Inclut la date d'export et la période sélectionnée
   * - Télécharge automatiquement le fichier
   * - Gère les erreurs silencieusement avec logging
   */
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
  const dashboardHeaderProps = useMemo(
    () => ({
      period,
      onPeriodChange: setPeriod,
      customStartDate,
      customEndDate,
      onCustomDateChange: handleCustomDateChange,
      onExport: handleExport,
      onRefresh: handleRefresh,
      isRefreshing,
      isUpdating,
      unreadCount,
    }),
    [
      period,
      customStartDate,
      customEndDate,
      handleCustomDateChange,
      handleExport,
      handleRefresh,
      isRefreshing,
      isUpdating,
      unreadCount,
    ]
  );

  const dashboardNotificationsProps = useMemo(
    () => ({
      notifications,
      notificationsEnabled,
      stats,
      onViewStore: handleViewStore,
      onManageCustomers: handleManageCustomers,
      onSettings: handleSettings,
    }),
    [
      notifications,
      notificationsEnabled,
      stats,
      handleViewStore,
      handleManageCustomers,
      handleSettings,
    ]
  );

  // Store loading: afficher des skeletons pendant le chargement
  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <DashboardFullSkeleton />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store state - seulement après le chargement complet
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
          <div className="dashboard-premium container mx-auto max-w-[90rem] p-4 sm:p-5 lg:p-8 pb-10">
            <div className="mb-6 sm:mb-8">
              <DashboardHeader {...dashboardHeaderProps} />
            </div>

            <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
              {statusMessage}
            </div>

            <DashboardErrorHandler
              error={error || hookError}
              onRetry={handleRefresh}
              isRetrying={isRefreshing}
            />

            {loading ? (
              <StatsSkeleton />
            ) : (
              stats && (
                <div className="space-y-6 sm:space-y-8">
                  <DashboardStats stats={stats} />

                  {stats.revenueByMonth.length > 0 && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
                      <div className="xl:col-span-2">
                        <DashboardSalesEvolution data={stats.revenueByMonth} />
                      </div>
                      <DashboardCategorySales
                        revenueByType={stats.revenueByType}
                        onViewAll={handleViewAnalytics}
                      />
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
                        onClick: handleCreateProduct,
                        theme: 'border-emerald-200/80 hover:bg-emerald-50/50',
                      },
                      {
                        title: t('dashboard.quickActions.newOrder'),
                        icon: ShoppingCart,
                        onClick: handleCreateOrder,
                        theme: 'border-blue-200/80 hover:bg-blue-50/50',
                      },
                      {
                        title: t('dashboard.quickActions.analytics'),
                        icon: Activity,
                        onClick: handleViewAnalytics,
                        theme: 'border-violet-200/80 hover:bg-violet-50/50',
                      },
                    ].map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.title}
                          type="button"
                          onClick={action.onClick}
                          className={`dashboard-premium-panel flex items-center justify-center gap-2 text-sm sm:text-base font-semibold transition-colors ${action.theme}`}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          {action.title}
                        </button>
                      );
                    })}
                  </div>

                  <details className="dashboard-premium-panel group">
                    <summary className="cursor-pointer list-none dashboard-premium-panel-title flex items-center justify-between gap-2">
                      {t('dashboard.sections.advanced', 'Analyses avancées')}
                      <span className="text-sm font-normal text-muted-foreground group-open:hidden">
                        {t('common.expand', 'Afficher')}
                      </span>
                    </summary>
                    <div className="mt-6 space-y-6 border-t border-border/50 pt-6">
                      <CoreWebVitalsMonitor />
                      <DashboardCharts stats={stats} />
                      <div className="rounded-xl border border-border/40 p-4 sm:p-5 bg-muted/20">
                        <ProductTypeQuickFilters
                          selectedType={selectedProductType}
                          onTypeChange={setSelectedProductType}
                          stats={stats}
                        />
                      </div>
                      <ProductTypeBreakdown
                        productsByType={stats.productsByType}
                        revenueByType={stats.revenueByType}
                        ordersByType={stats.ordersByType}
                      />
                      {stats.revenueByTypeAndMonth.length > 0 && (
                        <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
                          <ProductTypeCharts
                            revenueByTypeAndMonth={stats.revenueByTypeAndMonth}
                            ordersByType={stats.ordersByType}
                            selectedType={selectedProductType}
                          />
                        </Suspense>
                      )}
                      <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-xl" />}>
                        <ProductTypePerformanceMetrics
                          performanceMetricsByType={stats.performanceMetricsByType}
                          selectedType={selectedProductType}
                        />
                      </Suspense>
                      <DashboardNotifications {...dashboardNotificationsProps} />
                    </div>
                  </details>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
