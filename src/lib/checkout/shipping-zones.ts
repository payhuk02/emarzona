/**
 * Frais de port depuis shipping_zones / shipping_rates (vendeur).
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { CartItem } from '@/types/cart';
import type { CheckoutShippingInput } from '@/lib/checkout-shipping';

export async function resolveStoreZoneShippingAmount(
  storeId: string,
  items: CartItem[],
  address: CheckoutShippingInput,
  orderSubtotal: number
): Promise<number | null> {
  const country = address.country?.trim().toUpperCase();
  if (!country) return null;

  const productIds = items.map(i => i.product_id);
  const { data: physicalRows } = await supabase
    .from('physical_products')
    .select('product_id, free_shipping')
    .in('product_id', productIds);

  if (physicalRows?.length && physicalRows.every(p => p.free_shipping)) {
    return 0;
  }

  const { data: store } = await supabase
    .from('stores')
    .select('free_shipping_threshold')
    .eq('id', storeId)
    .maybeSingle();

  const threshold = Number(store?.free_shipping_threshold ?? 0);
  if (threshold > 0 && orderSubtotal >= threshold) {
    return 0;
  }

  const { data: zones } = await supabase
    .from('shipping_zones')
    .select('id, countries')
    .eq('store_id', storeId)
    .eq('is_active', true);

  if (!zones?.length) return null;

  const matchingZoneIds = zones
    .filter(z => {
      const countries = (z.countries ?? []).map((c: string) => c.toUpperCase());
      return countries.length === 0 || countries.includes(country);
    })
    .map(z => z.id);

  if (matchingZoneIds.length === 0) return null;

  const { data: rates } = await supabase
    .from('shipping_rates')
    .select('base_price, min_order_amount, max_order_amount, is_active')
    .eq('is_active', true)
    .in('shipping_zone_id', matchingZoneIds);

  if (!rates?.length) return null;

  const eligible = rates.filter(r => {
    const min = r.min_order_amount != null ? Number(r.min_order_amount) : null;
    const max = r.max_order_amount != null ? Number(r.max_order_amount) : null;
    if (min != null && orderSubtotal < min) return false;
    if (max != null && orderSubtotal > max) return false;
    return true;
  });

  if (!eligible.length) return null;

  const cheapest = Math.min(...eligible.map(r => Number(r.base_price ?? 0)));
  logger.debug('Store zone shipping applied', { storeId, country, amount: cheapest });
  return Math.max(0, Math.round(cheapest));
}
