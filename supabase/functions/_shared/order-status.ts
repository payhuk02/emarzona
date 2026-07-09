/**
 * Aligné sur src/lib/orders/order-status.ts (Edge Functions ne peuvent pas importer src/).
 */

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

export function resolveOrderStatusAfterPayment(
  productTypes: Array<string | null | undefined>
): 'completed' | 'confirmed' {
  const types = productTypes.filter((t): t is string => Boolean(t));
  if (types.some(t => t === 'physical')) {
    return 'confirmed';
  }
  return 'completed';
}

export async function resolvePaidOrderStatusForOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<'completed' | 'confirmed'> {
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_type')
    .eq('order_id', orderId);

  if (error || !items?.length) {
    return 'completed';
  }

  return resolveOrderStatusAfterPayment(items.map(i => i.product_type));
}
