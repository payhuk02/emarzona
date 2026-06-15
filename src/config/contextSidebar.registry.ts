import type { LayoutType } from '@/components/layout/layout.types';
import type { ContextSidebarConfigId } from '@/config/navigation.context';
import { detectLayoutType } from '@/config/layoutTypeDetection';

/**
 * Maps dashboard layout types to navigation context config ids.
 * Used by mega-menu grouping (`navigation.horizontal`) and layout detection — not a mounted sidebar UI.
 */
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

/**
 * True when the route belongs to a seller domain with dedicated horizontal context nav config.
 * @deprecated Prefer `shouldShowSellerHorizontalNav` from `@/config/navigation.horizontal` for shell chrome.
 */
export function hasContextSidebarForPath(pathname: string): boolean {
  return getContextSidebarConfigId(detectLayoutType(pathname)) !== null;
}
