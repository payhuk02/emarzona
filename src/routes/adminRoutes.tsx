import React from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Navigate, Route } from 'react-router-dom';
import { AdminAppLayout } from '@/components/layout/AdminAppLayout';
import { logger } from '@/lib/logger';

const page = (path: string, Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Route path={path} element={<Component />} />
);

const AdminDashboard = lazyPage(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazyPage(() => import('@/pages/admin/AdminUsers'));
const AdminStores = lazyPage(() => import('@/pages/admin/AdminStores'));
const AdminProducts = lazyPage(() => import('@/pages/admin/AdminProducts'));
const AdminSales = lazyPage(() => import('@/pages/admin/AdminSales'));
const AdminReferrals = lazyPage(() => import('@/pages/admin/AdminReferrals'));
const AdminActivity = lazyPage(() => import('@/pages/admin/AdminActivity'));
const AdminSettings = lazyPage(() => import('@/pages/admin/AdminSettings'));
const AdminCommunity = lazyPage(() => import('@/pages/admin/AdminCommunity'));
const AdminCommissionSettings = lazyPage(() => import('@/pages/admin/AdminCommissionSettings'));
const AdminPaymentRails = lazyPage(() => import('@/pages/admin/AdminPaymentRails'));
const AdminNewsletterSubscribers = lazyPage(
  () => import('@/pages/admin/AdminNewsletterSubscribers')
);
const PlatformCustomization = lazyPage(() =>
  import('@/pages/admin/PlatformCustomization')
    .then(m => ({ default: m.PlatformCustomization }))
    .catch(error => {
      logger.error('Erreur lors du chargement de PlatformCustomization:', { error });
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
const AdminCommissionPayments = lazyPage(() => import('@/pages/admin/AdminCommissionPayments'));
const GeniusPayAnalytics = lazyPage(() => import('@/pages/admin/GeniusPayAnalytics'));
const GeniusPayReconciliation = lazyPage(() => import('@/pages/admin/GeniusPayReconciliation'));
const TransactionMonitoring = lazyPage(() => import('@/pages/admin/TransactionMonitoring'));
const AdminNotifications = lazyPage(() => import('@/pages/admin/AdminNotifications'));
const AdminDisputes = lazyPage(() => import('@/pages/admin/AdminDisputes'));
const AdminAffiliates = lazyPage(() => import('@/pages/admin/AdminAffiliates'));
const AdminStoreWithdrawals = lazyPage(() => import('@/pages/admin/AdminStoreWithdrawals'));
const AdminStoreCommerce = lazyPage(() => import('@/pages/admin/AdminStoreCommerce'));
const AdminServiceCategories = lazyPage(() => import('@/pages/admin/AdminServiceCategories'));
const AdminReviews = lazyPage(() =>
  import('@/pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews }))
);
const AdminInventory = lazyPage(() => import('@/pages/admin/AdminInventory'));
const AdminSupport = lazyPage(() => import('@/pages/admin/AdminSupport'));
const AdminAnalytics = lazyPage(() => import('@/pages/admin/AdminAnalytics'));
const AdminVisitors = lazyPage(() => import('@/pages/admin/AdminVisitors'));
const AISettingsPage = lazyPage(() => import('@/pages/admin/AISettingsPage'));
const AIManagementPage = lazyPage(() => import('@/pages/admin/AIManagementPage'));
const AdminPayments = lazyPage(() => import('@/pages/admin/AdminPayments'));
const AdminTransactionReconciliation = lazyPage(
  () => import('@/pages/admin/AdminTransactionReconciliation')
);
const AdminShipping = lazyPage(() => import('@/pages/admin/AdminShipping'));
const AdminShippingConversations = lazyPage(
  () => import('@/pages/admin/AdminShippingConversations')
);
const AdminVendorConversations = lazyPage(() => import('@/pages/admin/AdminVendorConversations'));
const AdminCourses = lazyPage(() => import('@/pages/admin/AdminCourses'));
const AdminSecurity = lazyPage(() => import('@/pages/admin/AdminSecurity'));
const AdminAudit = lazyPage(() => import('@/pages/admin/AdminAudit'));
const AdminTaxManagement = lazyPage(() => import('@/pages/admin/AdminTaxManagement'));
const AdminReturnManagement = lazyPage(() => import('@/pages/admin/AdminReturnManagement'));
const AdminWebhookManagement = lazyPage(() => import('@/pages/admin/AdminWebhookManagement'));
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
const AdminOrders = lazyPage(() => import('@/pages/admin/AdminOrders'));
const AdminErrorMonitoring = lazyPage(() => import('@/pages/admin/AdminErrorMonitoring'));
const AdminMonitoring = lazyPage(() => import('@/pages/admin/AdminMonitoring'));
const AdminFulfillmentAlerts = lazyPage(() => import('@/pages/admin/AdminFulfillmentAlerts'));
const AdminPlatformFaq = lazyPage(() => import('@/pages/admin/AdminPlatformFaq'));
const AdminPlatformBlog = lazyPage(() => import('@/pages/admin/AdminPlatformBlog'));
const AdminSponsorships = lazyPage(() => import('@/pages/admin/AdminSponsorships'));
const AdminArticleComments = lazyPage(() => import('@/pages/admin/AdminArticleComments'));
const AdminAccessibilityReport = lazyPage(() => import('@/pages/admin/AdminAccessibilityReport'));
const AdminDataStorage = lazyPage(() => import('@/pages/admin/AdminDataStorage'));
const OfflineQueueManager = lazyPage(() => import('@/pages/admin/OfflineQueueManager'));
const StorageDiagnosticPage = lazyPage(() => import('@/pages/admin/StorageDiagnosticPage'));
const AdminPlatformIntegrations = lazyPage(() => import('@/pages/admin/AdminPlatformIntegrations'));
const AdminDomains = lazyPage(() => import('@/pages/admin/AdminDomains'));
const AdminFeatureFlags = lazyPage(() => import('@/pages/admin/AdminFeatureFlags'));
const AdminAdvancedTools = lazyPage(() => import('@/pages/admin/AdminAdvancedTools'));
const AdminRecommendationInsights = lazyPage(
  () => import('@/pages/admin/AdminRecommendationInsights')
);
const AdminApiKeys = lazyPage(() => import('@/pages/admin/AdminApiKeys'));
const AdminSubscriptions = lazyPage(() => import('@/pages/admin/AdminSubscriptions'));
const AdminVendorBilling = lazyPage(() => import('@/pages/admin/AdminVendorBilling'));
const PlatformRevenue = lazyPage(() => import('@/pages/PlatformRevenue'));
const AdminCheckoutFees = lazyPage(() => import('@/pages/admin/AdminCheckoutFees'));
const AdminKYC = lazyPage(() => import('@/pages/AdminKYC'));
const MarketingAutomationDashboard = lazyPage(() =>
  import('@/components/marketing/MarketingAutomationDashboard').then(m => ({
    default: m.MarketingAutomationDashboard,
  }))
);

export const adminRoutes = (
  <Route element={<AdminAppLayout />}>
    {page('/admin', AdminDashboard)}
    {page('/admin/users', AdminUsers)}
    {page('/admin/stores', AdminStores)}
    {page('/admin/products', AdminProducts)}
    {page('/admin/sales', AdminSales)}
    {page('/admin/referrals', AdminReferrals)}
    {page('/admin/activity', AdminActivity)}
    {page('/admin/settings', AdminSettings)}
    {page('/admin/commission-settings', AdminCommissionSettings)}
    {page('/admin/commission-payments', AdminCommissionPayments)}
    {page('/admin/platform-customization', PlatformCustomization)}
    {page('/admin/platform-faq', AdminPlatformFaq)}
    {page('/admin/platform-blog', AdminPlatformBlog)}
    {page('/admin/sponsorships', AdminSponsorships)}
    {page('/admin/article-comments', AdminArticleComments)}
    {page('/admin/newsletter-subscribers', AdminNewsletterSubscribers)}
    {page('/admin/payment-analytics', GeniusPayAnalytics)}
    <Route
      path="/admin/geniuspay-analytics"
      element={<Navigate to="/admin/payment-analytics" replace />}
    />
    {page('/admin/payment-reconciliation', GeniusPayReconciliation)}
    <Route
      path="/admin/geniuspay-reconciliation"
      element={<Navigate to="/admin/payment-reconciliation" replace />}
    />
    {page('/admin/transaction-monitoring', TransactionMonitoring)}
    {page('/admin/notifications', AdminNotifications)}
    {page('/admin/revenue', PlatformRevenue)}
    {page('/admin/checkout-fees', AdminCheckoutFees)}
    {page('/admin/kyc', AdminKYC)}
    {page('/admin/disputes', AdminDisputes)}
    {page('/admin/affiliates', AdminAffiliates)}
    {page('/admin/store-withdrawals', AdminStoreWithdrawals)}
    {page('/admin/store-commerce', AdminStoreCommerce)}
    {page('/admin/service-categories', AdminServiceCategories)}
    {page('/admin/reviews', AdminReviews)}
    {page('/admin/inventory', AdminInventory)}
    {page('/admin/support', AdminSupport)}
    {page('/admin/analytics', AdminAnalytics)}
    {page('/admin/visitors', AdminVisitors)}
    {page('/admin/ai-settings', AISettingsPage)}
    {page('/admin/ai-management', AIManagementPage)}
    {page('/admin/marketing', MarketingAutomationDashboard)}
    {page('/admin/payments', AdminPayments)}
    {page('/admin/payment-rails', AdminPaymentRails)}
    {page('/admin/transaction-reconciliation', AdminTransactionReconciliation)}
    {page('/admin/shipping', AdminShipping)}
    {page('/admin/shipping-conversations', AdminShippingConversations)}
    {page('/admin/vendor-conversations', AdminVendorConversations)}
    {page('/admin/courses', AdminCourses)}
    {page('/admin/security', AdminSecurity)}
    {page('/admin/audit', AdminAudit)}
    {page('/admin/taxes', AdminTaxManagement)}
    {page('/admin/returns', AdminReturnManagement)}
    {page('/admin/integrations', AdminPlatformIntegrations)}
    {page('/admin/domains', AdminDomains)}
    {page('/admin/feature-flags', AdminFeatureFlags)}
    {page('/admin/advanced-tools', AdminAdvancedTools)}
    {page('/admin/recommendation-insights', AdminRecommendationInsights)}
    {page('/admin/webhooks', AdminWebhookManagement)}
    {page('/admin/api-keys', AdminApiKeys)}
    {page('/admin/subscriptions', AdminSubscriptions)}
    {page('/admin/vendor-billing', AdminVendorBilling)}
    {page('/admin/loyalty', AdminLoyaltyManagement)}
    {page('/admin/gift-cards', AdminGiftCardManagement)}
    {page('/admin/suppliers', AdminSuppliersManagement)}
    {page('/admin/warehouses', AdminWarehousesManagement)}
    {page('/admin/product-kits', AdminProductKitsManagement)}
    {page('/admin/demand-forecasting', AdminDemandForecasting)}
    {page('/admin/cost-optimization', AdminCostOptimization)}
    {page('/admin/batch-shipping', AdminBatchShipping)}
    {page('/admin/data-storage', AdminDataStorage)}
    {page('/admin/offline-queue', OfflineQueueManager)}
    {page('/admin/orders', AdminOrders)}
    {page('/admin/error-monitoring', AdminErrorMonitoring)}
    {page('/admin/fulfillment-alerts', AdminFulfillmentAlerts)}
    {page('/admin/monitoring', AdminMonitoring)}
    {page('/admin/accessibility', AdminAccessibilityReport)}
    {page('/admin/storage-diagnostic', StorageDiagnosticPage)}
    {page('/admin/community', AdminCommunity)}
  </Route>
);
