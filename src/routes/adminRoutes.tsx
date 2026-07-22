import React from 'react';
import { lazyPage } from '@/routes/lazyPage';
import { Route } from 'react-router-dom';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';
import { logger } from '@/lib/logger';

const pr = (path: string, Component: React.LazyExoticComponent<React.ComponentType>) => (
  <Route
    path={path}
    element={
      <ProtectedAdminRoute>
        <Component />
      </ProtectedAdminRoute>
    }
  />
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
const AdminReviews = lazyPage(() =>
  import('@/pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews }))
);
const AdminInventory = lazyPage(() => import('@/pages/admin/AdminInventory'));
const AdminSupport = lazyPage(() => import('@/pages/admin/AdminSupport'));
const AdminAnalytics = lazyPage(() => import('@/pages/admin/AdminAnalytics'));
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
  <>
    {pr('/admin', AdminDashboard)}
    {pr('/admin/users', AdminUsers)}
    {pr('/admin/stores', AdminStores)}
    {pr('/admin/products', AdminProducts)}
    {pr('/admin/sales', AdminSales)}
    {pr('/admin/referrals', AdminReferrals)}
    {pr('/admin/activity', AdminActivity)}
    {pr('/admin/settings', AdminSettings)}
    {pr('/admin/commission-settings', AdminCommissionSettings)}
    {pr('/admin/commission-payments', AdminCommissionPayments)}
    {pr('/admin/platform-customization', PlatformCustomization)}
    {pr('/admin/platform-faq', AdminPlatformFaq)}
    {pr('/admin/platform-blog', AdminPlatformBlog)}
    {pr('/admin/newsletter-subscribers', AdminNewsletterSubscribers)}
    {pr('/admin/geniuspay-analytics', GeniusPayAnalytics)}
    {pr('/admin/geniuspay-reconciliation', GeniusPayReconciliation)}
    {pr('/admin/transaction-monitoring', TransactionMonitoring)}
    {pr('/admin/notifications', AdminNotifications)}
    {pr('/admin/revenue', PlatformRevenue)}
    {pr('/admin/checkout-fees', AdminCheckoutFees)}
    {pr('/admin/kyc', AdminKYC)}
    {pr('/admin/disputes', AdminDisputes)}
    {pr('/admin/affiliates', AdminAffiliates)}
    {pr('/admin/store-withdrawals', AdminStoreWithdrawals)}
    {pr('/admin/reviews', AdminReviews)}
    {pr('/admin/inventory', AdminInventory)}
    {pr('/admin/support', AdminSupport)}
    {pr('/admin/analytics', AdminAnalytics)}
    {pr('/admin/ai-settings', AISettingsPage)}
    {pr('/admin/ai-management', AIManagementPage)}
    {pr('/admin/marketing', MarketingAutomationDashboard)}
    {pr('/admin/payments', AdminPayments)}
    {pr('/admin/transaction-reconciliation', AdminTransactionReconciliation)}
    {pr('/admin/shipping', AdminShipping)}
    {pr('/admin/shipping-conversations', AdminShippingConversations)}
    {pr('/admin/vendor-conversations', AdminVendorConversations)}
    {pr('/admin/courses', AdminCourses)}
    {pr('/admin/security', AdminSecurity)}
    {pr('/admin/audit', AdminAudit)}
    {pr('/admin/taxes', AdminTaxManagement)}
    {pr('/admin/returns', AdminReturnManagement)}
    {pr('/admin/integrations', AdminPlatformIntegrations)}
    {pr('/admin/domains', AdminDomains)}
    {pr('/admin/feature-flags', AdminFeatureFlags)}
    {pr('/admin/advanced-tools', AdminAdvancedTools)}
    {pr('/admin/recommendation-insights', AdminRecommendationInsights)}
    {pr('/admin/webhooks', AdminWebhookManagement)}
    {pr('/admin/api-keys', AdminApiKeys)}
    {pr('/admin/subscriptions', AdminSubscriptions)}
    {pr('/admin/vendor-billing', AdminVendorBilling)}
    {pr('/admin/loyalty', AdminLoyaltyManagement)}
    {pr('/admin/gift-cards', AdminGiftCardManagement)}
    {pr('/admin/suppliers', AdminSuppliersManagement)}
    {pr('/admin/warehouses', AdminWarehousesManagement)}
    {pr('/admin/product-kits', AdminProductKitsManagement)}
    {pr('/admin/demand-forecasting', AdminDemandForecasting)}
    {pr('/admin/cost-optimization', AdminCostOptimization)}
    {pr('/admin/batch-shipping', AdminBatchShipping)}
    {pr('/admin/data-storage', AdminDataStorage)}
    {pr('/admin/offline-queue', OfflineQueueManager)}
    {pr('/admin/orders', AdminOrders)}
    {pr('/admin/error-monitoring', AdminErrorMonitoring)}
    {pr('/admin/fulfillment-alerts', AdminFulfillmentAlerts)}
    {pr('/admin/monitoring', AdminMonitoring)}
    {pr('/admin/accessibility', AdminAccessibilityReport)}
    {pr('/admin/storage-diagnostic', StorageDiagnosticPage)}
    {pr('/admin/community', AdminCommunity)}
  </>
);
