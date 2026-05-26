/**
 * Hook pour le tracking des éditions limitées
 * Date: 3 Février 2025
 *
 * Calcule et affiche le nombre d'éditions vendues pour les œuvres d'artiste
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface EditionTracking {
  product_id: string;
  total_editions: number;
  sold_count: number;
  available_count: number;
  sold_percentage: number;
  sold_edition_numbers: number[];
  reserved_count?: number;
}

type EditionTrackingRpcRow = {
  product_id: string;
  total_editions: number;
  sold_count: number;
  available_count: number;
  sold_percentage: number;
  sold_edition_numbers: number[];
  reserved_count?: number;
};

const mapRpcToEditionTracking = (row: EditionTrackingRpcRow): EditionTracking => ({
  product_id: row.product_id,
  total_editions: row.total_editions,
  sold_count: row.sold_count,
  available_count: row.available_count,
  sold_percentage: Number(row.sold_percentage) || 0,
  sold_edition_numbers: Array.isArray(row.sold_edition_numbers) ? row.sold_edition_numbers : [],
  reserved_count: row.reserved_count,
});

/**
 * Hook pour obtenir le tracking des éditions vendues pour un produit artiste
 */
export const useEditionTracking = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['edition-tracking', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID manquant');

      const { data, error } = await supabase.rpc('get_edition_tracking', {
        p_product_id: productId,
      });

      if (error) {
        logger.warn('get_edition_tracking RPC failed', { error, productId });
        throw error;
      }

      if (data == null) {
        return null;
      }

      return mapRpcToEditionTracking(data as EditionTrackingRpcRow);
    },
    enabled: !!productId,
    staleTime: 30000,
  });
};

/**
 * Hook pour obtenir le tracking des éditions pour plusieurs produits
 */
export const useMultipleEditionTracking = (productIds: string[]) => {
  return useQuery({
    queryKey: ['edition-tracking-multiple', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const results = await Promise.all(
        productIds.map(async productId => {
          const { data, error } = await supabase.rpc('get_edition_tracking', {
            p_product_id: productId,
          });
          if (error || data == null) return null;
          return mapRpcToEditionTracking(data as EditionTrackingRpcRow);
        })
      );

      return results.filter((r): r is EditionTracking => r !== null);
    },
    enabled: productIds.length > 0,
    staleTime: 30000,
  });
};
