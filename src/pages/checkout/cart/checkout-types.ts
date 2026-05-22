import type { CartItem } from '@/types/cart';

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
  state?: string;
}

export type TaxBreakdownItem = {
  type: string;
  name: string;
  rate: number;
  amount: number;
  applies_to_shipping: boolean;
  tax_inclusive: boolean;
  is_default?: boolean;
};

export type TaxCalculationResult = {
  tax_amount: number;
  tax_breakdown: TaxBreakdownItem[];
  subtotal: number;
  shipping_amount: number;
  total_with_tax: number;
};

export function isTaxCalculationResult(value: unknown): value is TaxCalculationResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.tax_amount === 'number' && Array.isArray(v.tax_breakdown);
}

export interface CheckoutStoreGroup {
  items: CartItem[];
  store_name?: string;
  subtotal?: number;
  tax_amount?: number;
  shipping_amount?: number;
  discount_amount?: number;
  total?: number;
}

export type AppliedCoupon = {
  id: string;
  discountAmount: number;
  code: string;
};

export type AppliedGiftCard = {
  id: string;
  balance: number;
  code: string;
};
