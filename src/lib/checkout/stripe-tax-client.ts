/**
 * Client Stripe Tax — Edge Function stripe-tax-calculate (Phase 2.6).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/types/cart';
import type { CheckoutTaxResult } from '@/lib/checkout/taxes';

export interface StripeTaxLineItem {
  product_id: string;
  product_type: string;
  amount: number;
  quantity: number;
}

interface StripeTaxEdgeResponse {
  tax_amount: number;
  tax_breakdown: CheckoutTaxResult['tax_breakdown'];
  subtotal: number;
  shipping_amount: number;
  total_with_tax: number;
  source: 'stripe_tax';
  calculation_id?: string;
}

const PRODUCT_TAX_CODES: Record<string, string> = {
  digital: 'txcd_10000000',
  physical: 'txcd_99999999',
  service: 'txcd_20030000',
  course: 'txcd_10000000',
  artist: 'txcd_99999999',
};

export function mapCartItemsToStripeTaxLines(
  items: CartItem[],
  subtotal: number
): StripeTaxLineItem[] {
  if (items.length === 0) {
    return [{ product_id: 'subtotal', product_type: 'physical', amount: subtotal, quantity: 1 }];
  }

  return items.map(item => ({
    product_id: item.product_id,
    product_type: item.product_type,
    amount: Math.max(0, item.unit_price * item.quantity),
    quantity: item.quantity,
  }));
}

export function stripeTaxCodeForProductType(productType: string): string {
  return PRODUCT_TAX_CODES[productType] ?? 'txcd_99999999';
}

export async function calculateStripeTaxViaEdge(params: {
  subtotal: number;
  shippingAmount: number;
  currency: string;
  countryCode: string;
  stateProvince?: string | null;
  postalCode?: string | null;
  city?: string | null;
  items: CartItem[];
}): Promise<CheckoutTaxResult | null> {
  const lineItems = mapCartItemsToStripeTaxLines(params.items, params.subtotal);

  const { data, error } = await supabase.functions.invoke<StripeTaxEdgeResponse>(
    'stripe-tax-calculate',
    {
      body: {
        currency: params.currency.toLowerCase(),
        country_code: params.countryCode.toUpperCase(),
        state_province: params.stateProvince ?? undefined,
        postal_code: params.postalCode ?? undefined,
        city: params.city ?? undefined,
        shipping_amount: params.shippingAmount,
        line_items: lineItems.map(li => ({
          reference: li.product_id,
          amount: li.amount,
          quantity: li.quantity,
          tax_code: stripeTaxCodeForProductType(li.product_type),
        })),
      },
    }
  );

  if (error) {
    logger.warn('stripe-tax-calculate edge error', {
      error: error.message,
      country: params.countryCode,
    });
    return null;
  }

  if (!data || typeof data.tax_amount !== 'number') {
    return null;
  }

  return {
    tax_amount: data.tax_amount,
    tax_breakdown: data.tax_breakdown ?? [],
    subtotal: data.subtotal ?? params.subtotal,
    shipping_amount: data.shipping_amount ?? params.shippingAmount,
    total_with_tax:
      data.total_with_tax ?? params.subtotal + params.shippingAmount + data.tax_amount,
  };
}
