import {
  hasPhysicalFeatureAccess,
  requiredPlanForFeature,
  type PhysicalFeatureKey,
  type PhysicalPlanSlug,
} from '@/lib/billing/physical-plan-capabilities';

const PHYSICAL_ROUTE_FEATURES: Record<string, PhysicalFeatureKey> = {
  '/dashboard/emails/campaigns': 'emails.manage',
  '/dashboard/emails/sequences': 'emails.manage',
  '/dashboard/emails/segments': 'emails.manage',
  '/dashboard/emails/analytics': 'emails.manage',
  '/dashboard/emails/workflows': 'emails.manage',
  '/dashboard/emails/tags': 'emails.manage',
  '/dashboard/emails/templates/editor': 'emails.manage',
  '/dashboard/shipping-services': 'shipping.tracking',
  '/dashboard/physical-analytics': 'analytics.physical',
  '/dashboard/suppliers': 'suppliers.manage',

  '/dashboard/batch-shipping': 'batch_shipping.manage',
  '/dashboard/warehouses': 'warehouses.manage',
  '/dashboard/physical-lots': 'lots_expiration.manage',
  '/dashboard/physical-serial-tracking': 'serial_tracking.manage',
  '/dashboard/physical-barcode-scanner': 'barcode_scanner.use',
  '/dashboard/physical-preorders': 'preorders.manage',
  '/dashboard/physical-backorders': 'backorders.manage',
  '/dashboard/physical-bundles': 'bundles.manage',
  '/dashboard/demand-forecasting': 'forecasting.demand',
  '/dashboard/cost-optimization': 'cost_optimization.manage',
};

export function requiredPhysicalFeatureForPath(pathname: string): PhysicalFeatureKey | null {
  const normalized = pathname.replace(/\/+$/, '') || '/dashboard';
  if (PHYSICAL_ROUTE_FEATURES[normalized]) {
    return PHYSICAL_ROUTE_FEATURES[normalized];
  }

  const prefix = Object.keys(PHYSICAL_ROUTE_FEATURES)
    .filter(p => normalized === p || normalized.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0];

  return prefix ? PHYSICAL_ROUTE_FEATURES[prefix] : null;
}

export function canAccessSellerPath(pathname: string, planSlug: PhysicalPlanSlug): boolean {
  const requiredFeature = requiredPhysicalFeatureForPath(pathname);
  if (!requiredFeature) return true;
  return hasPhysicalFeatureAccess(planSlug, requiredFeature);
}

export function requiredPlanLabelForPath(pathname: string): string | null {
  const feature = requiredPhysicalFeatureForPath(pathname);
  if (!feature) return null;
  return requiredPlanForFeature(feature).replace('physical_', '').toUpperCase();
}
