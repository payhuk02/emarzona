import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/navigation/ScrollToTop";
import { LoadingBar } from "@/components/navigation/LoadingBar";
import { useScrollRestoration } from "@/hooks/useScrollRestoration";
import { useDarkMode } from "@/hooks/useDarkMode";
import { PerformanceOptimizer } from "@/components/optimization/PerformanceOptimizer";
import { CookieConsentBanner } from "@/components/legal/CookieConsentBanner";
import { CrispChat } from "@/components/chat/CrispChat";
import { Require2FABanner } from "@/components/auth/Require2FABanner";
import { Suspense, lazy, useEffect } from "react";
import { initSentry } from "@/lib/sentry";
import { initWebVitals } from "@/lib/web-vitals";
import * as Sentry from "@sentry/react";

// Composant de chargement pour le lazy loading
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-muted-foreground">Chargement...</p>
    </div>
  </div>
);

// Composant d'erreur pour Sentry
const ErrorFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
      <div className="mb-4">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops ! Une erreur est survenue</h1>
      <p className="text-gray-600 mb-6">
        Nous avons été notifiés du problème et travaillons pour le résoudre.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Retour à l'accueil
      </button>
    </div>
  </div>
);

// Pages principales - Lazy loading
const Landing = lazy(() => import("./pages/Landing"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Store = lazy(() => import("./pages/Store"));
const Orders = lazy(() => import("./pages/Orders"));
const Customers = lazy(() => import("./pages/Customers"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Payments = lazy(() => import("./pages/Payments"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateProduct = lazy(() => import("./pages/CreateProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Storefront = lazy(() => import("./pages/Storefront"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const NotFound = lazy(() => import("./pages/NotFound"));
const KYC = lazy(() => import("./pages/KYC"));
const AdminKYC = lazy(() => import("./pages/AdminKYC"));
const PlatformRevenue = lazy(() => import("./pages/PlatformRevenue"));
const Referrals = lazy(() => import("./pages/Referrals"));
const SEOAnalyzer = lazy(() => import("./pages/SEOAnalyzer"));
const Pixels = lazy(() => import("./pages/Pixels"));
const AdvancedOrderManagement = lazy(() => import("./pages/AdvancedOrderManagement"));
const AdvancedOrderManagementSimple = lazy(() => import("./pages/AdvancedOrderManagementSimple"));

// Pages Admin - Lazy loading
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminStores = lazy(() => import("./pages/admin/AdminStores"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminSales = lazy(() => import("./pages/admin/AdminSales"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminAffiliates = lazy(() => import("./pages/admin/AdminAffiliates"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews").then(m => ({ default: m.AdminReviews })));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminShipping = lazy(() => import("./pages/admin/AdminShipping"));
const AdminCourses = lazy(() => import("./pages/admin/AdminCourses"));

// Pages Affiliation - Lazy loading
const StoreAffiliates = lazy(() => import("./pages/StoreAffiliates"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const CourseAffiliate = lazy(() => import("./pages/affiliate/CourseAffiliate"));
const AffiliateCoursesDashboard = lazy(() => import("./pages/affiliate/AffiliateCoursesDashboard"));

// Pages Légales - Lazy loading
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const RefundPolicy = lazy(() => import("./pages/legal/RefundPolicy"));

// Pages Moneroo (paiement) - Lazy loading
const PaymentSuccess = lazy(() => import("./pages/payments/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/payments/PaymentCancel"));

// Pages Cours - Lazy loading
const MyCourses = lazy(() => import("./pages/courses/MyCourses"));
const CreateCourse = lazy(() => import("./pages/courses/CreateCourse"));
const CourseDetail = lazy(() => import("./pages/courses/CourseDetail"));
const CourseAnalytics = lazy(() => import("./pages/courses/CourseAnalytics"));

// Pages Notifications - Lazy loading
const NotificationsCenter = lazy(() => import("./pages/notifications/NotificationsCenter"));
const NotificationSettings = lazy(() => import("./pages/settings/NotificationSettings"));

// Pages Produits Digitaux - Lazy loading
const DigitalProductsList = lazy(() => import("./pages/digital/DigitalProductsList"));
const DigitalProductDetail = lazy(() => import("./pages/digital/DigitalProductDetail"));
const MyDownloads = lazy(() => import("./pages/digital/MyDownloads"));
const MyLicenses = lazy(() => import("./pages/digital/MyLicenses"));
const LicenseManagement = lazy(() => import("./pages/digital/LicenseManagement"));
const DigitalProductAnalytics = lazy(() => import("./pages/digital/DigitalProductAnalytics"));

// Pages Advanced Systems - Lazy loading
const OrderMessaging = lazy(() => import("./pages/orders/OrderMessaging"));
const PaymentManagement = lazy(() => import("./pages/payments/PaymentManagement"));
const PaymentManagementList = lazy(() => import("./pages/payments/PaymentManagementList"));
const DisputeDetail = lazy(() => import("./pages/disputes/DisputeDetail"));
const PayBalance = lazy(() => import("./pages/payments/PayBalance"));
const PayBalanceList = lazy(() => import("./pages/payments/PayBalanceList"));
const ShippingDashboard = lazy(() => import("./pages/shipping/ShippingDashboard"));
const InventoryDashboard = lazy(() => import("./pages/inventory/InventoryDashboard"));

// Pages Produits Physiques & Services - Détails
const PhysicalProductDetail = lazy(() => import("./pages/physical/PhysicalProductDetail"));
const ServiceDetail = lazy(() => import("./pages/service/ServiceDetail"));
const BookingsManagement = lazy(() => import("./pages/service/BookingsManagement"));

// Pages Demo - Templates UI V2
const TemplatesUIDemo = lazy(() => import("./pages/demo/TemplatesUIDemo"));

// Page de test i18n (à supprimer en production)
const I18nTest = lazy(() => import("./pages/I18nTest"));

const AppContent = () => {
  useScrollRestoration();
  useDarkMode(); // Active le mode sombre globalement

  // Initialiser Sentry et Web Vitals au montage
  useEffect(() => {
    initSentry();
    initWebVitals();
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />} showDialog>
      <PerformanceOptimizer />
      <LoadingBar />
      <Require2FABanner position="top" />
      <ScrollToTop />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* --- Routes publiques --- */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/stores/:slug" element={<Storefront />} />
          <Route path="/stores/:slug/products/:productSlug" element={<ProductDetail />} />
          
          {/* --- Route de test i18n (à supprimer en production) --- */}
          <Route path="/i18n-test" element={<I18nTest />} />

          {/* --- Routes Légales (publiques) --- */}
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/cookies" element={<CookiePolicy />} />
          <Route path="/legal/refund" element={<RefundPolicy />} />

          {/* --- Routes Moneroo --- */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />

          {/* --- Routes utilisateur (protégées) --- */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
          <Route path="/dashboard/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/dashboard/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/dashboard/advanced-orders" element={<ProtectedRoute><AdvancedOrderManagement /></ProtectedRoute>} />
          <Route path="/dashboard/advanced-orders-test" element={<ProtectedRoute><AdvancedOrderManagementSimple /></ProtectedRoute>} />
          <Route path="/dashboard/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/dashboard/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
          <Route path="/dashboard/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/dashboard/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
          <Route path="/dashboard/referrals" element={<ProtectedRoute><Referrals /></ProtectedRoute>} />
          <Route path="/dashboard/pixels" element={<ProtectedRoute><Pixels /></ProtectedRoute>} />
          <Route path="/dashboard/seo" element={<ProtectedRoute><SEOAnalyzer /></ProtectedRoute>} />
          <Route path="/dashboard/products/new" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
          <Route path="/dashboard/products/:id/edit" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />

          {/* --- Routes Affiliation --- */}
          <Route path="/dashboard/affiliates" element={<ProtectedRoute><StoreAffiliates /></ProtectedRoute>} />
          <Route path="/affiliate/dashboard" element={<ProtectedRoute><AffiliateDashboard /></ProtectedRoute>} />
          <Route path="/affiliate/courses" element={<ProtectedRoute><AffiliateCoursesDashboard /></ProtectedRoute>} />
          <Route path="/affiliate/courses/:slug" element={<ProtectedRoute><CourseAffiliate /></ProtectedRoute>} />

          {/* --- Routes Notifications --- */}
          <Route path="/notifications" element={<ProtectedRoute><NotificationsCenter /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />

          {/* --- Routes Cours --- */}
          <Route path="/dashboard/my-courses" element={<ProtectedRoute><MyCourses /></ProtectedRoute>} />
          <Route path="/dashboard/courses/new" element={<ProtectedRoute><CreateCourse /></ProtectedRoute>} />
          <Route path="/courses/:slug" element={<CourseDetail />} />
          <Route path="/courses/:slug/analytics" element={<ProtectedRoute><CourseAnalytics /></ProtectedRoute>} />

          {/* --- Routes Produits Digitaux --- */}
          <Route path="/dashboard/digital-products" element={<ProtectedRoute><DigitalProductsList /></ProtectedRoute>} />
          <Route path="/digital/:productId" element={<DigitalProductDetail />} />
          <Route path="/dashboard/my-downloads" element={<ProtectedRoute><MyDownloads /></ProtectedRoute>} />
          <Route path="/dashboard/my-licenses" element={<ProtectedRoute><MyLicenses /></ProtectedRoute>} />
          <Route path="/dashboard/licenses/manage/:id" element={<ProtectedRoute><LicenseManagement /></ProtectedRoute>} />
          <Route path="/dashboard/digital/analytics/:productId" element={<ProtectedRoute><DigitalProductAnalytics /></ProtectedRoute>} />

          {/* --- Routes Advanced Systems (Messaging, Payments, Disputes) --- */}
          <Route path="/orders/:orderId/messaging" element={<ProtectedRoute><OrderMessaging /></ProtectedRoute>} />
          <Route path="/payments/:orderId/manage" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
          <Route path="/payments/:orderId/balance" element={<ProtectedRoute><PayBalance /></ProtectedRoute>} />
          <Route path="/disputes/:disputeId" element={<ProtectedRoute><DisputeDetail /></ProtectedRoute>} />
          <Route path="/shipping" element={<ProtectedRoute><ShippingDashboard /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryDashboard /></ProtectedRoute>} />
          
          {/* --- Routes Dashboard Advanced Features --- */}
          <Route path="/dashboard/payment-management" element={<ProtectedRoute><PaymentManagementList /></ProtectedRoute>} />
          <Route path="/dashboard/pay-balance" element={<ProtectedRoute><PayBalanceList /></ProtectedRoute>} />
          <Route path="/dashboard/shipping" element={<ProtectedRoute><ShippingDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/inventory" element={<ProtectedRoute><InventoryDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/bookings" element={<ProtectedRoute><BookingsManagement /></ProtectedRoute>} />

          {/* --- Routes Product Details (Physical, Services) --- */}
          <Route path="/physical/:productId" element={<PhysicalProductDetail />} />
          <Route path="/service/:serviceId" element={<ServiceDetail />} />
          
          {/* --- Routes Service Management --- */}
          <Route path="/bookings/manage" element={<ProtectedRoute><BookingsManagement /></ProtectedRoute>} />

          {/* --- Routes Demo --- */}
          <Route path="/demo/templates-ui" element={<ProtectedRoute><TemplatesUIDemo /></ProtectedRoute>} />

          {/* --- Routes administrateur --- */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/stores" element={<ProtectedRoute><AdminStores /></ProtectedRoute>} />
          <Route path="/admin/products" element={<ProtectedRoute><AdminProducts /></ProtectedRoute>} />
          <Route path="/admin/sales" element={<ProtectedRoute><AdminSales /></ProtectedRoute>} />
          <Route path="/admin/referrals" element={<ProtectedRoute><AdminReferrals /></ProtectedRoute>} />
          <Route path="/admin/activity" element={<ProtectedRoute><AdminActivity /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute><AdminNotifications /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute><PlatformRevenue /></ProtectedRoute>} />
          <Route path="/admin/kyc" element={<ProtectedRoute><AdminKYC /></ProtectedRoute>} />
          <Route path="/admin/disputes" element={<ProtectedRoute><AdminDisputes /></ProtectedRoute>} />
          <Route path="/admin/affiliates" element={<ProtectedRoute><AdminAffiliates /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/inventory" element={<ProtectedRoute><AdminInventory /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute><AdminSupport /></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute><AdminPayments /></ProtectedRoute>} />
          <Route path="/admin/shipping" element={<ProtectedRoute><AdminShipping /></ProtectedRoute>} />
          <Route path="/admin/courses" element={<ProtectedRoute><AdminCourses /></ProtectedRoute>} />

          {/* --- Route de fallback --- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <CookieConsentBanner />
      <CrispChat />
    </Sentry.ErrorBoundary>
  );
};

// Configuration optimisée de React Query pour les performances
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache optimisé par type de données
      staleTime: 5 * 60 * 1000, // 5 minutes par défaut
      gcTime: 10 * 60 * 1000, // 10 minutes (garbage collection)
      // Retry automatique en cas d'erreur
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch intelligent
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: false, // Ne pas refetch si les données sont fraîches
      // Performance optimizations
      structuralSharing: true, // Optimise les re-renders
      // Optimistic updates
      networkMode: 'online', // Ne query que si online
    },
    mutations: {
      // Retry pour les mutations aussi
      retry: 1,
      // Optimistic UI updates
      onMutate: async () => {
        // Cancel outgoing queries
        await queryClient.cancelQueries();
      },
      onError: (error) => {
        console.error('[Mutation Error]', error);
        // Rollback optimistic update on error
      },
      onSettled: () => {
        // Refetch after mutation
        queryClient.invalidateQueries();
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
