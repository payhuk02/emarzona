import type { ComponentType } from 'react';
import { Circle } from 'lucide-react';
import {
  CreditCard,
  DollarSign,
  FileText,
  Link2,
  Percent,
  Users,
  Wallet,
} from '@/components/icons';
import { getNavItemPath } from '@/config/navigation.helpers';

type NavIcon = ComponentType<{ className?: string }>;

/** Fallback icons when a menu entry is missing `icon` (defensive). */
const NAV_ICONS_BY_PATH: Record<string, NavIcon> = {
  '/dashboard/payments': CreditCard,
  '/dashboard/taxes': Percent,
  '/dashboard/payments-customers': Users,
  '/dashboard/pay-balance': DollarSign,
  '/dashboard/payment-management': FileText,
  '/dashboard/payment-methods': Wallet,
  '/dashboard/payment-connections': Link2,
  '/admin/payments': CreditCard,
};

export function resolveNavItemIcon(url: string, icon?: NavIcon | null): NavIcon {
  if (icon) return icon;
  return NAV_ICONS_BY_PATH[getNavItemPath(url)] ?? Circle;
}
