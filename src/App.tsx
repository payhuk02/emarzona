import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { PlatformCustomizationProvider } from '@/contexts/PlatformCustomizationContext';
import { SubdomainMiddleware } from '@/components/multi-tenant/SubdomainMiddleware';
import { ScrollToTop } from '@/components/navigation/ScrollToTop';
import { LoadingBar } from '@/components/navigation/LoadingBar';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useDarkMode } from '@/hooks/useDarkMode';
import { usePrefetch } from '@/hooks/usePrefetch';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreContext } from '@/contexts/StoreContext';
import { getRoutePrefetchConfig } from '@/lib/route-prefetch-config';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';

import React, { Suspense, lazy, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { SkipLink } from '@/components/accessibility/SkipLink';

// Lazy-loaded non-critical components
const PerformanceOptimizer = lazy(() =>
  import('@/components/optimization/PerformanceOptimizer').then(m => ({
    default: m.PerformanceOptimizer,
  }))
);
const CookieConsentBanner = lazy(() =>
  import('@/components/legal/CookieConsentBanner').then(m => ({ default: m.CookieConsentBanner }))
);
const CrispChat = lazy(() =>
  import('@/components/chat/CrispChat').then(m => ({ default: m.CrispChat }))
);
const BottomNavigation = lazy(() =>
  import('@/components/mobile/BottomNavigation').then(m => ({ default: m.BottomNavigation }))
);
const Require2FABanner = lazy(() =>
  import('@/components/auth/Require2FABanner').then(m => ({ default: m.Require2FABanner }))
);
const AffiliateLinkTracker = lazy(() =>
  import('@/components/affiliate/AffiliateLinkTracker').then(m => ({
    default: m.AffiliateLinkTracker,
  }))
);
const ReferralTracker = lazy(() =>
  import('@/components/referral/ReferralTracker').then(m => ({ default: m.ReferralTracker }))
);
const CurrencyRatesInitializer = lazy(() =>
  import('@/components/currency/CurrencyRatesInitializer').then(m => ({
    default: m.CurrencyRatesInitializer,
  }))
);
const PWAInstallPrompt = lazy(() =>
  import('@/components/mobile/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt }))
);
const PlatformPopupMessage = lazy(() =>
  import('@/components/platform/PlatformPopupMessage').then(m => ({
    default: m.PlatformPopupMessage,
  }))
);

const DynamicFavicon = lazy(() =>
  import('@/components/seo/DynamicFavicon').then(m => ({ default: m.DynamicFavicon }))
);
const AutoSEO = lazy(() => import('@/components/seo/AutoSEO').then(m => ({ default: m.AutoSEO })));

import { initSentry } from '@/lib/sentry';
import { initWebVitals } from '@/lib/web-vitals';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { cn } from '@/lib/utils';
import { shouldUseAppPremiumTheme } from '@/lib/premium-theme';
import { AppPremiumShell } from '@/components/layout/AppPremiumShell';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { startAlertMonitoring } from '@/lib/sentry-alerts';
import {
  createOptimizedQueryClient,
  setupCacheCleanup,
  optimizeLocalStorageCache,
} from '@/lib/cache-optimization';
import { updateSEOMetadata } from '@/lib/seo-enhancements';

// Route modules
import { publicRoutes } from '@/routes/publicRoutes';
import { customerRoutes } from '@/routes/customerRoutes';
import { dashboardRoutes } from '@/routes/dashboardRoutes';
import { adminRoutes } from '@/routes/adminRoutes';

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

type ErrorFallbackProps = {
  error?: unknown;
  onRetry?: () => void;
};

/** Réinitialise l'ErrorBoundary Sentry à chaque navigation (évite l'écran d'erreur bloqué). */
const SentryFallbackWithNavReset = ({
  error,
  resetError,
}: {
  error: unknown;
  resetError: () => void;
}) => {
  const location = useLocation();

  useEffect(() => {
    resetError();
  }, [location.pathname, resetError]);

  return <ErrorFallbackComponent error={error} onRetry={resetError} />;
};

const ErrorFallbackComponent = ({ error, onRetry }: ErrorFallbackProps) => {
  const isDev = import.meta.env.DEV;
  const showDetails = isDev || new URLSearchParams(window.location.search).has('debug');

  const errorMessage =
    error instanceof Error ? error.message : error != null ? String(error) : null;

  if (errorMessage) {
    logger.error('[Emarzona] Erreur interface:', { error });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md w-full p-8 bg-card rounded-lg shadow-lg text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-destructive"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Oops ! Une erreur est survenue</h1>
        <p className="text-muted-foreground mb-6">
          Nous avons été notifiés du problème et travaillons pour le résoudre.
        </p>
        {showDetails && errorMessage && (
          <div className="mb-6 p-4 bg-accent/50 border border-border rounded-lg text-left max-h-40 overflow-auto">
            <p className="text-sm font-semibold text-foreground mb-2">Détail technique</p>
            <p className="text-xs text-muted-foreground font-mono break-all">{errorMessage}</p>
          </div>
        )}
        {showDetails && !errorMessage && isDev && (
          <div className="mb-6 p-4 bg-accent/50 border border-border rounded-lg text-left">
            <p className="text-sm font-semibold text-foreground mb-2">Mode développement</p>
            <p className="text-xs text-muted-foreground">
              Ajoutez ?debug=1 à l&apos;URL ou ouvrez la console (F12).
            </p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
          >
            Recharger la page
          </button>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

const AppInitializer = ({
  queryClient,
}: {
  queryClient: ReturnType<typeof createOptimizedQueryClient>;
}) => {
  useEffect(() => {
    const stopAlertMonitoring = startAlertMonitoring(60000);
    const stopCacheCleanup = setupCacheCleanup(queryClient, 600000);
    optimizeLocalStorageCache();
    updateSEOMetadata({
      title: 'Emarzona - Plateforme de ecommerce et marketing',
      description: 'Créez et gérez votre boutique en ligne avec Emarzona',
    });
    return () => {
      stopAlertMonitoring();
      stopCacheCleanup();
    };
  }, [queryClient]);
  return null;
};

const AppContent = () => {
  useScrollRestoration();
  useDarkMode();
  const { user, loading: authLoading } = useAuth();
  const { stores, loading: storeLoading } = useStoreContext();
  const routePrefetch = getRoutePrefetchConfig(authLoading, storeLoading, user?.id, stores.length);
  const isMobile = useIsMobile();
  const location = useLocation();
  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/auth';
  const isBottomNavVisible = isMobile && location.pathname !== '/' && !isAuthPage;
  const usePremiumTheme = shouldUseAppPremiumTheme(location.pathname);

  useBehavioralAnalytics(undefined, {
    trackPageViews: false,
    trackProductViews: false,
    trackCartActions: true,
    trackSearchAndFilter: false,
    trackSocialInteractions: false,
    trackFormInteractions: true,
    enableRealTimeTracking: false,
    batchSize: 10,
    flushInterval: 30000,
  });

  usePrefetch({
    enabled: routePrefetch.enabled,
    idleRoutes: routePrefetch.idleRoutes,
    hoverRoutes: routePrefetch.hoverRoutes,
    idleDelayMs: routePrefetch.idleDelayMs,
  });

  useEffect(() => {
    initSentry();
    initWebVitals();
    import('@/lib/html-sanitizer').then(({ configureDOMPurify }) => {
      configureDOMPurify();
    });
    if (import.meta.env.PROD) {
      import('@/lib/performance-monitor').then(({ getPerformanceMonitor }) => {
        getPerformanceMonitor();
      });
    }
  }, []);

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <SentryErrorBoundary
        fallback={({ error, resetError }) => (
          <SentryFallbackWithNavReset error={error} resetError={resetError} />
        )}
        showDialog
      >
        <SkipLink />
        <Suspense fallback={null}>
          <DynamicFavicon />
        </Suspense>
        <Suspense fallback={null}>
          <AutoSEO />
        </Suspense>
        <LoadingBar />
        <ScrollToTop />
        <Suspense fallback={null}>
          <PerformanceOptimizer />
          <CurrencyRatesInitializer />
          <Require2FABanner position="top" />
          <AffiliateLinkTracker />
          <ReferralTracker />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          {(() => {
            const routes = (
              <div
                className={cn(
                  isBottomNavVisible && 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0'
                )}
              >
                <Routes>
                  {publicRoutes}
                  {customerRoutes}
                  {dashboardRoutes}
                  {adminRoutes}
                </Routes>
              </div>
            );
            return usePremiumTheme ? <AppPremiumShell>{routes}</AppPremiumShell> : routes;
          })()}
        </Suspense>
        <Suspense fallback={null}>
          <CookieConsentBanner />
          <CrispChat />
        </Suspense>
        <Suspense fallback={null}>
          {isBottomNavVisible && <BottomNavigation position="bottom" />}
        </Suspense>
        <Suspense fallback={null}>
          <PWAInstallPrompt showAsBanner={isMobile} />
          <PlatformPopupMessage />
        </Suspense>
      </SentryErrorBoundary>
    </ErrorBoundary>
  );
};

const queryClient = createOptimizedQueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <StoreProvider>
              <PlatformCustomizationProvider>
                <SubdomainMiddleware>
                  <AppInitializer queryClient={queryClient} />
                  <AppContent />
                </SubdomainMiddleware>
              </PlatformCustomizationProvider>
            </StoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
