export type PhysicalPlanSlug = 'physical_basic' | 'physical_standard' | 'physical_premium' | null;

export type PhysicalFeatureKey =
  | 'whatsapp.product_button'
  | 'emails.manage'
  | 'shipping.tracking'
  | 'shipping.fedex_live'
  | 'suppliers.manage'
  | 'analytics.physical'
  | 'batch_shipping.manage'
  | 'warehouses.manage'
  | 'lots_expiration.manage'
  | 'serial_tracking.manage'
  | 'barcode_scanner.use'
  | 'preorders.manage'
  | 'backorders.manage'
  | 'bundles.manage'
  | 'forecasting.demand'
  | 'cost_optimization.manage';

const PLAN_RANK: Record<Exclude<PhysicalPlanSlug, null>, number> = {
  physical_basic: 1,
  physical_standard: 2,
  physical_premium: 3,
};

const MIN_PLAN_BY_FEATURE: Record<PhysicalFeatureKey, Exclude<PhysicalPlanSlug, null>> = {
  'whatsapp.product_button': 'physical_basic',
  'emails.manage': 'physical_standard',
  'shipping.tracking': 'physical_standard',
  'shipping.fedex_live': 'physical_standard',
  'suppliers.manage': 'physical_standard',
  'analytics.physical': 'physical_standard',
  'serial_tracking.manage': 'physical_standard',
  'warehouses.manage': 'physical_standard',
  'batch_shipping.manage': 'physical_premium',
  'lots_expiration.manage': 'physical_premium',
  'barcode_scanner.use': 'physical_premium',
  'preorders.manage': 'physical_premium',
  'backorders.manage': 'physical_premium',
  'bundles.manage': 'physical_premium',
  'forecasting.demand': 'physical_premium',
  'cost_optimization.manage': 'physical_premium',
};

export function hasPhysicalFeatureAccess(
  planSlug: PhysicalPlanSlug,
  featureKey: PhysicalFeatureKey
): boolean {
  if (!planSlug) return false;
  const current = PLAN_RANK[planSlug as Exclude<PhysicalPlanSlug, null>] ?? 0;
  const required = PLAN_RANK[MIN_PLAN_BY_FEATURE[featureKey]];
  return current >= required;
}

export function requiredPlanForFeature(
  featureKey: PhysicalFeatureKey
): Exclude<PhysicalPlanSlug, null> {
  return MIN_PLAN_BY_FEATURE[featureKey];
}
