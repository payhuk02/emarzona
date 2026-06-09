import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import {
  computeOrderPlatformFeeAmount,
  type OrderItemForFee,
  type OrderPlatformFeeResult,
} from './platform-pricing.ts';

export async function resolveStoreDefaultFeePercent(
  supabase: SupabaseClient,
  storeId: string
): Promise<number> {
  const { data: store } = await supabase
    .from('stores')
    .select('platform_fee_percent')
    .eq('id', storeId)
    .maybeSingle();

  if (store?.platform_fee_percent != null) {
    return Number(store.platform_fee_percent);
  }

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('platform_commission_rate')
    .not('platform_commission_rate', 'is', null)
    .limit(1)
    .maybeSingle();

  if (settings?.platform_commission_rate != null) {
    return Number(settings.platform_commission_rate);
  }

  return 10;
}

export async function loadOrderItemsForPlatformFee(
  supabase: SupabaseClient,
  orderId: string
): Promise<OrderItemForFee[]> {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_type, total_price, quantity, unit_price, product_id')
    .eq('order_id', orderId);

  if (error) {
    throw error;
  }

  const rows = items ?? [];
  const missingTypeProductIds = [
    ...new Set(
      rows
        .filter(row => !row.product_type && row.product_id)
        .map(row => row.product_id as string)
    ),
  ];

  const productTypeById = new Map<string, string>();

  if (missingTypeProductIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, product_type')
      .in('id', missingTypeProductIds);

    for (const product of products ?? []) {
      if (product.product_type) {
        productTypeById.set(product.id, product.product_type);
      }
    }
  }

  return rows.map(row => ({
    product_type: row.product_type ?? productTypeById.get(row.product_id as string) ?? null,
    total_price: row.total_price,
    quantity: row.quantity,
    unit_price: row.unit_price,
  }));
}

export async function resolveOrderPlatformFee(
  supabase: SupabaseClient,
  storeId: string,
  orderId: string
): Promise<OrderPlatformFeeResult> {
  const feePercent = await resolveStoreDefaultFeePercent(supabase, storeId);
  const items = await loadOrderItemsForPlatformFee(supabase, orderId);
  return computeOrderPlatformFeeAmount(items, feePercent);
}
