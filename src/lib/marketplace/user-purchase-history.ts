import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * IDs produits achetés par un utilisateur (auth uid).
 * Utilise la RPC SECURITY DEFINER — évite GET /orders?customer_id=eq.<uid> (403 RLS).
 */
export async function fetchUserPurchasedProductIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase.rpc('get_user_purchased_product_ids', {
      p_user_id: userId,
    });

    if (error) {
      if (error.code !== 'PGRST202') {
        logger.debug('[fetchUserPurchasedProductIds] unavailable', {
          code: error.code,
          userId,
        });
      }
      return [];
    }

    return (data ?? [])
      .map((row: { product_id?: string }) => row.product_id)
      .filter((id): id is string => Boolean(id));
  } catch (error) {
    logger.debug('[fetchUserPurchasedProductIds] error', { error, userId });
    return [];
  }
}
