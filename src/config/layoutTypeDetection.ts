import type { LayoutType } from '@/components/layout/MainLayout';

export type LayoutTypeRule = {
  layoutType: LayoutType;
  /** Higher priority wins when multiple rules match */
  priority: number;
  match: (pathname: string) => boolean;
};

/**
 * Declarative layout detection for context sidebars.
 * Sorted by priority descending at runtime.
 */
export const LAYOUT_TYPE_RULES: LayoutTypeRule[] = [
  { layoutType: 'affiliate', priority: 100, match: p => p.includes('/affiliate/') },
  {
    layoutType: 'digital-portal',
    priority: 95,
    match: p =>
      p.startsWith('/account/digital') ||
      p.startsWith('/account/downloads') ||
      p.includes('/my-licenses') ||
      p.includes('/digital/updates'),
  },
  {
    layoutType: 'physical-portal',
    priority: 94,
    match: p => p.startsWith('/account/physical'),
  },
  {
    layoutType: 'courses',
    priority: 93,
    match: p =>
      p.startsWith('/account/courses') ||
      p.includes('/dashboard/courses/') ||
      p.includes('/dashboard/my-courses'),
  },
  {
    layoutType: 'store',
    priority: 92,
    match: p => p.includes('/dashboard/store/') || p === '/dashboard/store',
  },
  {
    layoutType: 'promotions',
    priority: 91,
    match: p => p.includes('/dashboard/promotions') || p === '/promotions',
  },
  {
    layoutType: 'bookings',
    priority: 90,
    match: p =>
      p.includes('/bookings') ||
      p.includes('/advanced-calendar') ||
      p.includes('/service-management') ||
      p.includes('/recurring-bookings') ||
      p.includes('/services/'),
  },
  {
    layoutType: 'inventory',
    priority: 89,
    match: p =>
      p.includes('/dashboard/inventory') ||
      p.includes('/physical-inventory') ||
      p.includes('/physical-lots') ||
      p.includes('/physical-serial-tracking') ||
      p.includes('/physical-barcode-scanner') ||
      p.includes('/physical-preorders') ||
      p.includes('/physical-backorders'),
  },
  {
    layoutType: 'shipping',
    priority: 88,
    match: p =>
      p.includes('/dashboard/shipping') ||
      p.includes('/shipping-services') ||
      p.includes('/contact-shipping-service') ||
      p.includes('/batch-shipping'),
  },
  { layoutType: 'settings', priority: 80, match: p => p.includes('/settings') },
  { layoutType: 'emails', priority: 79, match: p => p.includes('/emails') },
  {
    layoutType: 'products',
    priority: 78,
    match: p =>
      p.includes('/products') ||
      p.includes('/digital-products') ||
      p.includes('/my-downloads') ||
      p.includes('/bundles') ||
      p.includes('/updates'),
  },
  {
    layoutType: 'orders',
    priority: 77,
    match: p =>
      p.includes('/orders') || p.includes('/advanced-orders') || p.includes('/vendor/messaging'),
  },
  {
    layoutType: 'finance',
    priority: 76,
    match: p =>
      p.includes('/payments') ||
      p.includes('/pay-balance') ||
      p.includes('/payment-management') ||
      p.includes('/withdrawals') ||
      p.includes('/payment-methods') ||
      p.includes('/payment-connections'),
  },
  {
    layoutType: 'customers',
    priority: 75,
    match: p => p.includes('/customers') || p.includes('/referrals') || p.includes('/affiliates'),
  },
  {
    layoutType: 'analytics',
    priority: 74,
    match: p => p.includes('/analytics') || p.includes('/pixels') || p.includes('/seo'),
  },
  {
    layoutType: 'systems',
    priority: 73,
    match: p =>
      p.includes('/integrations') ||
      p.includes('/webhooks') ||
      p.includes('/loyalty') ||
      p.includes('/gift-cards'),
  },
  { layoutType: 'account', priority: 72, match: p => p.startsWith('/account') },
  {
    layoutType: 'sales',
    priority: 71,
    match: p =>
      p.includes('/product-kits') ||
      p.includes('/demand-forecasting') ||
      p.includes('/cost-optimization') ||
      p.includes('/suppliers') ||
      p.includes('/warehouses'),
  },
  {
    layoutType: 'marketing',
    priority: 70,
    match: p => p === '/dashboard/marketing' || p.startsWith('/dashboard/marketing/'),
  },
];

export function detectLayoutType(pathname: string): LayoutType {
  const path = pathname.split('?')[0];
  const sorted = [...LAYOUT_TYPE_RULES].sort((a, b) => b.priority - a.priority);
  for (const rule of sorted) {
    if (rule.match(path)) return rule.layoutType;
  }
  return 'default';
}
