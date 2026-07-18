import React from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SellerRoutePermissionGuard } from '@/components/billing/SellerRoutePermissionGuard';
import { SellerLegacyPathRedirect } from '@/routes/SellerLegacyPathRedirect';
import { logger } from '@/lib/logger';

// Helper pour route protégée
const pr = (path: string, Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Route
    path={path}
    element={
      <ProtectedRoute>
        <SellerRoutePermissionGuard>
          <Component />
        </SellerRoutePermissionGuard>
      </ProtectedRoute>
    }
  />
);

/** Route authentifiée sans garde vendeur (accessible aux acheteurs). */
const prAuth = (path: string, Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Route
    path={path}
    element={
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    }
  />
);

// Pages Dashboard
const Dashboard = lazyPage(() =>
  import('@/pages/Dashboard')
    .then(m => ({ default: m.default }))
    .catch(error => {
      logger.error('Erreur lors du chargement du Dashboard', { error });
      return {
        default: () => (
          <div className="flex min-h-screen items-center justify-center">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Erreur de chargement</h2>
              <p className="text-muted-foreground">Impossible de charger le tableau de bord</p>
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
const VendorProductsListGate = lazyPage(() =>
  import('@/pages/products/VendorProductsListGate').catch(error => {
    logger.error('Erreur lors du chargement VendorProductsListGate:', error);
    return {
      default: () => (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
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
const Store = lazyPage(() => import('@/pages/Store'));
const StorefrontPreviewPage = lazyPage(() => import('@/pages/dashboard/StorefrontPreviewPage'));
const StoreTeamManagement = lazyPage(() => import('@/pages/store/StoreTeamManagement'));
const MyTasks = lazyPage(() => import('@/pages/MyTasks'));
const AIChatbotPage = lazyPage(() => import('@/pages/AIChatbotPage'));
const ImageStudioPage = lazyPage(() => import('@/pages/ImageStudioPage'));
const Orders = lazyPage(() => import('@/pages/Orders'));
const Customers = lazyPage(() => import('@/pages/Customers'));
const Marketing = lazyPage(() => import('@/pages/Marketing').then(m => ({ default: m.default })));
const PromotionsPage = lazyPage(() =>
  import('@/pages/Promotions').then(m => ({ default: m.default }))
);
const PromotionsStatsPage = lazyPage(() =>
  import('@/pages/promotions/PromotionsStatsPage').then(m => ({ default: m.PromotionsStatsPage }))
);
const EmailCampaignsPage = lazyPage(() =>
  import('@/pages/emails/EmailCampaignsPage').then(m => ({ default: m.EmailCampaignsPage }))
);
const EmailSequencesPage = lazyPage(() =>
  import('@/pages/emails/EmailSequencesPage').then(m => ({ default: m.EmailSequencesPage }))
);
const EmailSegmentsPage = lazyPage(() =>
  import('@/pages/emails/EmailSegmentsPage').then(m => ({ default: m.EmailSegmentsPage }))
);
const EmailAnalyticsPage = lazyPage(() =>
  import('@/pages/emails/EmailAnalyticsPage').then(m => ({ default: m.EmailAnalyticsPage }))
);
const EmailTagsManagementPage = lazyPage(() =>
  import('@/pages/emails/EmailTagsManagementPage').then(m => ({ default: m.default }))
);
const EmailWorkflowsPage = lazyPage(() =>
  import('@/pages/emails/EmailWorkflowsPage').then(m => ({ default: m.EmailWorkflowsPage }))
);
const EmailTemplateEditorPage = lazyPage(() =>
  import('@/pages/emails/EmailTemplateEditorPage').then(m => ({
    default: m.EmailTemplateEditorPage,
  }))
);
const Analytics = lazyPage(() => import('@/pages/Analytics'));
const Payments = lazyPage(() => import('@/pages/Payments'));
const PaymentsCustomers = lazyPage(() => import('@/pages/PaymentsCustomers'));
const Withdrawals = lazyPage(() => import('@/pages/Withdrawals'));
const PaymentMethods = lazyPage(() => import('@/pages/PaymentMethods'));
const PaymentConnectionsPage = lazyPage(() => import('@/pages/dashboard/PaymentConnectionsPage'));
const Settings = lazyPage(() => import('@/pages/Settings'));
const CreateProduct = lazyPage(() => import('@/pages/CreateProduct'));
const StorePhysicalBilling = lazyPage(() => import('@/pages/dashboard/StorePhysicalBilling'));
const PhysicalStoreOnboarding = lazyPage(() => import('@/pages/dashboard/PhysicalStoreOnboarding'));
const StoreVerticalOnboarding = lazyPage(() => import('@/pages/dashboard/StoreVerticalOnboarding'));
const EditProduct = lazyPage(() => import('@/pages/EditProduct'));
const KYC = lazyPage(() => import('@/pages/KYC'));
const Referrals = lazyPage(() => import('@/pages/Referrals'));
const SEOAnalyzer = lazyPage(() => import('@/pages/SEOAnalyzer'));
const SEOMetaInspector = lazyPage(() => import('@/pages/SEOMetaInspector'));
const Pixels = lazyPage(() => import('@/pages/Pixels'));
const AdvancedOrderManagement = lazyPage(() => import('@/pages/AdvancedOrderManagement'));
const SellerWebhookManagement = lazyPage(
  () => import('@/pages/dashboard/seller/SellerWebhookManagement')
);
const SellerPhysicalInventoryManagement = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalInventoryManagement')
);
const SellerPhysicalPromotions = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalPromotions')
);
const SellerPhysicalProductsAnalytics = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalProductsAnalytics')
);
const SellerPhysicalSerialTracking = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalSerialTracking')
);
const SellerPhysicalBarcodeScanner = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalBarcodeScanner')
);
const SellerPhysicalPreOrders = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalPreOrders')
);
const SellerPhysicalBackorders = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalBackorders')
);
const SellerPhysicalBundles = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalBundles')
);
const SellerPhysicalMultiCurrency = lazyPage(
  () => import('@/pages/dashboard/seller/SellerPhysicalMultiCurrency')
);
const SellerLoyaltyManagement = lazyPage(
  () => import('@/pages/dashboard/seller/SellerLoyaltyManagement')
);
const SellerGiftCardManagement = lazyPage(
  () => import('@/pages/dashboard/seller/SellerGiftCardManagement')
);
const SellerWarehousesManagement = lazyPage(
  () => import('@/pages/dashboard/seller/SellerWarehousesManagement')
);
const SellerProductKitsManagement = lazyPage(
  () => import('@/pages/dashboard/seller/SellerProductKitsManagement')
);
const SellerCostOptimization = lazyPage(
  () => import('@/pages/dashboard/seller/SellerCostOptimization')
);
const SellerBatchShipping = lazyPage(() => import('@/pages/dashboard/seller/SellerBatchShipping'));
const StoreAffiliateManagement = lazyPage(
  () => import('@/pages/dashboard/StoreAffiliateManagement')
);
const StoreAffiliates = lazyPage(() => import('@/pages/StoreAffiliates'));
const AffiliateDashboard = lazyPage(() => import('@/pages/AffiliateDashboard'));
const AffiliateCoursesDashboard = lazyPage(
  () => import('@/pages/affiliate/AffiliateCoursesDashboard')
);
const CourseAffiliate = lazyPage(() => import('@/pages/affiliate/CourseAffiliate'));
const NotificationsManagement = lazyPage(
  () => import('@/pages/notifications/NotificationsManagement')
);
const NotificationSettings = lazyPage(() => import('@/pages/settings/NotificationSettings'));
const MyCoursesRedirect = lazyPage(() => import('@/pages/courses/MyCoursesRedirect'));
const SellerCoursesList = lazyPage(() => import('@/pages/courses/SellerCoursesList'));
const SellerArtistProductsList = lazyPage(() => import('@/pages/artist/SellerArtistProductsList'));
const CreateCourse = lazyPage(() => import('@/pages/courses/CreateCourse'));
const CourseAnalytics = lazyPage(() => import('@/pages/courses/CourseAnalytics'));
const CohortsManagementPage = lazyPage(() => import('@/pages/courses/CohortsManagementPage'));
const CohortDetailPage = lazyPage(() => import('@/pages/courses/CohortDetailPage'));
const CourseGamificationDashboard = lazyPage(
  () => import('@/pages/courses/CourseGamificationDashboard')
);
const LiveSessionsManagement = lazyPage(() => import('@/pages/dashboard/LiveSessionsManagement'));
const AssignmentsManagement = lazyPage(() => import('@/pages/dashboard/AssignmentsManagement'));
const ReviewsManagement = lazyPage(() => import('@/pages/dashboard/ReviewsManagement'));
const CouponsManagement = lazyPage(() => import('@/pages/dashboard/CouponsManagement'));
const AnalyticsDashboardsManagement = lazyPage(
  () => import('@/pages/dashboard/AnalyticsDashboardsManagement')
);
const AbandonedCartsManagement = lazyPage(
  () => import('@/pages/dashboard/AbandonedCartsManagement')
);
const TaxManagement = lazyPage(() => import('@/pages/dashboard/TaxManagement'));
const DigitalProductsList = lazyPage(() => import('@/pages/digital/DigitalProductsList'));
const PhysicalProductsList = lazyPage(() => import('@/pages/physical/PhysicalProductsList'));
const ServicesList = lazyPage(() => import('@/pages/service/ServicesList'));
const MyDownloads = lazyPage(() => import('@/pages/digital/MyDownloads'));
const DigitalBundlesManagement = lazyPage(
  () => import('@/pages/dashboard/DigitalBundlesManagement')
);
const CrossTypeBundlesPage = lazyPage(
  () => import('@/pages/dashboard/bundles/CrossTypeBundlesPage')
);
const ServiceAddonsPage = lazyPage(() => import('@/pages/service/ServiceAddonsPage'));
const CreateBundle = lazyPage(() => import('@/pages/digital/CreateBundle'));
const MyLicenses = lazyPage(() => import('@/pages/digital/MyLicenses'));
const LicenseManagement = lazyPage(() => import('@/pages/digital/LicenseManagement'));
const DigitalProductAnalytics = lazyPage(() => import('@/pages/digital/DigitalProductAnalytics'));
const DigitalProductUpdatesDashboard = lazyPage(
  () => import('@/pages/digital/DigitalProductUpdatesDashboard')
);
const DigitalProductVersionsManagement = lazyPage(
  () => import('@/pages/digital/DigitalProductVersionsManagement')
);
const PhysicalProductsLotsManagement = lazyPage(
  () => import('@/pages/dashboard/PhysicalProductsLotsManagement')
);
const SuppliersManagement = lazyPage(() => import('@/pages/dashboard/SuppliersManagement'));
const DemandForecasting = lazyPage(() => import('@/pages/dashboard/DemandForecasting'));
const InventoryAnalytics = lazyPage(() => import('@/pages/dashboard/InventoryAnalytics'));
const ServiceCalendarManagement = lazyPage(
  () => import('@/pages/service/ServiceCalendarManagement')
);
const StaffAvailabilityCalendar = lazyPage(
  () => import('@/pages/service/StaffAvailabilityCalendar')
);
const ResourceConflictManagement = lazyPage(
  () => import('@/pages/service/ResourceConflictManagement')
);
const RecurringBookingsManagement = lazyPage(
  () => import('@/pages/service/RecurringBookingsManagement')
);
const CalendarIntegrationsPage = lazyPage(() => import('@/pages/service/CalendarIntegrationsPage'));
const ServiceWaitlistManagementPage = lazyPage(
  () => import('@/pages/service/ServiceWaitlistManagementPage')
);
const BookingRemindersManagementPage = lazyPage(
  () => import('@/pages/service/BookingRemindersManagementPage')
);
const OrderMessaging = lazyPage(() => import('@/pages/orders/OrderMessaging'));
const PaymentManagement = lazyPage(() => import('@/pages/payments/PaymentManagement'));
const PaymentManagementList = lazyPage(() => import('@/pages/payments/PaymentManagementList'));
const DisputeDetail = lazyPage(() => import('@/pages/disputes/DisputeDetail'));
const PayBalance = lazyPage(() => import('@/pages/payments/PayBalance'));
const PayBalanceList = lazyPage(() => import('@/pages/payments/PayBalanceList'));
const ShippingDashboard = lazyPage(() => import('@/pages/shipping/ShippingDashboard'));
const InventoryDashboard = lazyPage(() => import('@/pages/inventory/InventoryDashboard'));
const ShippingServices = lazyPage(() => import('@/pages/shipping/ShippingServices'));
const ContactShippingService = lazyPage(() => import('@/pages/shipping/ContactShippingService'));
const ShippingServiceMessages = lazyPage(() => import('@/pages/shipping/ShippingServiceMessages'));
const VendorMessaging = lazyPage(() => import('@/pages/vendor/VendorMessaging'));
const BookingsManagement = lazyPage(() => import('@/pages/service/BookingsManagement'));
const AdvancedCalendarPage = lazyPage(() => import('@/pages/service/AdvancedCalendarPage'));
const RecurringBookingsPage = lazyPage(() => import('@/pages/service/RecurringBookingsPage'));
const ServiceManagementPage = lazyPage(() => import('@/pages/service/ServiceManagementPage'));
const GamificationPage = lazyPage(() => import('@/pages/gamification/GamificationPage'));
const ArtistPortfoliosManagement = lazyPage(
  () => import('@/pages/dashboard/ArtistPortfoliosManagement')
);
const AuctionsManagementPage = lazyPage(() => import('@/pages/artist/AuctionsManagementPage'));
const AuctionsWatchlistPage = lazyPage(() => import('@/pages/artist/AuctionsWatchlistPage'));
const SellerIntegrationsPage = lazyPage(
  () => import('@/pages/dashboard/seller/SellerIntegrationsPage')
);
const CustomDomainManagement = lazyPage(() => import('@/pages/dashboard/CustomDomainManagement'));
const AdvancedDashboard = lazyPage(() => import('@/pages/AdvancedDashboard'));

export const dashboardRoutes = (
  <>
    {/* Core Dashboard */}
    {pr('/dashboard', Dashboard)}
    {pr('/dashboard/store', Store)}
    {pr('/dashboard/store/preview', StorefrontPreviewPage)}
    {pr('/dashboard/store/team', StoreTeamManagement)}
    {pr('/dashboard/tasks', MyTasks)}
    {pr('/dashboard/products', VendorProductsListGate)}
    {pr('/dashboard/orders', Orders)}
    {pr('/dashboard/withdrawals', Withdrawals)}
    {pr('/dashboard/payment-methods', PaymentMethods)}
    {pr('/dashboard/payment-connections', PaymentConnectionsPage)}
    {pr('/dashboard/advanced-orders', AdvancedOrderManagement)}
    <Route
      path="/dashboard/advanced-orders-test"
      element={
        <ProtectedRoute>
          <Navigate to="/dashboard/advanced-orders" replace />
        </ProtectedRoute>
      }
    />
    {pr('/dashboard/customers', Customers)}
    {pr('/dashboard/marketing', Marketing)}
    {pr('/dashboard/promotions', PromotionsPage)}
    {pr('/dashboard/promotions/stats', PromotionsStatsPage)}

    {/* Emails */}
    {pr('/dashboard/emails/campaigns', EmailCampaignsPage)}
    {pr('/dashboard/emails/sequences', EmailSequencesPage)}
    {pr('/dashboard/emails/segments', EmailSegmentsPage)}
    {pr('/dashboard/emails/analytics', EmailAnalyticsPage)}
    {pr('/dashboard/emails/workflows', EmailWorkflowsPage)}
    {pr('/dashboard/emails/tags', EmailTagsManagementPage)}
    {pr('/dashboard/emails/templates/editor', EmailTemplateEditorPage)}

    {/* Analytics & Payments */}
    {pr('/dashboard/analytics', Analytics)}
    {pr('/dashboard/analytics/dashboards', AnalyticsDashboardsManagement)}
    {pr('/dashboard/advanced', AdvancedDashboard)}
    {pr('/dashboard/payments', Payments)}
    {pr('/dashboard/payments-customers', PaymentsCustomers)}
    {pr('/dashboard/settings', Settings)}
    {pr('/dashboard/kyc', KYC)}
    {pr('/dashboard/referrals', Referrals)}
    {pr('/dashboard/pixels', Pixels)}
    {pr('/dashboard/seo', SEOAnalyzer)}
    {pr('/dashboard/seo/inspector', SEOMetaInspector)}
    {pr('/dashboard/domain', CustomDomainManagement)}

    {/* Products CRUD */}
    {pr('/dashboard/products/new', CreateProduct)}
    {pr('/dashboard/products/new/:type', CreateProduct)}
    {pr('/dashboard/onboarding/physical-subscription', PhysicalStoreOnboarding)}
    {pr('/dashboard/onboarding/store', StoreVerticalOnboarding)}
    {pr('/dashboard/billing/physical', StorePhysicalBilling)}
    {pr('/dashboard/products/:id/edit', EditProduct)}

    {/* Webhooks */}
    {pr('/dashboard/webhooks', SellerWebhookManagement)}
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

    {/* Physical Products */}
    {pr('/dashboard/physical-products', PhysicalProductsList)}
    {pr('/dashboard/physical-inventory', SellerPhysicalInventoryManagement)}
    {pr('/dashboard/physical-promotions', SellerPhysicalPromotions)}
    {pr('/dashboard/physical-analytics', SellerPhysicalProductsAnalytics)}
    {pr('/dashboard/physical-lots', PhysicalProductsLotsManagement)}
    {pr('/dashboard/physical-lots/:productId', PhysicalProductsLotsManagement)}
    {pr('/dashboard/physical-lots-old', PhysicalProductsLotsManagement)}
    {pr('/dashboard/physical-serial-tracking', SellerPhysicalSerialTracking)}
    {pr('/dashboard/suppliers', SuppliersManagement)}
    {pr('/dashboard/demand-forecasting', DemandForecasting)}
    {pr('/dashboard/inventory-analytics', InventoryAnalytics)}
    {pr('/dashboard/physical-barcode-scanner', SellerPhysicalBarcodeScanner)}
    {pr('/dashboard/physical-preorders', SellerPhysicalPreOrders)}
    {pr('/dashboard/physical-backorders', SellerPhysicalBackorders)}
    {pr('/dashboard/physical-bundles', SellerPhysicalBundles)}
    {pr('/dashboard/multi-currency', SellerPhysicalMultiCurrency)}
    {pr('/dashboard/loyalty', SellerLoyaltyManagement)}
    {pr('/dashboard/gift-cards', SellerGiftCardManagement)}
    {pr('/dashboard/warehouses', SellerWarehousesManagement)}
    {pr('/dashboard/product-kits', SellerProductKitsManagement)}
    {pr('/dashboard/cost-optimization', SellerCostOptimization)}
    {pr('/dashboard/batch-shipping', SellerBatchShipping)}

    {/* Affiliation */}
    {pr('/dashboard/store-affiliates', StoreAffiliateManagement)}
    {pr('/dashboard/affiliates', StoreAffiliates)}
    {pr('/affiliate/dashboard', AffiliateDashboard)}
    {pr('/affiliate/courses', AffiliateCoursesDashboard)}
    {pr('/affiliate/courses/:slug', CourseAffiliate)}

    {/* Notifications */}
    {pr('/notifications', NotificationsManagement)}
    <Route path="/notifications/center" element={<Navigate to="/notifications" replace />} />
    {pr('/settings/notifications', NotificationSettings)}

    {/* Courses */}
    {pr('/dashboard/courses', SellerCoursesList)}
    {pr('/dashboard/artist-products', SellerArtistProductsList)}
    {pr('/dashboard/my-courses', MyCoursesRedirect)}
    {pr('/dashboard/courses/new', CreateCourse)}
    {pr('/dashboard/courses/live-sessions', LiveSessionsManagement)}
    {pr('/dashboard/courses/assignments', AssignmentsManagement)}
    {pr('/dashboard/reviews', ReviewsManagement)}
    {pr('/dashboard/courses/:courseId/gamification', CourseGamificationDashboard)}
    <Route
      path="/courses/:courseId/gamification"
      element={
        <ProtectedRoute>
          <SellerLegacyPathRedirect to="/dashboard/courses/:courseId/gamification" />
        </ProtectedRoute>
      }
    />
    {pr('/dashboard/cohorts', CohortsManagementPage)}
    {pr('/dashboard/cohorts/:cohortId', CohortDetailPage)}
    {pr('/dashboard/courses/:courseId/cohorts', CohortsManagementPage)}
    {pr('/dashboard/coupons', CouponsManagement)}
    {pr('/dashboard/analytics/dashboards', AnalyticsDashboardsManagement)}
    {pr('/dashboard/abandoned-carts', AbandonedCartsManagement)}
    {pr('/dashboard/taxes', TaxManagement)}
    {pr('/dashboard/courses/:slug/analytics', CourseAnalytics)}
    <Route
      path="/courses/:slug/analytics"
      element={
        <ProtectedRoute>
          <SellerLegacyPathRedirect to="/dashboard/courses/:slug/analytics" />
        </ProtectedRoute>
      }
    />

    {/* Digital Products */}
    {pr('/dashboard/digital-products', DigitalProductsList)}
    {pr('/dashboard/my-downloads', MyDownloads)}
    {pr('/dashboard/digital-products/bundles', DigitalBundlesManagement)}
    {pr('/dashboard/cross-type-bundles', CrossTypeBundlesPage)}
    {pr('/dashboard/digital-products/bundles/create', CreateBundle)}
    {pr('/dashboard/my-licenses', MyLicenses)}
    {pr('/dashboard/license-management', LicenseManagement)}
    {pr('/dashboard/licenses/manage/:id', LicenseManagement)}
    {pr('/dashboard/digital/analytics/:productId', DigitalProductAnalytics)}
    {pr('/dashboard/digital/updates', DigitalProductUpdatesDashboard)}
    {pr('/dashboard/digital/updates/:productId', DigitalProductUpdatesDashboard)}
    {pr('/dashboard/digital/products/:productId/versions', DigitalProductVersionsManagement)}

    {/* Services */}
    {pr('/dashboard/services', ServicesList)}
    {pr('/dashboard/services/staff-availability', StaffAvailabilityCalendar)}
    {pr('/dashboard/services/calendar', ServiceCalendarManagement)}
    {pr('/dashboard/services/calendar/:serviceId', ServiceCalendarManagement)}
    {pr('/dashboard/services/staff-availability/:serviceId', StaffAvailabilityCalendar)}
    {pr('/dashboard/services/resource-conflicts', ResourceConflictManagement)}
    {pr('/dashboard/services/recurring-bookings', RecurringBookingsManagement)}
    {pr('/dashboard/services/calendar-integrations', CalendarIntegrationsPage)}
    {pr('/dashboard/services/waitlist', ServiceWaitlistManagementPage)}
    {pr('/dashboard/services/reminders', BookingRemindersManagementPage)}
    {pr('/dashboard/services/addons', ServiceAddonsPage)}

    {/* Advanced Systems */}
    {pr('/orders/:orderId/messaging', OrderMessaging)}
    {pr('/payments/:orderId/manage', PaymentManagement)}
    {pr('/payments/:orderId/balance', PayBalance)}
    {pr('/disputes/:disputeId', DisputeDetail)}
    <Route
      path="/shipping"
      element={
        <ProtectedRoute>
          <Navigate to="/dashboard/shipping" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory"
      element={
        <ProtectedRoute>
          <Navigate to="/dashboard/inventory" replace />
        </ProtectedRoute>
      }
    />

    {/* Dashboard Advanced */}
    {pr('/dashboard/payment-management', PaymentManagementList)}
    {pr('/dashboard/pay-balance', PayBalanceList)}
    {pr('/dashboard/shipping', ShippingDashboard)}
    {pr('/dashboard/shipping-services', ShippingServices)}
    {pr('/dashboard/contact-shipping-service', ContactShippingService)}
    {pr('/dashboard/shipping-service-messages/:conversationId', ShippingServiceMessages)}
    {prAuth('/vendor/messaging/:storeId/:productId?', VendorMessaging)}
    {prAuth('/vendor/messaging', VendorMessaging)}
    {pr('/dashboard/inventory', InventoryDashboard)}
    <Route
      path="/dashboard/my-bookings"
      element={
        <ProtectedRoute>
          <Navigate to="/account/bookings" replace />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/smart-notifications"
      element={
        <ProtectedRoute>
          <Navigate to="/settings/notifications" replace />
        </ProtectedRoute>
      }
    />
    {pr('/dashboard/bookings', BookingsManagement)}
    {pr('/dashboard/advanced-calendar', AdvancedCalendarPage)}
    {pr('/dashboard/recurring-bookings', RecurringBookingsPage)}
    {pr('/dashboard/service-management', ServiceManagementPage)}
    {pr('/dashboard/gamification', GamificationPage)}
    {pr('/dashboard/portfolios', ArtistPortfoliosManagement)}
    {pr('/dashboard/auctions', AuctionsManagementPage)}
    {pr('/dashboard/auctions/watchlist', AuctionsWatchlistPage)}
    {pr('/dashboard/integrations', SellerIntegrationsPage)}
    {pr('/dashboard/ai-chatbot', AIChatbotPage)}
    {pr('/dashboard/image-studio', ImageStudioPage)}
  </>
);
