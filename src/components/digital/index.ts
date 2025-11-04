/**
 * Digital Products Components - Export Index
 * Date: 29 octobre 2025
 * Updated: Phase 4 - Digital Products Professional System
 */

// ============================================================
// 💾 SYSTÈME AVANCÉ DIGITAL - PHASE 4 (Jour 1)
// ============================================================

// Indicateurs de statut
export {
  DigitalProductStatusIndicator,
  type DigitalProductStatus,
  type DigitalStatusVariant,
  type DigitalProductStatusIndicatorProps,
} from './DigitalProductStatusIndicator';

// Affichage des téléchargements
export {
  DownloadInfoDisplay,
  type DownloadStatus,
  type DownloadInfoVariant,
  type DownloadCustomer,
  type DownloadProduct,
  type DownloadInfoDisplayProps,
} from './DownloadInfoDisplay';

// ============================================================
// 💾 SYSTÈME AVANCÉ DIGITAL - PHASE 4 (Jour 2)
// ============================================================

// Gestion des listes de produits
export {
  DigitalProductsList,
  type DigitalCategory,
  type DigitalSortField,
  type SortDirection,
  type DigitalProductListItem,
  type DigitalProductsListProps,
} from './DigitalProductsList';

// Gestion des bundles
export {
  DigitalBundleManager,
  type BundleDigitalProduct,
  type BundleDiscountType,
  type DigitalBundle,
  type DigitalBundleManagerProps,
} from './DigitalBundleManager';

// ============================================================
// 💾 SYSTÈME AVANCÉ DIGITAL - PHASE 4 (Jour 3)
// ============================================================

// Historique des téléchargements
export {
  DownloadHistory,
  type DownloadEventType,
  type DownloadEvent,
  type PeriodFilter,
  type DownloadHistoryProps,
} from './DownloadHistory';

// Mise à jour groupée
export {
  BulkDigitalUpdate,
  type BulkUpdateField,
  type UpdateMode,
  type BulkUpdateDigitalProduct,
  type BulkUpdateChange,
  type BulkDigitalUpdateProps,
} from './BulkDigitalUpdate';

// ============================================================
// 💾 SYSTÈME AVANCÉ DIGITAL - PHASE 4 (Jour 5)
// ============================================================

// Gestion des accès clients
export {
  CustomerAccessManager,
  type CustomerAccess,
  type CustomerAccessManagerProps,
} from './CustomerAccessManager';

// Dashboard principal
export {
  DigitalProductsDashboard,
  type DashboardStats,
  type PopularProduct,
  type RecentActivity,
  type CategoryPerformance,
  type DigitalProductsDashboardProps,
} from './DigitalProductsDashboard';

// ============================================================
// 💾 COMPOSANTS EXISTANTS
// ============================================================

// Cards
export { 
  DigitalProductCard,
  DigitalProductCardSkeleton,
  DigitalProductsGrid,
} from './DigitalProductCard';

export {
  DigitalLicenseCard,
  DigitalLicenseCardSkeleton,
  DigitalLicensesGrid,
} from './DigitalLicenseCard';

// Interactions
export {
  DigitalDownloadButton,
  DigitalDownloadButtonCompact,
} from './DigitalDownloadButton';

// Analytics
export { DigitalAnalyticsDashboard } from './DigitalAnalyticsDashboard';

// License Management
export { LicenseTable } from './LicenseTable';
export { LicenseGenerator } from './LicenseGenerator';
export { LicenseManagementDashboard } from './LicenseManagementDashboard';

// Version Management
export { VersionManagementDashboard } from './VersionManagementDashboard';

// Download Protection
export { DownloadProtectionDashboard } from './DownloadProtectionDashboard';
export { SecureDownloadButton } from './SecureDownloadButton';

// Bundles
export {
  DigitalBundleCard,
  DigitalBundlesGrid,
} from './DigitalBundleCard';

// Subscriptions
export {
  DigitalSubscriptionCard,
  DigitalSubscriptionsGrid,
} from './DigitalSubscriptionCard';

