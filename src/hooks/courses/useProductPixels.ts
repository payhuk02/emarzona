/**
 * Hook pour récupérer la configuration des pixels d'un produit
 * Utilisé pour initialiser les trackers externes
 * Date : 27 octobre 2025
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface ProductPixels {
  tracking_enabled: boolean;
  google_analytics_id: string | null;
  facebook_pixel_id: string | null;
  google_tag_manager_id: string | null;
  tiktok_pixel_id: string | null;
}

/**
 * Récupérer la configuration des pixels pour un produit
 */
export const useProductPixels = (productId: string) => {
  return useQuery({
    queryKey: ['product-pixels', productId],
    queryFn: async (): Promise<ProductPixels | null> => {
      const { data, error } = await supabase
        .from('product_analytics')
        .select('tracking_enabled, google_analytics_id, facebook_pixel_id, google_tag_manager_id, tiktok_pixel_id')
        .eq('product_id', productId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error fetching product pixels', { error, productId });
        return null;
      }

      return data;
    },
    enabled: !!productId,
  });
};

