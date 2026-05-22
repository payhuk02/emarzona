import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SkipToMainContent } from '@/components/accessibility/SkipToMainContent';
import { Activity, LayoutDashboard, Package, ShoppingCart, Users, DollarSign } from 'lucide-react';
import { useDashboardStatsOptimized as useDashboardStats } from '@/hooks/useDashboardStats';
import { useStore } from '@/hooks/useStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { DashboardFullSkeleton, StatsSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { CoreWebVitalsMonitor } from '@/components/dashboard/CoreWebVitalsMonitor';
// import { SessionExpiryWarning } from '@/components/auth/SessionExpiryWarning'; // ✅ Supprimé pour gestion silencieuse
import { DashboardErrorHandler } from '@/components/dashboard/DashboardErrorHandler';
import { DashboardSection } from '@/components/dashboard/DashboardSection';

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
          <div className="container mx-auto max-w-[90rem] p-4 sm:p-5 lg:p-8 pb-10">
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

            <DashboardSection
              id="dashboard-overview"
              title={t('dashboard.sections.overview', "Vue d'ensemble")}
              description={t(
                'dashboard.sections.overviewDesc',
                'Indicateurs clés de votre boutique en un coup d’œil'
              )}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {loading ? <StatsSkeleton /> : stats && <DashboardStats stats={stats} />}
            </DashboardSection>

            <DashboardSection
              id="dashboard-quick-actions"
              title={t('dashboard.quickActions.title', 'Actions rapides')}
              description={t(
                'dashboard.sections.quickActionsDesc',
                'Accédez aux tâches les plus fréquentes en un clic'
              )}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <div
                ref={actionsRef}
                className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                role="list"
                aria-label={t('dashboard.quickActions.ariaLabel', 'Actions rapides disponibles')}
              >
                {[
                  {
                    title: t('dashboard.quickActions.newProduct'),
                    description: t('dashboard.quickActions.newProductDesc'),
                    icon: Package,
                    onClick: handleCreateProduct,
                  },
                  {
                    title: t('dashboard.quickActions.newOrder'),
                    description: t('dashboard.quickActions.newOrderDesc'),
                    icon: ShoppingCart,
                    onClick: handleCreateOrder,
                  },
                  {
                    title: t('dashboard.quickActions.analytics'),
                    description: t('dashboard.quickActions.analyticsDesc'),
                    icon: Activity,
                    onClick: handleViewAnalytics,
                  },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.title}
                      className="dashboard-inner-card cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] touch-manipulation min-h-[120px] sm:min-h-[132px] animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 80}ms` }}
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
                      <CardContent className="p-4 sm:p-5 md:p-6 h-full flex flex-col justify-center">
                        <div className="flex items-start gap-3 md:gap-4">
                          <Icon
                            className="h-6 w-6 sm:h-7 sm:w-7 text-black shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="dashboard-action-title text-foreground break-words">
                              {action.title}
                            </h3>
                            <p className="dashboard-action-description line-clamp-2 mt-1">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </DashboardSection>

            <DashboardSection
              id="dashboard-performance"
              title={t('dashboard.sections.performance', 'Performance du site')}
              description={t(
                'dashboard.sections.performanceDesc',
                'Core Web Vitals et qualité d’expérience en temps réel'
              )}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <CoreWebVitalsMonitor />
            </DashboardSection>

            {stats && (
              <DashboardSection
                id="dashboard-analytics"
                title={t('dashboard.sections.analytics', 'Analyses & répartition')}
                description={t(
                  'dashboard.sections.analyticsDesc',
                  'Graphiques, filtres et performance par type de produit'
                )}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <DashboardCharts stats={stats} />
                <div className="dashboard-inner-card rounded-xl border border-border/40 p-4 sm:p-5 md:p-6">
                  <ProductTypeQuickFilters
                    selectedType={selectedProductType}
                    onTypeChange={setSelectedProductType}
                    stats={stats}
                  />
                </div>
                <ProductTypeBreakdown
                  className="dashboard-inner-card shadow-none"
                  productsByType={stats.productsByType}
                  revenueByType={stats.revenueByType}
                  ordersByType={stats.ordersByType}
                />
                {stats.revenueByTypeAndMonth && stats.revenueByTypeAndMonth.length > 0 && (
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
              </DashboardSection>
            )}

            {stats && (stats.topProducts.length > 0 || stats.recentOrders.length > 0) && (
              <DashboardSection
                id="dashboard-activity"
                title={t('dashboard.sections.activity', 'Activité récente')}
                description={t(
                  'dashboard.sections.activityDesc',
                  'Vos meilleures ventes et dernières commandes'
                )}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                contentClassName="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2"
              >
                {stats.topProducts.length > 0 && <TopProductsCard products={stats.topProducts} />}
                {stats.recentOrders.length > 0 && <RecentOrdersCard orders={stats.recentOrders} />}
              </DashboardSection>
            )}

            {stats && (
              <DashboardSection
                id="dashboard-notifications"
                title={t('dashboard.sections.notifications', 'Notifications & raccourcis')}
                description={t(
                  'dashboard.sections.notificationsDesc',
                  'Alertes, activité et accès rapide aux paramètres'
                )}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                contentClassName="!space-y-0"
              >
                <DashboardNotifications {...dashboardNotificationsProps} />
              </DashboardSection>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
