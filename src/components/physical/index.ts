/**
 * Physical Products Components - Export Index
 * Date: 28 octobre 2025
 */

// Product Cards
export {
  PhysicalProductCard,
  PhysicalProductsGrid,
  PhysicalProductCardSkeleton,
} from './PhysicalProductCard';

// Variant Selector
export { VariantSelector } from './VariantSelector';

// Inventory Components (NEW)
export {
  InventoryStockIndicator,
  CompactStockIndicator,
  DetailedStockIndicator,
  StockBadge,
} from './InventoryStockIndicator';

// Shipping Components (NEW)
export {
  ShippingInfoDisplay,
  CompactShippingInfo,
  DetailedShippingInfo,
  ShippingStatusBadge,
} from './ShippingInfoDisplay';

// Product List Management (DAY 2)
export { PhysicalProductsList } from './PhysicalProductsList';
export type { PhysicalProduct, PhysicalProductsListProps } from './PhysicalProductsList';

// Variant Manager (DAY 2)
export { VariantManager } from './VariantManager';
export type {
  VariantOption,
  ProductVariant,
  VariantManagerProps,
} from './VariantManager';

// Stock Movement History (DAY 3)
export { StockMovementHistory } from './StockMovementHistory';
export type {
  StockMovement,
  MovementType,
  MovementDirection,
  StockMovementHistoryProps,
} from './StockMovementHistory';

// Bulk Inventory Update (DAY 3)
export { BulkInventoryUpdate } from './BulkInventoryUpdate';
export type {
  BulkUpdateMode,
  BulkUpdateItem,
  BulkInventoryUpdateProps,
} from './BulkInventoryUpdate';

// Pre-Order Manager (DAY 6 - WEEK 2)
export { PreOrderManager } from './PreOrderManager';
export type {
  PreOrder,
  PreOrderCustomer,
  PreOrderStatus,
  PreOrderManagerProps,
} from './PreOrderManager';

