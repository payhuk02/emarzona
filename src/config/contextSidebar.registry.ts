import type { LayoutType } from '@/components/layout/layout.types';
import type { ContextSidebarConfigId } from '@/config/navigation.context';
import { detectLayoutType } from '@/config/layoutTypeDetection';

/** Maps layout types to context sidebar configs */
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

/** True when the route uses a context sidebar (mobile bottom nav). */
export function hasContextSidebarForPath(pathname: string): boolean {
  return getContextSidebarConfigId(detectLayoutType(pathname)) !== null;
}
