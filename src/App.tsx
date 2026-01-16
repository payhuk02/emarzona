import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { StoreProvider } from '@/contexts/StoreContext';
import { PlatformCustomizationProvider } from '@/contexts/PlatformCustomizationContext';
import { SubdomainMiddleware } from '@/components/multi-tenant/SubdomainMiddleware';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ScrollToTop } from '@/components/navigation/ScrollToTop';
import { LoadingBar } from '@/components/navigation/LoadingBar';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';
import { useDarkMode } from '@/hooks/useDarkMode';
import { usePrefetch } from '@/hooks/usePrefetch';
import { usePrefetchRoutes } from '@/hooks/usePrefetchRoutes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBehavioralAnalytics } from '@/hooks/useBehavioralAnalytics';
import { useMobileGestures } from '@/hooks/useMobileGestures';
import React, { Suspense, lazy, useEffect } from 'react';
// PerformanceOptimizer - Lazy loaded (non-critique au démarrage)
const PerformanceOptimizer = lazy(() =>
  import('@/components/optimization/PerformanceOptimizer').then(m => ({
    default: m.PerformanceOptimizer,
  }))
);
// Composants non-critiques - Lazy loaded pour réduire le bundle initial
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
// PWA Install Prompt - Lazy loaded
const PWAInstallPrompt = lazy(() =>
  import('@/components/mobile/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt }))
);
// Marketing Automation Dashboard - Lazy loaded
const MarketingAutomationDashboard = lazy(() =>
  import('@/components/marketing/MarketingAutomationDashboard').then(m => ({
    default: m.MarketingAutomationDashboard,
  }))
);
// Quiz de style personnalisé - Lazy loaded
const StyleQuizPage = lazy(() =>
  import('@/pages/personalization/StyleQuizPage').then(m => ({ default: m.default }))
);
// AI Chatbot - Lazy loaded pour réduire le bundle initial
const AIChatbotWrapper = lazy(() =>
  import('@/components/ai/AIChatbotWrapper').then(m => ({ default: m.AIChatbotWrapper }))
);
import { initSentry } from '@/lib/sentry';
import { initWebVitals } from '@/lib/web-vitals';
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { startAlertMonitoring } from '@/lib/sentry-alerts';
import {
  createOptimizedQueryClient,
  setupCacheCleanup,
  optimizeLocalStorageCache,
} from '@/lib/cache-optimization';
import { updateSEOMetadata } from '@/lib/seo-enhancements';
// OPTIMISATION CRITIQUE: Lazy-load les composants non-critiques pour réduire le bundle initial
const SkipLink = lazy(() =>
  import('@/components/accessibility/SkipLink').then(m => ({ default: m.SkipLink }))
);
const DynamicFavicon = lazy(() =>
  import('@/components/seo/DynamicFavicon').then(m => ({ default: m.DynamicFavicon }))
);

// Composant de chargement pour le lazy loading
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Composant d'erreur pour Sentry - Complètement autonome sans dépendances externes
// pour éviter les problèmes de bundling en production
const ErrorFallbackComponent = () => {
  const isDev = import.meta.env.DEV;

  const handleReset = () => {
    // Réessayer en rechargeant la page
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            {/* SVG Alert Icon - Inline pour éviter les problèmes de bundling */}
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="8"
                x2="12"
                y2="12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="16"
                x2="12.01"
                y2="16"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Oops ! Une erreur est survenue
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Nous avons été notifiés du problème et travaillons pour le résoudre.
        </p>

        {isDev && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg text-left">
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
              Mode développement
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Vérifiez la console du navigateur pour plus de détails sur l'erreur.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Recharger la page
          </button>
          <button
            onClick={handleGoHome}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

// Pages principales - Lazy loading
const Landing = lazy(() => import('./pages/Landing'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() =>
  import('./pages/Dashboard')
    .then(m => ({ default: m.default }))
    .catch(error => {
      logger.error('Erreur lors du chargement du Dashboard', { error });
      // Retourner un composant de fallback en cas d'erreur
      return {
        default: () => (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Erreur de chargement</h2>
              <p className="text-muted-foreground">Impossible de charger le tableau de bord</p>
              <p className="text-sm text-red-500">{error?.message || 'Erreur inconnue'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Recharger
              </button>
            </div>
          </div>
        ),
      };
    })
);
const Products = lazy(() =>
  import('./pages/Products').catch(error => {
    logger.error('Erreur lors du chargement de Products:', error);
    // Retourner un composant de fallback en cas d'erreur
    return {
      default: () => (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
            <p className="text-muted-foreground">Impossible de charger la page Produits</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded"
            >
              Recharger
            </button>
          </div>
        </div>
      ),
    };
  })
);
const Store = lazy(() => import('./pages/Store'));
const StoreTeamManagement = lazy(() => import('./pages/store/StoreTeamManagement'));
const MyTasks = lazy(() => import('./pages/MyTasks'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const Marketing = lazy(() => import('./pages/Marketing').then(m => ({ default: m.default })));
const PromotionsPage = lazy(() =>
  import('./pages/Promotions').then(m => ({
    default: m.default,
  }))
);
const PromotionsStatsPage = lazy(() =>
  import('./pages/promotions/PromotionsStatsPage').then(m => ({
    default: m.PromotionsStatsPage,
  }))
);
const EmailCampaignsPage = lazy(() =>
  import('./pages/emails/EmailCampaignsPage').then(m => ({ default: m.EmailCampaignsPage }))
);
const EmailSequencesPage = lazy(() =>
  import('./pages/emails/EmailSequencesPage').then(m => ({ default: m.EmailSequencesPage }))
);
const EmailSegmentsPage = lazy(() =>
  import('./pages/emails/EmailSegmentsPage').then(m => ({ default: m.EmailSegmentsPage }))
);
const EmailAnalyticsPage = lazy(() =>
  import('./pages/emails/EmailAnalyticsPage').then(m => ({ default: m.EmailAnalyticsPage }))
);
const EmailTagsManagementPage = lazy(() =>
  import('./pages/emails/EmailTagsManagementPage').then(m => ({ default: m.default }))
);
const EmailWorkflowsPage = lazy(() =>
  import('./pages/emails/EmailWorkflowsPage').then(m => ({ default: m.EmailWorkflowsPage }))
);
const EmailTemplateEditorPage = lazy(() =>
  import('./pages/emails/EmailTemplateEditorPage').then(m => ({
    default: m.EmailTemplateEditorPage,
  }))
);
const Analytics = lazy(() => import('./pages/Analytics'));
const Payments = lazy(() => import('./pages/Payments'));
const PaymentsCustomers = lazy(() => import('./pages/PaymentsCustomers'));
const Withdrawals = lazy(() => import('./pages/Withdrawals'));
const PaymentMethods = lazy(() => import('./pages/PaymentMethods'));
const Settings = lazy(() => import('./pages/Settings'));
const CreateProduct = lazy(() => import('./pages/CreateProduct'));
const EditProduct = lazy(() => import('./pages/EditProduct'));
const Storefront = lazy(() => import('./pages/Storefront'));
const StoreLegalPage = lazy(() => import('./pages/StoreLegalPage'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Marketplace = lazy(() =>
  import('./pages/Marketplace')
    .then(m => ({ default: m.default }))
    .catch(error => {
      logger.error('Erreur lors du chargement de Marketplace:', { error });
      // Retourner un composant de fallback en cas d'erreur
      return {
        default: () => (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-xl font-semibold">Erreur de chargement</h2>
              <p className="text-muted-foreground">Impossible de charger la page Marketplace</p>
              <p className="text-sm text-red-500">{error?.message || 'Erreur inconnue'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Recharger
              </button>
            </div>
          </div>
        ),
      };
    })
);
const Cart = lazy(() => import('./pages/Cart'));
const CartEnhanced = lazy(() => import('./pages/CartEnhanced'));
const Checkout = lazy(() => import('./pages/checkout/Checkout'));
const ShippingServices = lazy(() => import('./pages/shipping/ShippingServices'));
const ContactShippingService = lazy(() => import('./pages/shipping/ContactShippingService'));
const ShippingServiceMessages = lazy(() => import('./pages/shipping/ShippingServiceMessages'));
const VendorMessaging = lazy(() => import('./pages/vendor/VendorMessaging'));
const CustomerPortal = lazy(() => import('./pages/customer/CustomerPortal'));
const CustomerMyOrders = lazy(() => import('./pages/customer/MyOrders'));
const CustomerMyDownloads = lazy(() => import('./pages/customer/MyDownloads'));
const CustomerMyCourses = lazy(() => import('./pages/customer/MyCourses'));
const CustomerMyProfile = lazy(() => import('./pages/customer/MyProfile'));
const CustomerMyWishlist = lazy(() => import('./pages/customer/CustomerMyWishlist'));
const CustomerDigitalPortal = lazy(() => import('./pages/customer/CustomerDigitalPortal'));
const CustomerPhysicalPortal = lazy(() => import('./pages/customer/CustomerPhysicalPortal'));
const CustomerMyInvoices = lazy(() => import('./pages/customer/CustomerMyInvoices'));
const CustomerMyReturns = lazy(() => import('./pages/customer/CustomerMyReturns'));
const CustomerLoyaltyPage = lazy(() => import('./pages/customer/CustomerLoyaltyPage'));
const CustomerMyGiftCardsPage = lazy(() => import('./pages/customer/CustomerMyGiftCardsPage'));
const PriceStockAlerts = lazy(() => import('./pages/customer/PriceStockAlerts'));
const NotFound = lazy(() => import('./pages/NotFound'));
const KYC = lazy(() => import('./pages/KYC'));
const AdminKYC = lazy(() => import('./pages/AdminKYC'));
const CommunityPage = lazy(() => import('./pages/community/CommunityPage'));
const PlatformRevenue = lazy(() => import('./pages/PlatformRevenue'));
const Referrals = lazy(() => import('./pages/Referrals'));
const SEOAnalyzer = lazy(() => import('./pages/SEOAnalyzer'));
const Pixels = lazy(() => import('./pages/Pixels'));
const AdvancedOrderManagement = lazy(() => import('./pages/AdvancedOrderManagement'));
const AdvancedOrderManagementSimple = lazy(() => import('./pages/AdvancedOrderManagementSimple'));

// Pages Admin - Lazy loading
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminStores = lazy(() => import('./pages/admin/AdminStores'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminSales = lazy(() => import('./pages/admin/AdminSales'));
const AdminReferrals = lazy(() => import('./pages/admin/AdminReferrals'));
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminCommunity = lazy(() => import('./pages/admin/AdminCommunity'));
const AdminCommissionSettings = lazy(() => import('./pages/admin/AdminCommissionSettings'));
const PlatformCustomization = lazy(() =>
  import('./pages/admin/PlatformCustomization')
    .then(m => ({ default: m.PlatformCustomization }))
    .catch(error => {
      logger.error('Erreur lors du chargement de PlatformCustomization:', { error });
      // Retourner un composant de fallback en cas d'erreur
      return {
        default: () => (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-center space-y-4 max-w-md">
              <h2 className="text-xl font-semibold">Erreur de chargement</h2>
              <p className="text-muted-foreground">
                Impossible de charger la page de personnalisation
              </p>
              <p className="text-sm text-red-500">{error?.message || 'Erreur inconnue'}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Recharger
              </button>
            </div>
          </div>
        ),
      };
    })
);
const AdminCommissionPayments = lazy(() => import('./pages/admin/AdminCommissionPayments'));
const MonerooAnalytics = lazy(() => import('./pages/admin/MonerooAnalytics'));
const MonerooReconciliation = lazy(() => import('./pages/admin/MonerooReconciliation'));
const TransactionMonitoring = lazy(() => import('./pages/admin/TransactionMonitoring'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminDisputes = lazy(() => import('./pages/admin/AdminDisputes'));
const AdminAffiliates = lazy(() => import('./pages/admin/AdminAffiliates'));
const AdminStoreWithdrawals = lazy(() => import('./pages/admin/AdminStoreWithdrawals'));
const AdminReviews = lazy(() =>
  import('./pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews }))
);
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'));
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AISettingsPage = lazy(() => import('./pages/admin/AISettingsPage'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const HistoryBasedRecommendations = lazy(() => import('./pages/HistoryBasedRecommendations'));
const Discover = lazy(() => import('./pages/Discover'));
const Trending = lazy(() => import('./pages/Trending'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminTransactionReconciliation = lazy(
  () => import('./pages/admin/AdminTransactionReconciliation')
);
const AdminShipping = lazy(() => import('./pages/admin/AdminShipping'));
const AdminShippingConversations = lazy(() => import('./pages/admin/AdminShippingConversations'));
const AdminVendorConversations = lazy(() => import('./pages/admin/AdminVendorConversations'));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'));
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity'));
const AdminAudit = lazy(() => import('./pages/admin/AdminAudit'));
const AdminTaxManagement = lazy(() => import('./pages/admin/AdminTaxManagement'));
const AdminReturnManagement = lazy(() => import('./pages/admin/AdminReturnManagement'));
const AdminWebhookManagement = lazy(() => import('./pages/admin/AdminWebhookManagement'));
// Les anciens composants DigitalProductWebhooks et PhysicalProductWebhooks sont remplacés par le système unifié
// Redirection vers /dashboard/webhooks dans les routes
const PhysicalInventoryManagement = lazy(() => import('./pages/admin/PhysicalInventoryManagement'));
const PhysicalPromotions = lazy(() => import('./pages/admin/PhysicalPromotions'));
const AdminLoyaltyManagement = lazy(() => import('./pages/admin/AdminLoyaltyManagement'));
const AdminGiftCardManagement = lazy(() => import('./pages/admin/AdminGiftCardManagement'));
const AdminSuppliersManagement = lazy(() => import('./pages/admin/AdminSuppliersManagement'));
const AdminWarehousesManagement = lazy(() => import('./pages/admin/AdminWarehousesManagement'));
const AdminProductKitsManagement = lazy(() => import('./pages/admin/AdminProductKitsManagement'));
const AdminDemandForecasting = lazy(() => import('./pages/admin/AdminDemandForecasting'));
const AdminCostOptimization = lazy(() => import('./pages/admin/AdminCostOptimization'));
const AdminBatchShipping = lazy(() => import('./pages/admin/AdminBatchShipping'));
const PhysicalProductsAnalytics = lazy(() => import('./pages/admin/PhysicalProductsAnalytics'));
const PhysicalProductsLots = lazy(() => import('./pages/admin/PhysicalProductsLots'));
const PhysicalProductsSerialTracking = lazy(
  () => import('./pages/admin/PhysicalProductsSerialTracking')
);
const PhysicalBarcodeScanner = lazy(() => import('./pages/admin/PhysicalBarcodeScanner'));
const PhysicalPreOrders = lazy(() => import('./pages/admin/PhysicalPreOrders'));
const PhysicalBackorders = lazy(() => import('./pages/admin/PhysicalBackorders'));
const PhysicalBundles = lazy(() => import('./pages/admin/PhysicalBundles'));
const PhysicalMultiCurrency = lazy(() => import('./pages/admin/PhysicalMultiCurrency'));
const AdvancedCalendarPage = lazy(() => import('./pages/service/AdvancedCalendarPage'));
const ServiceManagementPage = lazy(() => import('./pages/service/ServiceManagementPage'));
const RecurringBookingsPage = lazy(() => import('./pages/service/RecurringBookingsPage'));
const CalendarIntegrationsPage = lazy(() => import('./pages/service/CalendarIntegrationsPage'));
const ServiceWaitlistManagementPage = lazy(
  () => import('./pages/service/ServiceWaitlistManagementPage')
);
const BookingRemindersManagementPage = lazy(
  () => import('./pages/service/BookingRemindersManagementPage')
);
const IntegrationsPage = lazy(() => import('./pages/admin/IntegrationsPage'));
const GamificationPage = lazy(() => import('./pages/gamification/GamificationPage'));

// Pages Affiliation - Lazy loading
const StoreAffiliates = lazy(() => import('./pages/StoreAffiliates'));
const AffiliateDashboard = lazy(() => import('./pages/AffiliateDashboard'));
const CourseAffiliate = lazy(() => import('./pages/affiliate/CourseAffiliate'));
const AffiliateCoursesDashboard = lazy(() => import('./pages/affiliate/AffiliateCoursesDashboard'));
const ShortLinkRedirect = lazy(() =>
  import('./pages/affiliate/ShortLinkRedirect').then(m => ({ default: m.ShortLinkRedirect }))
);

// Pages Légales - Lazy loading
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));

// Pages Moneroo (paiement) - Lazy loading
const PaymentSuccess = lazy(() => import('./pages/payments/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./pages/payments/PaymentCancel'));

// Pages Cours - Lazy loading
const MyCourses = lazy(() => import('./pages/courses/MyCourses'));
const CreateCourse = lazy(() => import('./pages/courses/CreateCourse'));
const CourseDetail = lazy(() => import('./pages/courses/CourseDetail'));
const CourseAnalytics = lazy(() => import('./pages/courses/CourseAnalytics'));
const CohortsManagementPage = lazy(() => import('./pages/courses/CohortsManagementPage'));
const CohortDetailPage = lazy(() => import('./pages/courses/CohortDetailPage'));

// Pages Notifications - Lazy loading
const NotificationSettings = lazy(() => import('./pages/settings/NotificationSettings'));

// Pages Produits Digitaux - Lazy loading
const DigitalProductsList = lazy(() => import('./pages/digital/DigitalProductsList'));
const DigitalProductDetail = lazy(() => import('./pages/digital/DigitalProductDetail'));
const DigitalProductsSearch = lazy(() =>
  import('./pages/digital/DigitalProductsSearch').then(
    (m: { DigitalProductsSearch: React.ComponentType<Record<string, unknown>> }) => ({
      default: m.DigitalProductsSearch,
    })
  )
);
const DigitalProductsCompare = lazy(() =>
  import('./pages/digital/DigitalProductsCompare').then(
    (m: { DigitalProductsCompare: React.ComponentType<Record<string, unknown>> }) => ({
      default: m.DigitalProductsCompare,
    })
  )
);
const SharedWishlist = lazy(() => import('./pages/customer/SharedWishlist'));
const MyDownloads = lazy(() => import('./pages/digital/MyDownloads'));
const CreateBundle = lazy(() => import('./pages/digital/CreateBundle'));
const BundleDetail = lazy(() => import('./pages/digital/BundleDetail'));
const DigitalBundlesManagement = lazy(() => import('./pages/dashboard/DigitalBundlesManagement'));
const LiveSessionsManagement = lazy(() => import('./pages/dashboard/LiveSessionsManagement'));
const AssignmentsManagement = lazy(() => import('./pages/dashboard/AssignmentsManagement'));
const ReviewsManagement = lazy(() => import('./pages/dashboard/ReviewsManagement'));
const CourseGamificationDashboard = lazy(
  () => import('./pages/courses/CourseGamificationDashboard')
);
const CouponsManagement = lazy(() => import('./pages/dashboard/CouponsManagement'));
const AnalyticsDashboardsManagement = lazy(
  () => import('./pages/dashboard/AnalyticsDashboardsManagement')
);
const AbandonedCartsManagement = lazy(() => import('./pages/dashboard/AbandonedCartsManagement'));
const TaxManagement = lazy(() => import('./pages/dashboard/TaxManagement'));
const MultiStoreCheckoutTracking = lazy(
  () => import('./pages/checkout/MultiStoreCheckoutTracking')
);
const ProductsCompare = lazy(() => import('./pages/ProductsCompare'));
const NotificationsManagement = lazy(() => import('./pages/notifications/NotificationsManagement'));
const ServiceCalendarManagement = lazy(() => import('./pages/service/ServiceCalendarManagement'));
const CustomerWarranties = lazy(() => import('./pages/customer/CustomerWarranties'));
const PhysicalProductsLotsManagement = lazy(
  () => import('./pages/dashboard/PhysicalProductsLotsManagement')
);
const SuppliersManagement = lazy(() => import('./pages/dashboard/SuppliersManagement'));
const DemandForecasting = lazy(() => import('./pages/dashboard/DemandForecasting'));
const InventoryAnalytics = lazy(() => import('./pages/dashboard/InventoryAnalytics'));
const MyLicenses = lazy(() => import('./pages/digital/MyLicenses'));
const LicenseManagement = lazy(() => import('./pages/digital/LicenseManagement'));
const DigitalProductAnalytics = lazy(() => import('./pages/digital/DigitalProductAnalytics'));
const DigitalProductVersionsManagement = lazy(
  () => import('./pages/digital/DigitalProductVersionsManagement')
);

// Pages Services - Lazy loading
const RecurringBookingsManagement = lazy(
  () => import('./pages/service/RecurringBookingsManagement')
);

// Pages Advanced Systems - Lazy loading
const OrderMessaging = lazy(() => import('./pages/orders/OrderMessaging'));
const PaymentManagement = lazy(() => import('./pages/payments/PaymentManagement'));
const PaymentManagementList = lazy(() => import('./pages/payments/PaymentManagementList'));
const DisputeDetail = lazy(() => import('./pages/disputes/DisputeDetail'));
const PayBalance = lazy(() => import('./pages/payments/PayBalance'));
const PayBalanceList = lazy(() => import('./pages/payments/PayBalanceList'));
const ShippingDashboard = lazy(() => import('./pages/shipping/ShippingDashboard'));
const InventoryDashboard = lazy(() => import('./pages/inventory/InventoryDashboard'));
const StoreAffiliateManagement = lazy(() => import('./pages/dashboard/StoreAffiliateManagement'));
const DigitalProductUpdatesDashboard = lazy(
  () => import('./pages/digital/DigitalProductUpdatesDashboard')
);
const StaffAvailabilityCalendar = lazy(() => import('./pages/service/StaffAvailabilityCalendar'));
const ResourceConflictManagement = lazy(() => import('./pages/service/ResourceConflictManagement'));

// Pages Produits Physiques & Services - Détails
const PhysicalProductDetail = lazy(() => import('./pages/physical/PhysicalProductDetail'));
const ServiceDetail = lazy(() => import('./pages/service/ServiceDetail'));
const BookingsManagement = lazy(() => import('./pages/service/BookingsManagement'));
const ArtistProductDetail = lazy(() => import('./pages/artist/ArtistProductDetail'));
const ArtistPortfolioPage = lazy(() => import('./pages/artist/ArtistPortfolioPage'));
const CollectionsPage = lazy(() =>
  import('./pages/artist/CollectionsPage').then(m => ({ default: m.default }))
);
const CollectionDetail = lazy(() =>
  import('./components/artist/CollectionDetail').then(m => ({ default: m.CollectionDetail }))
);
const ArtistPortfoliosManagement = lazy(
  () => import('./pages/dashboard/ArtistPortfoliosManagement')
);
const AuctionsManagementPage = lazy(() => import('./pages/artist/AuctionsManagementPage'));
const AuctionDetailPage = lazy(() => import('./pages/artist/AuctionDetailPage'));
const AuctionsWatchlistPage = lazy(() => import('./pages/artist/AuctionsWatchlistPage'));
const AuctionsListPage = lazy(() => import('./pages/artist/AuctionsListPage'));

const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminErrorMonitoring = lazy(() => import('./pages/admin/AdminErrorMonitoring'));
const AdminMonitoring = lazy(() => import('./pages/admin/AdminMonitoring'));
const AdminAccessibilityReport = lazy(() => import('./pages/admin/AdminAccessibilityReport'));
const StorageDiagnosticPage = lazy(() => import('./pages/admin/StorageDiagnosticPage'));

// Page de test i18n (à supprimer en production)
const I18nTest = lazy(() => import('./pages/I18nTest'));

// Routes Email publiques
const UnsubscribePage = lazy(() => import('./pages/UnsubscribePage'));

// Composant de redirection pour l'ancienne route
const OldProductRouteRedirect = () => {
  const { slug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  return <Navigate to={`/stores/${slug}/products/${productSlug}`} replace />;
};

/**
 * Composant d'initialisation de l'application
 * Configure les alertes, le cache et le SEO
 */
const AppInitializer = ({
  queryClient,
}: {
  queryClient: ReturnType<typeof createOptimizedQueryClient>;
}) => {
  useEffect(() => {
    // Démarrer le monitoring des alertes Sentry
    const stopAlertMonitoring = startAlertMonitoring(60000); // Vérifier toutes les minutes

    // Configurer le nettoyage automatique du cache
    const stopCacheCleanup = setupCacheCleanup(queryClient, 600000); // Nettoyer toutes les 10 minutes

    // Optimiser le cache localStorage au démarrage
    optimizeLocalStorageCache();

    // Mettre à jour les métadonnées SEO par défaut
    updateSEOMetadata({
      title: 'Emarzona - Plateforme de ecommerce et marketing',
      description: 'Créez et gérez votre boutique en ligne avec Emarzona',
    });

    // Cleanup
    return () => {
      stopAlertMonitoring();
      stopCacheCleanup();
    };
  }, [queryClient]);

  return null;
};

const AppContent = () => {
  useScrollRestoration();
  useDarkMode(); // Active le mode sombre globalement
  const isMobile = useIsMobile(); // Détecter si mobile
  const location = useLocation(); // Pour vérifier la route actuelle
  const isBottomNavVisible = isMobile && location.pathname !== '/' && location.pathname !== '/auth';

  // Analytics comportementales
  // Les fonctions track* sont disponibles mais non utilisées actuellement
  // Elles sont gardées pour une utilisation future
  useBehavioralAnalytics(undefined, {
    trackPageViews: false, // Désactiver temporairement pour améliorer les performances
    trackProductViews: false,
    trackCartActions: true,
    trackSearchAndFilter: false,
    trackSocialInteractions: false,
    trackFormInteractions: true,
    enableRealTimeTracking: false,
    batchSize: 10,
    flushInterval: 30000,
  });

  // Gestes mobiles
  useMobileGestures(
    {
      onSwipeLeft: () => {
        // Navigation vers la droite (produit suivant, etc.)
        // Swipe left detected
      },
      onSwipeRight: () => {
        // Navigation vers la gauche (produit précédent, etc.)
        // Swipe right detected
      },
      onSwipeUp: () => {
        // Fermer modal, scroll up, etc.
        // Swipe up detected
      },
      onSwipeDown: () => {
        // Ouvrir menu, pull to refresh, etc.
        // Swipe down detected
      },
      onDoubleTap: () => {
        // Like, zoom, etc.
        // Double tap detected
      },
    },
    {
      swipeThreshold: 50,
      enableSwipe: isMobile,
      enableDoubleTap: isMobile,
    }
  );

  // Track page views (désactivé actuellement, trackPageViews: false)
  // useEffect(() => {
  //   trackPageView(location.pathname + location.search, document.referrer);
  // }, [location, trackPageView]);

  // Prefetching intelligent des routes et données fréquentes
  usePrefetch({
    routes: [
      '/dashboard',
      '/dashboard/products',
      '/dashboard/orders',
      '/dashboard/analytics',
      '/marketplace',
      '/cart',
    ],
    delay: 100, // Délai de 100ms avant prefetch au hover
  });

  // Prefetch intelligent des routes critiques (améliore Web Vitals)
  usePrefetchRoutes();

  // Initialiser Sentry, Web Vitals et Performance Monitoring au montage
  useEffect(() => {
    initSentry();
    initWebVitals();

    // Initialiser DOMPurify pour sécurité XSS
    import('@/lib/html-sanitizer').then(({ configureDOMPurify }) => {
      configureDOMPurify();
    });

    // Initialiser le monitoring de performance
    if (import.meta.env.PROD) {
      import('@/lib/performance-monitor').then(({ getPerformanceMonitor }) => {
        // Initialise l'observateur de performance (singleton)
        getPerformanceMonitor();
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <SentryErrorBoundary fallback={<ErrorFallbackComponent />} showDialog>
        {/* Composants non-critiques lazy-loaded - Chargés après FCP */}
        <Suspense fallback={null}>
          <SkipLink />
          <DynamicFavicon />
        </Suspense>
        <LoadingBar />
        <ScrollToTop />
        {/* Composants non-critiques lazy-loaded - Chargés après FCP pour améliorer les Web Vitals */}
        <Suspense fallback={null}>
          <PerformanceOptimizer />
          <CurrencyRatesInitializer />
          <Require2FABanner position="top" />
          <AffiliateLinkTracker />
          <ReferralTracker />
        </Suspense>
        <Suspense fallback={<LoadingFallback />}>
          <div
            // Empêcher la bottom nav de masquer le contenu sur mobile (iPhone Safari + Android Chrome)
            className={cn(
              isBottomNavVisible && 'pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0'
            )}
          >
            <Routes>
              {/* --- Routes publiques --- */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/auth/login" element={<Navigate to="/auth" replace />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route
                path="/recommendations/history-based"
                element={<HistoryBasedRecommendations />}
              />
              <Route path="/discover" element={<Discover />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/personalization/quiz" element={<StyleQuizPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/cart" element={<CartEnhanced />} />
              <Route path="/cart-old" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/checkout/multi-store-tracking"
                element={
                  <ProtectedRoute>
                    <MultiStoreCheckoutTracking />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Customer Portal --- */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <CustomerPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/orders"
                element={
                  <ProtectedRoute>
                    <CustomerMyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/downloads"
                element={
                  <ProtectedRoute>
                    <CustomerMyDownloads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/warranties"
                element={
                  <ProtectedRoute>
                    <CustomerWarranties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/digital"
                element={
                  <ProtectedRoute>
                    <CustomerDigitalPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/physical"
                element={
                  <ProtectedRoute>
                    <CustomerPhysicalPortal />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/courses"
                element={
                  <ProtectedRoute>
                    <CustomerMyCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/profile"
                element={
                  <ProtectedRoute>
                    <CustomerMyProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/wishlist"
                element={
                  <ProtectedRoute>
                    <CustomerMyWishlist />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/alerts"
                element={
                  <ProtectedRoute>
                    <PriceStockAlerts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/invoices"
                element={
                  <ProtectedRoute>
                    <CustomerMyInvoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/returns"
                element={
                  <ProtectedRoute>
                    <CustomerMyReturns />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/loyalty"
                element={
                  <ProtectedRoute>
                    <CustomerLoyaltyPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/gift-cards"
                element={
                  <ProtectedRoute>
                    <CustomerMyGiftCardsPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirection de l'ancienne route vers la nouvelle */}
              <Route
                path="/store/:slug/product/:productSlug"
                element={<OldProductRouteRedirect />}
              />

              <Route path="/stores/:slug" element={<Storefront />} />
              <Route path="/stores/:slug/products/:productSlug" element={<ProductDetail />} />
              <Route path="/stores/:slug/legal/:page" element={<StoreLegalPage />} />

              {/* --- Route de test i18n (uniquement en développement) --- */}
              {import.meta.env.DEV && <Route path="/i18n-test" element={<I18nTest />} />}

              {/* --- Routes Légales (publiques) --- */}
              <Route path="/legal/terms" element={<TermsOfService />} />
              <Route path="/legal/privacy" element={<PrivacyPolicy />} />
              <Route path="/legal/cookies" element={<CookiePolicy />} />
              <Route path="/legal/refund" element={<RefundPolicy />} />

              {/* --- Routes Email (publiques) --- */}
              <Route path="/unsubscribe" element={<UnsubscribePage />} />

              {/* --- Routes Moneroo --- */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentCancel />} />

              {/* --- Routes utilisateur (protégées) --- */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/store"
                element={
                  <ProtectedRoute>
                    <Store />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/store/team"
                element={
                  <ProtectedRoute>
                    <StoreTeamManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/tasks"
                element={
                  <ProtectedRoute>
                    <MyTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/withdrawals"
                element={
                  <ProtectedRoute>
                    <Withdrawals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/payment-methods"
                element={
                  <ProtectedRoute>
                    <PaymentMethods />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/advanced-orders"
                element={
                  <ProtectedRoute>
                    <AdvancedOrderManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/advanced-orders-test"
                element={
                  <ProtectedRoute>
                    <AdvancedOrderManagementSimple />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/customers"
                element={
                  <ProtectedRoute>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/marketing"
                element={
                  <ProtectedRoute>
                    <Marketing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/promotions"
                element={
                  <ProtectedRoute>
                    <PromotionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/promotions/stats"
                element={
                  <ProtectedRoute>
                    <PromotionsStatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/campaigns"
                element={
                  <ProtectedRoute>
                    <EmailCampaignsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/sequences"
                element={
                  <ProtectedRoute>
                    <EmailSequencesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/segments"
                element={
                  <ProtectedRoute>
                    <EmailSegmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/analytics"
                element={
                  <ProtectedRoute>
                    <EmailAnalyticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/workflows"
                element={
                  <ProtectedRoute>
                    <EmailWorkflowsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/tags"
                element={
                  <ProtectedRoute>
                    <EmailTagsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/emails/templates/editor"
                element={
                  <ProtectedRoute>
                    <EmailTemplateEditorPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/payments"
                element={
                  <ProtectedRoute>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/payments-customers"
                element={
                  <ProtectedRoute>
                    <PaymentsCustomers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/kyc"
                element={
                  <ProtectedRoute>
                    <KYC />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/referrals"
                element={
                  <ProtectedRoute>
                    <Referrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/pixels"
                element={
                  <ProtectedRoute>
                    <Pixels />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/seo"
                element={
                  <ProtectedRoute>
                    <SEOAnalyzer />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products/new"
                element={
                  <ProtectedRoute>
                    <CreateProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products/new/:type"
                element={
                  <ProtectedRoute>
                    <CreateProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/products/:id/edit"
                element={
                  <ProtectedRoute>
                    <EditProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/webhooks"
                element={
                  <ProtectedRoute>
                    <AdminWebhookManagement />
                  </ProtectedRoute>
                }
              />
              {/* Redirection des anciens webhooks vers le système unifié */}
              <Route
                path="/dashboard/digital-webhooks"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard/webhooks" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-webhooks"
                element={
                  <ProtectedRoute>
                    <Navigate to="/dashboard/webhooks" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-inventory"
                element={
                  <ProtectedRoute>
                    <PhysicalInventoryManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-promotions"
                element={
                  <ProtectedRoute>
                    <PhysicalPromotions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-analytics"
                element={
                  <ProtectedRoute>
                    <PhysicalProductsAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-lots"
                element={
                  <ProtectedRoute>
                    <PhysicalProductsLotsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-lots/:productId"
                element={
                  <ProtectedRoute>
                    <PhysicalProductsLotsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-lots-old"
                element={
                  <ProtectedRoute>
                    <PhysicalProductsLots />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-serial-tracking"
                element={
                  <ProtectedRoute>
                    <PhysicalProductsSerialTracking />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/suppliers"
                element={
                  <ProtectedRoute>
                    <SuppliersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/demand-forecasting"
                element={
                  <ProtectedRoute>
                    <DemandForecasting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/inventory-analytics"
                element={
                  <ProtectedRoute>
                    <InventoryAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-barcode-scanner"
                element={
                  <ProtectedRoute>
                    <PhysicalBarcodeScanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-preorders"
                element={
                  <ProtectedRoute>
                    <PhysicalPreOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-backorders"
                element={
                  <ProtectedRoute>
                    <PhysicalBackorders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/physical-bundles"
                element={
                  <ProtectedRoute>
                    <PhysicalBundles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/multi-currency"
                element={
                  <ProtectedRoute>
                    <PhysicalMultiCurrency />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/loyalty"
                element={
                  <ProtectedRoute>
                    <AdminLoyaltyManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/gift-cards"
                element={
                  <ProtectedRoute>
                    <AdminGiftCardManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/suppliers"
                element={
                  <ProtectedRoute>
                    <AdminSuppliersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/warehouses"
                element={
                  <ProtectedRoute>
                    <AdminWarehousesManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/product-kits"
                element={
                  <ProtectedRoute>
                    <AdminProductKitsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/demand-forecasting"
                element={
                  <ProtectedRoute>
                    <AdminDemandForecasting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/cost-optimization"
                element={
                  <ProtectedRoute>
                    <AdminCostOptimization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/batch-shipping"
                element={
                  <ProtectedRoute>
                    <AdminBatchShipping />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Affiliation --- */}
              <Route
                path="/dashboard/store-affiliates"
                element={
                  <ProtectedRoute>
                    <StoreAffiliateManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/affiliates"
                element={
                  <ProtectedRoute>
                    <StoreAffiliates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/affiliate/dashboard"
                element={
                  <ProtectedRoute>
                    <AffiliateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/affiliate/courses"
                element={
                  <ProtectedRoute>
                    <AffiliateCoursesDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/affiliate/courses/:slug"
                element={
                  <ProtectedRoute>
                    <CourseAffiliate />
                  </ProtectedRoute>
                }
              />

              {/* --- Route de redirection pour liens courts d'affiliation --- */}
              <Route path="/aff/:code" element={<ShortLinkRedirect />} />

              {/* --- Routes Notifications --- */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsManagement />
                  </ProtectedRoute>
                }
              />
              {/* Redirection de l'ancienne route vers la nouvelle page unifiée */}
              <Route
                path="/notifications/center"
                element={<Navigate to="/notifications" replace />}
              />
              <Route
                path="/settings/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationSettings />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Cours --- */}
              <Route
                path="/dashboard/my-courses"
                element={
                  <ProtectedRoute>
                    <MyCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/courses/new"
                element={
                  <ProtectedRoute>
                    <CreateCourse />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/courses/live-sessions"
                element={
                  <ProtectedRoute>
                    <LiveSessionsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/courses/assignments"
                element={
                  <ProtectedRoute>
                    <AssignmentsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/reviews"
                element={
                  <ProtectedRoute>
                    <ReviewsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/courses/:courseId/gamification"
                element={
                  <ProtectedRoute>
                    <CourseGamificationDashboard />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Cohorts --- */}
              <Route
                path="/dashboard/cohorts"
                element={
                  <ProtectedRoute>
                    <CohortsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/cohorts/:cohortId"
                element={
                  <ProtectedRoute>
                    <CohortDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/courses/:courseId/cohorts"
                element={
                  <ProtectedRoute>
                    <CohortsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/coupons"
                element={
                  <ProtectedRoute>
                    <CouponsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/analytics/dashboards"
                element={
                  <ProtectedRoute>
                    <AnalyticsDashboardsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/abandoned-carts"
                element={
                  <ProtectedRoute>
                    <AbandonedCartsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/taxes"
                element={
                  <ProtectedRoute>
                    <TaxManagement />
                  </ProtectedRoute>
                }
              />
              <Route path="/courses/:slug" element={<CourseDetail />} />
              <Route
                path="/courses/:slug/analytics"
                element={
                  <ProtectedRoute>
                    <CourseAnalytics />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Produits Digitaux --- */}
              <Route
                path="/dashboard/digital-products"
                element={
                  <ProtectedRoute>
                    <DigitalProductsList />
                  </ProtectedRoute>
                }
              />
              <Route path="/digital/search" element={<DigitalProductsSearch />} />
              <Route path="/digital/compare" element={<DigitalProductsCompare />} />
              <Route path="/products/compare" element={<ProductsCompare />} />
              <Route path="/digital/:productId" element={<DigitalProductDetail />} />
              <Route path="/wishlist/shared/:token" element={<SharedWishlist />} />
              <Route
                path="/dashboard/my-downloads"
                element={
                  <ProtectedRoute>
                    <MyDownloads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/digital-products/bundles"
                element={
                  <ProtectedRoute>
                    <DigitalBundlesManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/digital-products/bundles/create"
                element={
                  <ProtectedRoute>
                    <CreateBundle />
                  </ProtectedRoute>
                }
              />
              <Route path="/bundles/:bundleId" element={<BundleDetail />} />
              <Route
                path="/dashboard/my-licenses"
                element={
                  <ProtectedRoute>
                    <MyLicenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/licenses/manage/:id"
                element={
                  <ProtectedRoute>
                    <LicenseManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/license-management"
                element={
                  <ProtectedRoute>
                    <MyLicenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/digital/analytics/:productId"
                element={
                  <ProtectedRoute>
                    <DigitalProductAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/digital/updates"
                element={
                  <ProtectedRoute>
                    <DigitalProductUpdatesDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/digital/updates/:productId"
                element={
                  <ProtectedRoute>
                    <DigitalProductUpdatesDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/digital/products/:productId/versions"
                element={
                  <ProtectedRoute>
                    <DigitalProductVersionsManagement />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Services --- */}
              <Route
                path="/dashboard/services/staff-availability"
                element={
                  <ProtectedRoute>
                    <StaffAvailabilityCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/calendar"
                element={
                  <ProtectedRoute>
                    <ServiceCalendarManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/calendar/:serviceId"
                element={
                  <ProtectedRoute>
                    <ServiceCalendarManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/staff-availability/:serviceId"
                element={
                  <ProtectedRoute>
                    <StaffAvailabilityCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/resource-conflicts"
                element={
                  <ProtectedRoute>
                    <ResourceConflictManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/recurring-bookings"
                element={
                  <ProtectedRoute>
                    <RecurringBookingsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/calendar-integrations"
                element={
                  <ProtectedRoute>
                    <CalendarIntegrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/waitlist"
                element={
                  <ProtectedRoute>
                    <ServiceWaitlistManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/services/reminders"
                element={
                  <ProtectedRoute>
                    <BookingRemindersManagementPage />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Advanced Systems (Messaging, Payments, Disputes) --- */}
              <Route
                path="/orders/:orderId/messaging"
                element={
                  <ProtectedRoute>
                    <OrderMessaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments/:orderId/manage"
                element={
                  <ProtectedRoute>
                    <PaymentManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments/:orderId/balance"
                element={
                  <ProtectedRoute>
                    <PayBalance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/disputes/:disputeId"
                element={
                  <ProtectedRoute>
                    <DisputeDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shipping"
                element={
                  <ProtectedRoute>
                    <ShippingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryDashboard />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Dashboard Advanced Features --- */}
              <Route
                path="/dashboard/payment-management"
                element={
                  <ProtectedRoute>
                    <PaymentManagementList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/pay-balance"
                element={
                  <ProtectedRoute>
                    <PayBalanceList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/shipping"
                element={
                  <ProtectedRoute>
                    <ShippingDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/shipping-services"
                element={
                  <ProtectedRoute>
                    <ShippingServices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/contact-shipping-service"
                element={
                  <ProtectedRoute>
                    <ContactShippingService />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/shipping-service-messages/:conversationId"
                element={
                  <ProtectedRoute>
                    <ShippingServiceMessages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/messaging/:storeId/:productId?"
                element={
                  <ProtectedRoute>
                    <VendorMessaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vendor/messaging"
                element={
                  <ProtectedRoute>
                    <VendorMessaging />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/inventory"
                element={
                  <ProtectedRoute>
                    <InventoryDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/bookings"
                element={
                  <ProtectedRoute>
                    <BookingsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/advanced-calendar"
                element={
                  <ProtectedRoute>
                    <AdvancedCalendarPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/recurring-bookings"
                element={
                  <ProtectedRoute>
                    <RecurringBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/service-management"
                element={
                  <ProtectedRoute>
                    <ServiceManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/gamification"
                element={
                  <ProtectedRoute>
                    <GamificationPage />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Product Details (Physical, Services) --- */}
              <Route path="/physical/:productId" element={<PhysicalProductDetail />} />
              <Route path="/service/:serviceId" element={<ServiceDetail />} />
              <Route path="/artist/:productId" element={<ArtistProductDetail />} />

              {/* --- Routes Artist Portfolios --- */}
              <Route path="/portfolio/:slug" element={<ArtistPortfolioPage />} />
              <Route
                path="/dashboard/portfolios"
                element={
                  <ProtectedRoute>
                    <ArtistPortfoliosManagement />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Collections d'Œuvres --- */}
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/collections/:collectionSlug" element={<CollectionDetail />} />
              <Route path="/stores/:storeSlug/collections" element={<CollectionsPage />} />
              <Route
                path="/stores/:storeSlug/collections/:collectionSlug"
                element={<CollectionDetail />}
              />

              {/* --- Routes Artist Auctions --- */}
              <Route path="/auctions" element={<AuctionsListPage />} />
              <Route path="/auctions/:slug" element={<AuctionDetailPage />} />
              <Route
                path="/dashboard/auctions"
                element={
                  <ProtectedRoute>
                    <AuctionsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/auctions/watchlist"
                element={
                  <ProtectedRoute>
                    <AuctionsWatchlistPage />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Service Management --- */}
              <Route
                path="/bookings/manage"
                element={
                  <ProtectedRoute>
                    <BookingsManagement />
                  </ProtectedRoute>
                }
              />

              {/* --- Routes Demo --- */}

              {/* --- Routes administrateur --- */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/stores"
                element={
                  <ProtectedRoute>
                    <AdminStores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/products"
                element={
                  <ProtectedRoute>
                    <AdminProducts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sales"
                element={
                  <ProtectedRoute>
                    <AdminSales />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/referrals"
                element={
                  <ProtectedRoute>
                    <AdminReferrals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/activity"
                element={
                  <ProtectedRoute>
                    <AdminActivity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/commission-settings"
                element={
                  <ProtectedRoute>
                    <AdminCommissionSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/commission-payments"
                element={
                  <ProtectedRoute>
                    <AdminCommissionPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/platform-customization"
                element={
                  <ProtectedRoute>
                    <PlatformCustomization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/moneroo-analytics"
                element={
                  <ProtectedRoute>
                    <MonerooAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/moneroo-reconciliation"
                element={
                  <ProtectedRoute>
                    <MonerooReconciliation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/transaction-monitoring"
                element={
                  <ProtectedRoute>
                    <TransactionMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <ProtectedRoute>
                    <AdminNotifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/revenue"
                element={
                  <ProtectedRoute>
                    <PlatformRevenue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/kyc"
                element={
                  <ProtectedRoute>
                    <AdminKYC />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/disputes"
                element={
                  <ProtectedRoute>
                    <AdminDisputes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/affiliates"
                element={
                  <ProtectedRoute>
                    <AdminAffiliates />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/store-withdrawals"
                element={
                  <ProtectedRoute>
                    <AdminStoreWithdrawals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reviews"
                element={
                  <ProtectedRoute>
                    <AdminReviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/inventory"
                element={
                  <ProtectedRoute>
                    <AdminInventory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/support"
                element={
                  <ProtectedRoute>
                    <AdminSupport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute>
                    <AdminAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/ai-settings"
                element={
                  <ProtectedRoute>
                    <AISettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/marketing"
                element={
                  <ProtectedRoute>
                    <MarketingAutomationDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute>
                    <AdminPayments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/transaction-reconciliation"
                element={
                  <ProtectedRoute>
                    <AdminTransactionReconciliation />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shipping"
                element={
                  <ProtectedRoute>
                    <AdminShipping />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/shipping-conversations"
                element={
                  <ProtectedRoute>
                    <AdminShippingConversations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/vendor-conversations"
                element={
                  <ProtectedRoute>
                    <AdminVendorConversations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <ProtectedRoute>
                    <AdminCourses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/security"
                element={
                  <ProtectedRoute>
                    <AdminSecurity />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute>
                    <AdminAudit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/taxes"
                element={
                  <ProtectedRoute>
                    <AdminTaxManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/returns"
                element={
                  <ProtectedRoute>
                    <AdminReturnManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/integrations"
                element={
                  <ProtectedRoute>
                    <IntegrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/integrations"
                element={
                  <ProtectedRoute>
                    <IntegrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/webhooks"
                element={
                  <ProtectedRoute>
                    <AdminWebhookManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/loyalty"
                element={
                  <ProtectedRoute>
                    <AdminLoyaltyManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/gift-cards"
                element={
                  <ProtectedRoute>
                    <AdminGiftCardManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/suppliers"
                element={
                  <ProtectedRoute>
                    <AdminSuppliersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/warehouses"
                element={
                  <ProtectedRoute>
                    <AdminWarehousesManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/product-kits"
                element={
                  <ProtectedRoute>
                    <AdminProductKitsManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/demand-forecasting"
                element={
                  <ProtectedRoute>
                    <AdminDemandForecasting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/cost-optimization"
                element={
                  <ProtectedRoute>
                    <AdminCostOptimization />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/batch-shipping"
                element={
                  <ProtectedRoute>
                    <AdminBatchShipping />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute>
                    <AdminOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/error-monitoring"
                element={
                  <ProtectedRoute>
                    <AdminErrorMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/monitoring"
                element={
                  <ProtectedRoute>
                    <AdminMonitoring />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/accessibility"
                element={
                  <ProtectedRoute>
                    <AdminAccessibilityReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/storage-diagnostic"
                element={
                  <ProtectedRoute>
                    <StorageDiagnosticPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/community"
                element={
                  <ProtectedRoute>
                    <AdminCommunity />
                  </ProtectedRoute>
                }
              />

              {/* --- Route de fallback --- */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Suspense>
        {/* Composants non-critiques lazy-loaded - Chargés après le contenu principal */}
        <Suspense fallback={null}>
          <CookieConsentBanner />
          <CrispChat />
          <AIChatbotWrapper />
        </Suspense>
        {/* Navigation mobile en bas - Affichée seulement sur mobile, sauf sur la page d'accueil et d'authentification */}
        {/* Toujours en bas pour éviter de masquer le contenu */}
        <Suspense fallback={null}>
          {isBottomNavVisible && <BottomNavigation position="bottom" />}
        </Suspense>
        {/* PWA Install Prompt - Affiché sur mobile et desktop */}
        <Suspense fallback={null}>
          <PWAInstallPrompt showAsBanner={isMobile} />
        </Suspense>
      </SentryErrorBoundary>
    </ErrorBoundary>
  );
};

// Configuration optimisée de React Query pour les performances
// Utilise la fonction optimisée avec stratégies de cache intelligentes
const queryClient = createOptimizedQueryClient();

const App = () => (
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
);

export default App;
