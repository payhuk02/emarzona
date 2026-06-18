import React from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SellerRoutePermissionGuard } from '@/components/billing/SellerRoutePermissionGuard';
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
const EditProduct = lazyPage(() => import('@/pages/EditProduct'));
const KYC = lazyPage(() => import('@/pages/KYC'));
const Referrals = lazyPage(() => import('@/pages/Referrals'));
const SEOAnalyzer = lazyPage(() => import('@/pages/SEOAnalyzer'));
const SEOMetaInspector = lazyPage(() => import('@/pages/SEOMetaInspector'));
const Pixels = lazyPage(() => import('@/pages/Pixels'));
const AdvancedOrderManagement = lazyPage(() => import('@/pages/AdvancedOrderManagement'));
const AdvancedOrderManagementSimple = lazyPage(
  () => import('@/pages/AdvancedOrderManagementSimple')
);
const AdminWebhookManagement = lazyPage(() => import('@/pages/admin/AdminWebhookManagement'));
const PhysicalInventoryManagement = lazyPage(
  () => import('@/pages/admin/PhysicalInventoryManagement')
);
const PhysicalPromotions = lazyPage(() => import('@/pages/admin/PhysicalPromotions'));
const PhysicalProductsAnalytics = lazyPage(() => import('@/pages/admin/PhysicalProductsAnalytics'));
const PhysicalProductsLots = lazyPage(() => import('@/pages/admin/PhysicalProductsLots'));
const PhysicalProductsSerialTracking = lazyPage(
  () => import('@/pages/admin/PhysicalProductsSerialTracking')
);
const PhysicalBarcodeScanner = lazyPage(() => import('@/pages/admin/PhysicalBarcodeScanner'));
const PhysicalPreOrders = lazyPage(() => import('@/pages/admin/PhysicalPreOrders'));
const PhysicalBackorders = lazyPage(() => import('@/pages/admin/PhysicalBackorders'));
const PhysicalBundles = lazyPage(() => import('@/pages/admin/PhysicalBundles'));
const PhysicalMultiCurrency = lazyPage(() => import('@/pages/admin/PhysicalMultiCurrency'));
const AdminLoyaltyManagement = lazyPage(() => import('@/pages/admin/AdminLoyaltyManagement'));
const AdminGiftCardManagement = lazyPage(() => import('@/pages/admin/AdminGiftCardManagement'));
const AdminSuppliersManagement = lazyPage(() => import('@/pages/admin/AdminSuppliersManagement'));
const AdminWarehousesManagement = lazyPage(() => import('@/pages/admin/AdminWarehousesManagement'));
const AdminProductKitsManagement = lazyPage(
  () => import('@/pages/admin/AdminProductKitsManagement')
);
const AdminDemandForecasting = lazyPage(() => import('@/pages/admin/AdminDemandForecasting'));
const AdminCostOptimization = lazyPage(() => import('@/pages/admin/AdminCostOptimization'));
const AdminBatchShipping = lazyPage(() => import('@/pages/admin/AdminBatchShipping'));
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
const IntegrationsPage = lazyPage(() => import('@/pages/admin/IntegrationsPage'));
const CustomDomainManagement = lazyPage(() => import('@/pages/dashboard/CustomDomainManagement'));

export const dashboardRoutes = (
  <>
    {/* Core Dashboard */}
    {pr('/dashboard', Dashboard)}
    {pr('/dashboard/store', Store)}
    {pr('/dashboard/store/team', StoreTeamManagement)}
    {pr('/dashboard/tasks', MyTasks)}
    {pr('/dashboard/products', VendorProductsListGate)}
    {pr('/dashboard/orders', Orders)}
    {pr('/dashboard/withdrawals', Withdrawals)}
    {pr('/dashboard/payment-methods', PaymentMethods)}
    {pr('/dashboard/payment-connections', PaymentConnectionsPage)}
    {pr('/dashboard/advanced-orders', AdvancedOrderManagement)}
    {pr('/dashboard/advanced-orders-test', AdvancedOrderManagementSimple)}
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
    {pr('/dashboard/billing/physical', StorePhysicalBilling)}
    {pr('/dashboard/products/:id/edit', EditProduct)}

    {/* Webhooks */}
    {pr('/dashboard/webhooks', AdminWebhookManagement)}
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
    {pr('/dashboard/physical-inventory', PhysicalInventoryManagement)}
    {pr('/dashboard/physical-promotions', PhysicalPromotions)}
    {pr('/dashboard/physical-analytics', PhysicalProductsAnalytics)}
    {pr('/dashboard/physical-lots', PhysicalProductsLotsManagement)}
    {pr('/dashboard/physical-lots/:productId', PhysicalProductsLotsManagement)}
    {pr('/dashboard/physical-lots-old', PhysicalProductsLots)}
    {pr('/dashboard/physical-serial-tracking', PhysicalProductsSerialTracking)}
    {pr('/dashboard/suppliers', SuppliersManagement)}
    {pr('/dashboard/demand-forecasting', DemandForecasting)}
    {pr('/dashboard/inventory-analytics', InventoryAnalytics)}
    {pr('/dashboard/physical-barcode-scanner', PhysicalBarcodeScanner)}
    {pr('/dashboard/physical-preorders', PhysicalPreOrders)}
    {pr('/dashboard/physical-backorders', PhysicalBackorders)}
    {pr('/dashboard/physical-bundles', PhysicalBundles)}
    {pr('/dashboard/multi-currency', PhysicalMultiCurrency)}
    {pr('/dashboard/loyalty', AdminLoyaltyManagement)}
    {pr('/dashboard/gift-cards', AdminGiftCardManagement)}
    {pr('/dashboard/warehouses', AdminWarehousesManagement)}
    {pr('/dashboard/product-kits', AdminProductKitsManagement)}
    {pr('/dashboard/cost-optimization', AdminCostOptimization)}
    {pr('/dashboard/batch-shipping', AdminBatchShipping)}

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
    {pr('/courses/:courseId/gamification', CourseGamificationDashboard)}
    {pr('/dashboard/cohorts', CohortsManagementPage)}
    {pr('/dashboard/cohorts/:cohortId', CohortDetailPage)}
    {pr('/dashboard/courses/:courseId/cohorts', CohortsManagementPage)}
    {pr('/dashboard/coupons', CouponsManagement)}
    {pr('/dashboard/analytics/dashboards', AnalyticsDashboardsManagement)}
    {pr('/dashboard/abandoned-carts', AbandonedCartsManagement)}
    {pr('/dashboard/taxes', TaxManagement)}
    {pr('/courses/:slug/analytics', CourseAnalytics)}

    {/* Digital Products */}
    {pr('/dashboard/digital-products', DigitalProductsList)}
    {pr('/dashboard/my-downloads', MyDownloads)}
    {pr('/dashboard/digital-products/bundles', DigitalBundlesManagement)}
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

    {/* Advanced Systems */}
    {pr('/orders/:orderId/messaging', OrderMessaging)}
    {pr('/payments/:orderId/manage', PaymentManagement)}
    {pr('/payments/:orderId/balance', PayBalance)}
    {pr('/disputes/:disputeId', DisputeDetail)}
    {pr('/shipping', ShippingDashboard)}
    {pr('/inventory', InventoryDashboard)}

    {/* Dashboard Advanced */}
    {pr('/dashboard/payment-management', PaymentManagementList)}
    {pr('/dashboard/pay-balance', PayBalanceList)}
    {pr('/dashboard/shipping', ShippingDashboard)}
    {pr('/dashboard/shipping-services', ShippingServices)}
    {pr('/dashboard/contact-shipping-service', ContactShippingService)}
    {pr('/dashboard/shipping-service-messages/:conversationId', ShippingServiceMessages)}
    {pr('/vendor/messaging/:storeId/:productId?', VendorMessaging)}
    {pr('/vendor/messaging', VendorMessaging)}
    {pr('/dashboard/inventory', InventoryDashboard)}
    <Route
      path="/dashboard/my-bookings"
      element={
        <ProtectedRoute>
          <Navigate to="/account/bookings" replace />
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
    {pr('/dashboard/integrations', IntegrationsPage)}
    {pr('/dashboard/ai-chatbot', AIChatbotPage)}
    {pr('/dashboard/image-studio', ImageStudioPage)}
  </>
);
