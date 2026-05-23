/**
 * Résout store_id pour l'autorisation d'envoi email (vendeur → client)
 */
import { supabase } from '@/integrations/supabase/client';

export async function resolveStoreId(options: {
  storeId?: string;
  productId?: string;
  orderId?: string;
}): Promise<string | undefined> {
  if (options.storeId) return options.storeId;

  if (options.productId) {
    const { data } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', options.productId)
      .maybeSingle();
    if (data?.store_id) return data.store_id;
  }

  if (options.orderId) {
    const { data } = await supabase
      .from('orders')
      .select('store_id')
      .eq('id', options.orderId)
      .maybeSingle();
    if (data?.store_id) return data.store_id;
  }

  return undefined;
}
