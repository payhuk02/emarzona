import { AppPageShell } from '@/components/layout/AppPageShell';
import { useDashboardStatsOptimized as useDashboardStats } from '@/hooks/useDashboardStats';
import { useStore, type Store } from '@/hooks/useStore';
import { useStoreContext } from '@/contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@/lib/i18n/locale-format';
import { useState, useMemo, useCallback, lazy, Suspense, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useSessionHealth } from '@/hooks/useSessionHealth';
import { useDeferredMount } from '@/hooks/useDeferredMount';
import { PeriodType } from '@/components/dashboard/PeriodFilter';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { useUnreadCount } from '@/hooks/useNotifications';
import {
  DashboardFullSkeleton,
  DashboardSecondarySkeleton,
} from '@/components/dashboard/DashboardSkeleton';
import { DashboardOnboarding } from '@/components/dashboard/DashboardOnboarding';
import { resolveDashboardShellView } from '@/lib/dashboard/dashboard-onboarding-guard';
import { DashboardErrorHandler } from '@/components/dashboard/DashboardErrorHandler';
import { DashboardActionCenter } from '@/components/dashboard/DashboardActionCenter';
import { PhysicalSubscriptionAlert } from '@/components/billing/PhysicalSubscriptionAlert';
import { SellerPushOptInBanner } from '@/components/notifications/SellerPushOptInBanner';
import '@/styles/dashboard-premium.css';

const DashboardSecondaryPanels = lazy(() =>
  import('@/components/dashboard/DashboardSecondaryPanels').then(m => ({
    default: m.DashboardSecondaryPanels,
  }))
);

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
 * - Lazy loading des graphiques et listes (below-the-fold)
 * - Prefetch du chunk secondaire dès réception des KPI
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
/** Route /dashboard : oriente vers onboarding ou tableau de bord complet */
const Dashboard = () => {
  const { loading: contextLoading, stores, error: storesError } = useStoreContext();
  const { store, loading: storeLoading, hasStores } = useStore();

  const shellView = resolveDashboardShellView({
    contextLoading,
    storeLoading,
    hasStores,
    storesCount: stores.length,
    store,
    storesError,
  });

  if (shellView === 'onboarding') {
    return <DashboardOnboarding />;
  }

  if (shellView === 'skeleton') {
    return <DashboardFullSkeleton />;
  }

  return <DashboardWithStore store={store} storeLoading={storeLoading || contextLoading} />;
};

type DashboardWithStoreProps = {
  store: Store | null;
  storeLoading: boolean;
};

const DashboardWithStore = ({ store, storeLoading }: DashboardWithStoreProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // ✅ SESSION HEALTH: différé après le premier paint (non bloquant pour LCP)
  const [sessionHealthEnabled, setSessionHealthEnabled] = useState(false);
  useEffect(() => {
    const enable = () => setSessionHealthEnabled(true);
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(enable, { timeout: 3000 });
    } else {
      setTimeout(enable, 500);
    }
  }, []);

  const {
    isHealthy: sessionHealthy,
    connectionStatus,
    refreshSessionIfNeeded,
    initialCheckComplete: sessionCheckComplete,
    isRetrying: sessionRetrying,
  } = useSessionHealth({ enabled: sessionHealthEnabled });
  const [period, setPeriod] = useState<PeriodType>('30d');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();

  // ✅ PERFORMANCE: Stabiliser les callbacks avec useRef pour éviter les re-renders
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const {
    stats,
    hasData: hasStatsData,
    error: hookError,
    isUpdating,
    refetch,
  } = useDashboardStats({
    period,
    customStartDate,
    customEndDate,
    storeId: store?.id,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  /** Skeleton jusqu'à la 1re réponse réelle — jamais en parallèle d'une erreur affichée */
  const showStatsSkeleton = storeLoading || !store?.id || (!hasStatsData && !hookError);

  /** Graphiques et listes : après KPI + idle browser (400 ms max) */
  const showSecondaryPanels = useDeferredMount(!showStatsSkeleton && !!stats, 400);
  const [secondaryChunkReady, setSecondaryChunkReady] = useState(false);

  // Prefetch du chunk secondaire dès que les stats sont prêtes
  useEffect(() => {
    if (!showStatsSkeleton && stats) {
      void import('@/components/dashboard/DashboardSecondaryPanels').then(() => {
        setSecondaryChunkReady(true);
      });
    } else {
      setSecondaryChunkReady(false);
    }
  }, [showStatsSkeleton, stats]);

  /** Unread count after KPI (header bell + ActionCenter chip). */
  const notificationsEnabled = useDeferredMount(!showStatsSkeleton && hasStatsData, 2000);

  // Refresh session uniquement après le 1er contrôle auth (évite faux positif au mount)
  useEffect(() => {
    if (
      !sessionHealthEnabled ||
      !sessionCheckComplete ||
      sessionRetrying ||
      sessionHealthy ||
      connectionStatus !== 'online'
    ) {
      return;
    }
    logger.debug('[Dashboard] Session unhealthy after check — refresh');
    void refreshSessionIfNeeded();
  }, [
    sessionHealthEnabled,
    sessionCheckComplete,
    sessionRetrying,
    sessionHealthy,
    connectionStatus,
    refreshSessionIfNeeded,
  ]);

  const { data: unreadCount = 0 } = useUnreadCount({ enabled: notificationsEnabled });

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
    if (!stats) return;
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

  const { i18n } = useTranslation();

  const handleCustomDateChange = useCallback(
    (startDate: Date | undefined, endDate: Date | undefined) => {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      // ✅ ACCESSIBILITÉ: Annoncer le changement de période
      if (startDate && endDate) {
        const start = formatLocaleDate(startDate, i18n.language);
        const end = formatLocaleDate(endDate, i18n.language);
        setStatusMessage(`Période modifiée : du ${start} au ${end}`);
        setTimeout(() => setStatusMessage(''), 3000);
      }
    },
    [i18n.language]
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

  return (
    <AppPageShell>
      <div className="dashboard-premium container mx-auto max-w-[90rem] p-3 sm:p-5 lg:p-8 pb-10">
        <div className="mb-5 sm:mb-6">
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

        {store?.id && <PhysicalSubscriptionAlert storeId={store.id} />}

        {store?.id && <SellerPushOptInBanner className="mb-5" variant="dashboard" />}

        {showStatsSkeleton ? (
          <DashboardFullSkeleton />
        ) : stats ? (
          <div className="space-y-5 sm:space-y-6">
            <DashboardActionCenter
              operational={stats.operational}
              periodLabel={stats.periodLabel}
              storeName={store?.name}
              storeSlug={store?.slug}
              storeSubdomain={store?.subdomain}
              customDomain={store?.custom_domain}
              unreadNotifications={unreadCount}
            />

            <div
              className={cn(
                'transition-opacity duration-200',
                isUpdating && 'opacity-60 pointer-events-none'
              )}
              aria-busy={isUpdating}
            >
              <DashboardStats stats={stats} />
            </div>

            {showSecondaryPanels ? (
              <Suspense fallback={secondaryChunkReady ? null : <DashboardSecondarySkeleton />}>
                <DashboardSecondaryPanels
                  stats={stats}
                  onViewAnalytics={handleViewAnalytics}
                  onCreateProduct={handleCreateProduct}
                  onCreateOrder={handleCreateOrder}
                  actionsRef={actionsRef}
                />
              </Suspense>
            ) : (
              !secondaryChunkReady && <DashboardSecondarySkeleton />
            )}
          </div>
        ) : null}
      </div>
    </AppPageShell>
  );
};

export default Dashboard;
