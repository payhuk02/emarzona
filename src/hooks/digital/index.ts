/**
 * Digital Products Hooks - Export Index
 * Date: 29 octobre 2025
 * Updated: Audit P1 - Export complet
 */

// ============================================================
// 💾 SYSTÈME AVANCÉ DIGITAL - PHASE 4 (Jour 4)
// ============================================================

// Hook CRUD Produits Digitaux
export {
  useDigitalProducts,
  useDigitalProduct,
  useCreateDigitalProduct,
  useUpdateDigitalProduct,
  useDeleteDigitalProduct,
  useBulkUpdateDigitalProducts,
  useDigitalProductStats,
  useDigitalProductsByCategory,
  useDigitalProductsByStatus,
  type DigitalProduct,
  type DigitalProductData,
} from './useDigitalProducts';

// Hook Gestion Téléchargements Clients
export {
  useCustomerDownloads,
  useCustomerDownloadsByProduct,
  useCustomerDownloadsByCustomer,
  useRevokeDownloadAccess,
  useRestoreDownloadAccess,
  useUpdateDownloadLimit,
  useCustomerDownloadStats,
  useDownloadEvents,
  type CustomerDownload,
} from './useCustomerDownloads';

// Hook Alertes
export {
  useDigitalAlerts,
  useUnreadAlerts,
  useCriticalAlerts,
  useAlertsByProduct,
  useMarkAlertAsRead,
  useMarkAllAlertsAsRead,
  useResolveAlert,
  useDeleteAlert,
  useAlertStats,
  useCreateAlert,
  type DigitalAlert,
  type DigitalAlertType,
  type AlertPriority,
} from './useDigitalAlerts';

// Hook Rapports
export {
  useSalesReport,
  useDownloadsReport,
  useLicensesReport,
  useCustomersReport,
  type ReportPeriod,
  type SalesReport,
  type DownloadsReport,
  type LicensesReport,
  type CustomersReport,
} from './useDigitalReports';

// ============================================================
// 💾 HOOKS EXISTANTS (Sprints 2-3)
// ============================================================

// Re-export existing hooks
export * from './useLicenseManagement';
export * from './useProductVersions';
export * from './useProductVersionRollback';
export * from './useProductUpdates';
export * from './useSecureDownload';

// ============================================================
// 💾 HOOKS ADDITIONNELS (Audit P1)
// ============================================================

export * from './useAdvancedFileManagement';
export * from './useCouponEnhancements';
export * from './useCoupons';
export * from './useCustomerPurchasedProducts';
export * from './useDigitalAnalytics';
export * from './useDigitalBundles';
export * from './useDigitalNotifications';
export * from './useDigitalProductVersions';
export * from './useDigitalSubscriptions';
export * from './useDownloads';
export * from './useDripContent';
export * from './useLicenses';
export * from './useSubscriptionEnhancements';
export * from './useWebhooks';
