import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { logger } from '@/lib/logger';

const pr = (path: string, Component: React.LazyExoticComponent<any>) => (
  <Route path={path} element={<ProtectedRoute><Component /></ProtectedRoute>} />
);

const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminStores = lazy(() => import('@/pages/admin/AdminStores'));
const AdminProducts = lazy(() => import('@/pages/admin/AdminProducts'));
const AdminSales = lazy(() => import('@/pages/admin/AdminSales'));
const AdminReferrals = lazy(() => import('@/pages/admin/AdminReferrals'));
const AdminActivity = lazy(() => import('@/pages/admin/AdminActivity'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));
const AdminCommunity = lazy(() => import('@/pages/admin/AdminCommunity'));
const AdminCommissionSettings = lazy(() => import('@/pages/admin/AdminCommissionSettings'));
const PlatformCustomization = lazy(() =>
  import('@/pages/admin/PlatformCustomization')
    .then(m => ({ default: m.PlatformCustomization }))
    .catch(error => {
      logger.error('Erreur lors du chargement de PlatformCustomization:', { error });
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
const AdminCommissionPayments = lazy(() => import('@/pages/admin/AdminCommissionPayments'));
const MonerooAnalytics = lazy(() => import('@/pages/admin/MonerooAnalytics'));
const MonerooReconciliation = lazy(() => import('@/pages/admin/MonerooReconciliation'));
const TransactionMonitoring = lazy(() => import('@/pages/admin/TransactionMonitoring'));
const AdminNotifications = lazy(() => import('@/pages/admin/AdminNotifications'));
const AdminDisputes = lazy(() => import('@/pages/admin/AdminDisputes'));
const AdminAffiliates = lazy(() => import('@/pages/admin/AdminAffiliates'));
const AdminStoreWithdrawals = lazy(() => import('@/pages/admin/AdminStoreWithdrawals'));
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews').then(m => ({ default: m.AdminReviews })));
const AdminInventory = lazy(() => import('@/pages/admin/AdminInventory'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));
const AISettingsPage = lazy(() => import('@/pages/admin/AISettingsPage'));
const AdminPayments = lazy(() => import('@/pages/admin/AdminPayments'));
const AdminTransactionReconciliation = lazy(() => import('@/pages/admin/AdminTransactionReconciliation'));
const AdminShipping = lazy(() => import('@/pages/admin/AdminShipping'));
const AdminShippingConversations = lazy(() => import('@/pages/admin/AdminShippingConversations'));
const AdminVendorConversations = lazy(() => import('@/pages/admin/AdminVendorConversations'));
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'));
const AdminSecurity = lazy(() => import('@/pages/admin/AdminSecurity'));
const AdminAudit = lazy(() => import('@/pages/admin/AdminAudit'));
const AdminTaxManagement = lazy(() => import('@/pages/admin/AdminTaxManagement'));
const AdminReturnManagement = lazy(() => import('@/pages/admin/AdminReturnManagement'));
const AdminWebhookManagement = lazy(() => import('@/pages/admin/AdminWebhookManagement'));
const AdminLoyaltyManagement = lazy(() => import('@/pages/admin/AdminLoyaltyManagement'));
const AdminGiftCardManagement = lazy(() => import('@/pages/admin/AdminGiftCardManagement'));
const AdminSuppliersManagement = lazy(() => import('@/pages/admin/AdminSuppliersManagement'));
const AdminWarehousesManagement = lazy(() => import('@/pages/admin/AdminWarehousesManagement'));
const AdminProductKitsManagement = lazy(() => import('@/pages/admin/AdminProductKitsManagement'));
const AdminDemandForecasting = lazy(() => import('@/pages/admin/AdminDemandForecasting'));
const AdminCostOptimization = lazy(() => import('@/pages/admin/AdminCostOptimization'));
const AdminBatchShipping = lazy(() => import('@/pages/admin/AdminBatchShipping'));
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'));
const AdminErrorMonitoring = lazy(() => import('@/pages/admin/AdminErrorMonitoring'));
const AdminMonitoring = lazy(() => import('@/pages/admin/AdminMonitoring'));
const AdminAccessibilityReport = lazy(() => import('@/pages/admin/AdminAccessibilityReport'));
const AdminDataStorage = lazy(() => import('@/pages/admin/AdminDataStorage'));
const OfflineQueueManager = lazy(() => import('@/pages/admin/OfflineQueueManager'));
const StorageDiagnosticPage = lazy(() => import('@/pages/admin/StorageDiagnosticPage'));
const IntegrationsPage = lazy(() => import('@/pages/admin/IntegrationsPage'));
const PlatformRevenue = lazy(() => import('@/pages/PlatformRevenue'));
const AdminKYC = lazy(() => import('@/pages/AdminKYC'));
const MarketingAutomationDashboard = lazy(() =>
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
    {pr('/admin/moneroo-analytics', MonerooAnalytics)}
    {pr('/admin/moneroo-reconciliation', MonerooReconciliation)}
    {pr('/admin/transaction-monitoring', TransactionMonitoring)}
    {pr('/admin/notifications', AdminNotifications)}
    {pr('/admin/revenue', PlatformRevenue)}
    {pr('/admin/kyc', AdminKYC)}
    {pr('/admin/disputes', AdminDisputes)}
    {pr('/admin/affiliates', AdminAffiliates)}
    {pr('/admin/store-withdrawals', AdminStoreWithdrawals)}
    {pr('/admin/reviews', AdminReviews)}
    {pr('/admin/inventory', AdminInventory)}
    {pr('/admin/support', AdminSupport)}
    {pr('/admin/analytics', AdminAnalytics)}
    {pr('/admin/ai-settings', AISettingsPage)}
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
    {pr('/admin/integrations', IntegrationsPage)}
    {pr('/admin/webhooks', AdminWebhookManagement)}
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
    {pr('/admin/monitoring', AdminMonitoring)}
    {pr('/admin/accessibility', AdminAccessibilityReport)}
    {pr('/admin/storage-diagnostic', StorageDiagnosticPage)}
    {pr('/admin/community', AdminCommunity)}
  </>
);
