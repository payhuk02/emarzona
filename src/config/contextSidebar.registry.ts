import type { LayoutType } from '@/components/layout/MainLayout';
import type { ContextSidebarConfigId } from '@/config/navigation.context';

/** Maps MainLayout layout types to context sidebar configs (Phase 7) */
export const LAYOUT_CONTEXT_SIDEBAR_MAP: Partial<Record<LayoutType, ContextSidebarConfigId>> = {
  settings: 'settings',
  emails: 'emails',
  products: 'products',
  orders: 'orders',
  customers: 'customers',
  analytics: 'analytics',
  account: 'account',
  sales: 'sales',
  finance: 'finance',
  marketing: 'marketing',
  systems: 'systems',
  store: 'store',
  bookings: 'bookings',
  inventory: 'inventory',
  shipping: 'shipping',
  promotions: 'promotions',
  courses: 'courses',
  affiliate: 'affiliate',
  'digital-portal': 'digitalPortal',
  'physical-portal': 'physicalPortal',
};

export const CONTEXT_SIDEBAR_LAYOUT_TYPES = Object.keys(LAYOUT_CONTEXT_SIDEBAR_MAP) as LayoutType[];

export function getContextSidebarConfigId(layoutType: LayoutType): ContextSidebarConfigId | null {
  return LAYOUT_CONTEXT_SIDEBAR_MAP[layoutType] ?? null;
}
