/**
 * Calcul taxes checkout — Stripe Tax (UE/US) + RPC UEMOA, sans fallback 18 % global.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { calculateStripeTaxViaEdge } from '@/lib/checkout/stripe-tax-client';
import { shouldUseStripeTax } from '@/lib/checkout/tax-zones';
import type { CartItem } from '@/types/cart';

export interface TaxBreakdownLine {
  type: string;
  name: string;
  rate: number;
  amount: number;
  applies_to_shipping?: boolean;
  tax_inclusive?: boolean;
  is_default?: boolean;
  source?: string;
}

export interface CheckoutTaxResult {
  tax_amount: number;
  tax_breakdown: TaxBreakdownLine[];
  subtotal: number;
  shipping_amount: number;
  total_with_tax: number;
  source?: 'stripe_tax' | 'local_rpc' | 'none';
}

const ZERO_TAX: CheckoutTaxResult = {
  tax_amount: 0,
  tax_breakdown: [],
  subtotal: 0,
  shipping_amount: 0,
  total_with_tax: 0,
  source: 'none',
};

async function calculateLocalTaxesRpc(params: {
  subtotal: number;
  shippingAmount: number;
  countryCode: string;
  stateProvince?: string | null;
  storeId?: string | null;
  items: CartItem[];
}): Promise<CheckoutTaxResult> {
  const { subtotal, shippingAmount, countryCode, stateProvince, storeId, items } = params;
  const productTypes = Array.from(new Set(items.map(i => i.product_type)));

  const { data, error } = await supabase.rpc('calculate_taxes_pre_order', {
    p_subtotal: subtotal,
    p_shipping_amount: shippingAmount,
    p_country_code: countryCode,
    p_state_province: stateProvince ?? null,
    p_store_id: storeId ?? null,
    p_product_types: productTypes.length > 0 ? productTypes : null,
  });

  if (error || data == null) {
    logger.warn('calculate_taxes_pre_order unavailable', {
      error: error?.message,
      countryCode,
      storeId,
    });
    return {
      tax_amount: 0,
      tax_breakdown: [],
      subtotal,
      shipping_amount: shippingAmount,
      total_with_tax: subtotal + shippingAmount,
      source: 'none',
    };
  }

  const row = data as CheckoutTaxResult;
  return {
    tax_amount: Number(row.tax_amount ?? 0),
    tax_breakdown: Array.isArray(row.tax_breakdown) ? row.tax_breakdown : [],
    subtotal: Number(row.subtotal ?? subtotal),
    shipping_amount: Number(row.shipping_amount ?? shippingAmount),
    total_with_tax: Number(
      row.total_with_tax ?? subtotal + shippingAmount + Number(row.tax_amount ?? 0)
    ),
    source: 'local_rpc',
  };
}

export async function calculateCheckoutTaxes(params: {
  subtotal: number;
  shippingAmount: number;
  countryCode: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  city?: string | null;
  currency?: string;
  storeId?: string | null;
  items: CartItem[];
}): Promise<CheckoutTaxResult> {
  const { subtotal, shippingAmount, countryCode, stateProvince, postalCode, city, storeId, items } =
    params;
  const currency = (params.currency ?? items[0]?.currency ?? 'XOF').toUpperCase();

  if (!countryCode || subtotal <= 0) {
    return {
      ...ZERO_TAX,
      subtotal,
      shipping_amount: shippingAmount,
      total_with_tax: subtotal + shippingAmount,
    };
  }

  if (shouldUseStripeTax(countryCode)) {
    const stripeResult = await calculateStripeTaxViaEdge({
      subtotal,
      shippingAmount,
      currency,
      countryCode,
      stateProvince,
      postalCode,
      city,
      items,
    });
    if (stripeResult && stripeResult.tax_amount >= 0) {
      return { ...stripeResult, source: 'stripe_tax' };
    }
    logger.warn('Stripe Tax fallback to local RPC', { countryCode });
  }

  return calculateLocalTaxesRpc({
    subtotal,
    shippingAmount,
    countryCode,
    stateProvince,
    storeId,
    items,
  });
}
