import React, { lazy } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { logger } from '@/lib/logger';

// Helper pour route protégée
const pr = (path: string, Component: React.LazyExoticComponent<any>) => (
  <Route path={path} element={<ProtectedRoute><Component /></ProtectedRoute>} />
);

// Pages Dashboard
const Dashboard = lazy(() =>
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
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">Recharger</button>
            </div>
          </div>
        ),
      };
    })
);
const Products = lazy(() =>
  import('@/pages/Products').catch(error => {
    logger.error('Erreur lors du chargement de Products:', error);
    return {
      default: () => (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Erreur de chargement</h2>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">Recharger</button>
          </div>
        </div>
      ),
    };
  })
);
const Store = lazy(() => import('@/pages/Store'));
const StoreTeamManagement = lazy(() => import('@/pages/store/StoreTeamManagement'));
const MyTasks = lazy(() => import('@/pages/MyTasks'));
const Orders = lazy(() => import('@/pages/Orders'));
const Customers = lazy(() => import('@/pages/Customers'));
const Marketing = lazy(() => import('@/pages/Marketing').then(m => ({ default: m.default })));
const PromotionsPage = lazy(() => import('@/pages/Promotions').then(m => ({ default: m.default })));
const PromotionsStatsPage = lazy(() => import('@/pages/promotions/PromotionsStatsPage').then(m => ({ default: m.PromotionsStatsPage })));
const EmailCampaignsPage = lazy(() => import('@/pages/emails/EmailCampaignsPage').then(m => ({ default: m.EmailCampaignsPage })));
const EmailSequencesPage = lazy(() => import('@/pages/emails/EmailSequencesPage').then(m => ({ default: m.EmailSequencesPage })));
const EmailSegmentsPage = lazy(() => import('@/pages/emails/EmailSegmentsPage').then(m => ({ default: m.EmailSegmentsPage })));
const EmailAnalyticsPage = lazy(() => import('@/pages/emails/EmailAnalyticsPage').then(m => ({ default: m.EmailAnalyticsPage })));
const EmailTagsManagementPage = lazy(() => import('@/pages/emails/EmailTagsManagementPage').then(m => ({ default: m.default })));
const EmailWorkflowsPage = lazy(() => import('@/pages/emails/EmailWorkflowsPage').then(m => ({ default: m.EmailWorkflowsPage })));
const EmailTemplateEditorPage = lazy(() => import('@/pages/emails/EmailTemplateEditorPage').then(m => ({ default: m.EmailTemplateEditorPage })));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Payments = lazy(() => import('@/pages/Payments'));
const PaymentsCustomers = lazy(() => import('@/pages/PaymentsCustomers'));
const Withdrawals = lazy(() => import('@/pages/Withdrawals'));
const PaymentMethods = lazy(() => import('@/pages/PaymentMethods'));
const Settings = lazy(() => import('@/pages/Settings'));
const CreateProduct = lazy(() => import('@/pages/CreateProduct'));
const EditProduct = lazy(() => import('@/pages/EditProduct'));
const KYC = lazy(() => import('@/pages/KYC'));
const Referrals = lazy(() => import('@/pages/Referrals'));
const SEOAnalyzer = lazy(() => import('@/pages/SEOAnalyzer'));
const Pixels = lazy(() => import('@/pages/Pixels'));
const AdvancedOrderManagement = lazy(() => import('@/pages/AdvancedOrderManagement'));
const AdvancedOrderManagementSimple = lazy(() => import('@/pages/AdvancedOrderManagementSimple'));
const AdminWebhookManagement = lazy(() => import('@/pages/admin/AdminWebhookManagement'));
const PhysicalInventoryManagement = lazy(() => import('@/pages/admin/PhysicalInventoryManagement'));
const PhysicalPromotions = lazy(() => import('@/pages/admin/PhysicalPromotions'));
const PhysicalProductsAnalytics = lazy(() => import('@/pages/admin/PhysicalProductsAnalytics'));
const PhysicalProductsLots = lazy(() => import('@/pages/admin/PhysicalProductsLots'));
const PhysicalProductsSerialTracking = lazy(() => import('@/pages/admin/PhysicalProductsSerialTracking'));
const PhysicalBarcodeScanner = lazy(() => import('@/pages/admin/PhysicalBarcodeScanner'));
const PhysicalPreOrders = lazy(() => import('@/pages/admin/PhysicalPreOrders'));
const PhysicalBackorders = lazy(() => import('@/pages/admin/PhysicalBackorders'));
const PhysicalBundles = lazy(() => import('@/pages/admin/PhysicalBundles'));
const PhysicalMultiCurrency = lazy(() => import('@/pages/admin/PhysicalMultiCurrency'));
const AdminLoyaltyManagement = lazy(() => import('@/pages/admin/AdminLoyaltyManagement'));
const AdminGiftCardManagement = lazy(() => import('@/pages/admin/AdminGiftCardManagement'));
const AdminSuppliersManagement = lazy(() => import('@/pages/admin/AdminSuppliersManagement'));
const AdminWarehousesManagement = lazy(() => import('@/pages/admin/AdminWarehousesManagement'));
const AdminProductKitsManagement = lazy(() => import('@/pages/admin/AdminProductKitsManagement'));
const AdminDemandForecasting = lazy(() => import('@/pages/admin/AdminDemandForecasting'));
const AdminCostOptimization = lazy(() => import('@/pages/admin/AdminCostOptimization'));
const AdminBatchShipping = lazy(() => import('@/pages/admin/AdminBatchShipping'));
const StoreAffiliateManagement = lazy(() => import('@/pages/dashboard/StoreAffiliateManagement'));
const StoreAffiliates = lazy(() => import('@/pages/StoreAffiliates'));
const AffiliateDashboard = lazy(() => import('@/pages/AffiliateDashboard'));
const AffiliateCoursesDashboard = lazy(() => import('@/pages/affiliate/AffiliateCoursesDashboard'));
const CourseAffiliate = lazy(() => import('@/pages/affiliate/CourseAffiliate'));
const NotificationsManagement = lazy(() => import('@/pages/notifications/NotificationsManagement'));
const NotificationSettings = lazy(() => import('@/pages/settings/NotificationSettings'));
const MyCourses = lazy(() => import('@/pages/courses/MyCourses'));
const CreateCourse = lazy(() => import('@/pages/courses/CreateCourse'));
const CourseAnalytics = lazy(() => import('@/pages/courses/CourseAnalytics'));
const CohortsManagementPage = lazy(() => import('@/pages/courses/CohortsManagementPage'));
const CohortDetailPage = lazy(() => import('@/pages/courses/CohortDetailPage'));
const CourseGamificationDashboard = lazy(() => import('@/pages/courses/CourseGamificationDashboard'));
const LiveSessionsManagement = lazy(() => import('@/pages/dashboard/LiveSessionsManagement'));
const AssignmentsManagement = lazy(() => import('@/pages/dashboard/AssignmentsManagement'));
const ReviewsManagement = lazy(() => import('@/pages/dashboard/ReviewsManagement'));
const CouponsManagement = lazy(() => import('@/pages/dashboard/CouponsManagement'));
const AnalyticsDashboardsManagement = lazy(() => import('@/pages/dashboard/AnalyticsDashboardsManagement'));
const AbandonedCartsManagement = lazy(() => import('@/pages/dashboard/AbandonedCartsManagement'));
const TaxManagement = lazy(() => import('@/pages/dashboard/TaxManagement'));
const DigitalProductsList = lazy(() => import('@/pages/digital/DigitalProductsList'));
const MyDownloads = lazy(() => import('@/pages/digital/MyDownloads'));
const DigitalBundlesManagement = lazy(() => import('@/pages/dashboard/DigitalBundlesManagement'));
const CreateBundle = lazy(() => import('@/pages/digital/CreateBundle'));
const MyLicenses = lazy(() => import('@/pages/digital/MyLicenses'));
const LicenseManagement = lazy(() => import('@/pages/digital/LicenseManagement'));
const DigitalProductAnalytics = lazy(() => import('@/pages/digital/DigitalProductAnalytics'));
const DigitalProductUpdatesDashboard = lazy(() => import('@/pages/digital/DigitalProductUpdatesDashboard'));
const DigitalProductVersionsManagement = lazy(() => import('@/pages/digital/DigitalProductVersionsManagement'));
const PhysicalProductsLotsManagement = lazy(() => import('@/pages/dashboard/PhysicalProductsLotsManagement'));
const SuppliersManagement = lazy(() => import('@/pages/dashboard/SuppliersManagement'));
const DemandForecasting = lazy(() => import('@/pages/dashboard/DemandForecasting'));
const InventoryAnalytics = lazy(() => import('@/pages/dashboard/InventoryAnalytics'));
const ServiceCalendarManagement = lazy(() => import('@/pages/service/ServiceCalendarManagement'));
const StaffAvailabilityCalendar = lazy(() => import('@/pages/service/StaffAvailabilityCalendar'));
const ResourceConflictManagement = lazy(() => import('@/pages/service/ResourceConflictManagement'));
const RecurringBookingsManagement = lazy(() => import('@/pages/service/RecurringBookingsManagement'));
const CalendarIntegrationsPage = lazy(() => import('@/pages/service/CalendarIntegrationsPage'));
const ServiceWaitlistManagementPage = lazy(() => import('@/pages/service/ServiceWaitlistManagementPage'));
const BookingRemindersManagementPage = lazy(() => import('@/pages/service/BookingRemindersManagementPage'));
const OrderMessaging = lazy(() => import('@/pages/orders/OrderMessaging'));
const PaymentManagement = lazy(() => import('@/pages/payments/PaymentManagement'));
const PaymentManagementList = lazy(() => import('@/pages/payments/PaymentManagementList'));
const DisputeDetail = lazy(() => import('@/pages/disputes/DisputeDetail'));
const PayBalance = lazy(() => import('@/pages/payments/PayBalance'));
const PayBalanceList = lazy(() => import('@/pages/payments/PayBalanceList'));
const ShippingDashboard = lazy(() => import('@/pages/shipping/ShippingDashboard'));
const InventoryDashboard = lazy(() => import('@/pages/inventory/InventoryDashboard'));
const ShippingServices = lazy(() => import('@/pages/shipping/ShippingServices'));
const ContactShippingService = lazy(() => import('@/pages/shipping/ContactShippingService'));
const ShippingServiceMessages = lazy(() => import('@/pages/shipping/ShippingServiceMessages'));
const VendorMessaging = lazy(() => import('@/pages/vendor/VendorMessaging'));
const BookingsManagement = lazy(() => import('@/pages/service/BookingsManagement'));
const AdvancedCalendarPage = lazy(() => import('@/pages/service/AdvancedCalendarPage'));
const RecurringBookingsPage = lazy(() => import('@/pages/service/RecurringBookingsPage'));
const ServiceManagementPage = lazy(() => import('@/pages/service/ServiceManagementPage'));
const GamificationPage = lazy(() => import('@/pages/gamification/GamificationPage'));
const ArtistPortfoliosManagement = lazy(() => import('@/pages/dashboard/ArtistPortfoliosManagement'));
const AuctionsManagementPage = lazy(() => import('@/pages/artist/AuctionsManagementPage'));
const AuctionsWatchlistPage = lazy(() => import('@/pages/artist/AuctionsWatchlistPage'));
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const CustomDomainManagement = lazy(() => import('@/pages/dashboard/CustomDomainManagement'));

export const dashboardRoutes = (
  <>
    {/* Core Dashboard */}
    {pr('/dashboard', Dashboard)}
    {pr('/dashboard/store', Store)}
    {pr('/dashboard/store/team', StoreTeamManagement)}
    {pr('/dashboard/tasks', MyTasks)}
    {pr('/dashboard/products', Products)}
    {pr('/dashboard/orders', Orders)}
    {pr('/dashboard/withdrawals', Withdrawals)}
    {pr('/dashboard/payment-methods', PaymentMethods)}
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
    {pr('/dashboard/domain', CustomDomainManagement)}

    {/* Products CRUD */}
    {pr('/dashboard/products/new', CreateProduct)}
    {pr('/dashboard/products/new/:type', CreateProduct)}
    {pr('/dashboard/products/:id/edit', EditProduct)}

    {/* Webhooks */}
    {pr('/dashboard/webhooks', AdminWebhookManagement)}
    <Route path="/dashboard/digital-webhooks" element={<ProtectedRoute><Navigate to="/dashboard/webhooks" replace /></ProtectedRoute>} />
    <Route path="/dashboard/physical-webhooks" element={<ProtectedRoute><Navigate to="/dashboard/webhooks" replace /></ProtectedRoute>} />

    {/* Physical Products */}
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
    {pr('/dashboard/my-courses', MyCourses)}
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
    {pr('/dashboard/licenses/manage/:id', LicenseManagement)}
    {pr('/dashboard/license-management', MyLicenses)}
    {pr('/dashboard/digital/analytics/:productId', DigitalProductAnalytics)}
    {pr('/dashboard/digital/updates', DigitalProductUpdatesDashboard)}
    {pr('/dashboard/digital/updates/:productId', DigitalProductUpdatesDashboard)}
    {pr('/dashboard/digital/products/:productId/versions', DigitalProductVersionsManagement)}

    {/* Services */}
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
    {pr('/dashboard/bookings', BookingsManagement)}
    {pr('/dashboard/advanced-calendar', AdvancedCalendarPage)}
    {pr('/dashboard/recurring-bookings', RecurringBookingsPage)}
    {pr('/dashboard/service-management', ServiceManagementPage)}
    {pr('/dashboard/gamification', GamificationPage)}
    {pr('/dashboard/portfolios', ArtistPortfoliosManagement)}
    {pr('/dashboard/auctions', AuctionsManagementPage)}
    {pr('/dashboard/auctions/watchlist', AuctionsWatchlistPage)}
    {pr('/dashboard/integrations', IntegrationsPage)}
  </>
);
