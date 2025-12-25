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
  sold_edition_numbers: number[]; // Numéros d'éditions déjà vendus
}

/**
 * Hook pour obtenir le tracking des éditions vendues pour un produit artiste
 */
export const useEditionTracking = (productId: string | undefined) => {
  return useQuery({
    queryKey: ['edition-tracking', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID manquant');

      // 1. Récupérer les informations du produit artiste
      const { data: artistProduct, error: productError } = await supabase
        .from('artist_products')
        .select('total_editions, artwork_edition_type')
        .eq('product_id', productId)
        .single();

      if (productError) throw productError;

      // Si ce n'est pas une édition limitée, retourner null
      if (
        artistProduct.artwork_edition_type !== 'limited_edition' ||
        !artistProduct.total_editions
      ) {
        return null;
      }

      // 2. Récupérer toutes les commandes payées contenant ce produit
      const { data: paidOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_status', 'completed')
        .or('payment_status.eq.paid');

      if (ordersError) {
        logger.warn('Erreur lors de la récupération des commandes payées', { error: ordersError });
      }

      const paidOrderIds = paidOrders?.map(o => o.id) || [];

      if (paidOrderIds.length === 0) {
        return {
          product_id: productId,
          total_editions: artistProduct.total_editions,
          sold_count: 0,
          available_count: artistProduct.total_editions,
          sold_percentage: 0,
          sold_edition_numbers: [],
        } as EditionTracking;
      }

      // 3. Récupérer les order_items vendus pour ce produit
      const { data: soldItems, error: soldError } = await supabase
        .from('order_items')
        .select('quantity, metadata')
        .eq('product_id', productId)
        .eq('product_type', 'artist')
        .in('order_id', paidOrderIds);

      if (soldError) {
        logger.warn('Erreur lors de la vérification des éditions vendues', { error: soldError });
      }

      // Calculer le nombre total vendu
      const totalSold = soldItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

      // Récupérer les numéros d'éditions vendus depuis les métadonnées
      const soldEditionNumbers: number[] = [];
      soldItems?.forEach(item => {
        if (item.metadata?.edition_number) {
          const editionNum =
            typeof item.metadata.edition_number === 'number'
              ? item.metadata.edition_number
              : parseInt(item.metadata.edition_number);
          if (!isNaN(editionNum) && !soldEditionNumbers.includes(editionNum)) {
            soldEditionNumbers.push(editionNum);
          }
        }
      });

      const available = artistProduct.total_editions - totalSold;
      const soldPercentage =
        artistProduct.total_editions > 0
          ? Math.round((totalSold / artistProduct.total_editions) * 100)
          : 0;

      return {
        product_id: productId,
        total_editions: artistProduct.total_editions,
        sold_count: totalSold,
        available_count: available,
        sold_percentage: soldPercentage,
        sold_edition_numbers: soldEditionNumbers.sort((a, b) => a - b),
      } as EditionTracking;
    },
    enabled: !!productId,
    staleTime: 30000, // Cache pendant 30 secondes
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

      const trackingPromises = productIds.map(async productId => {
        const { data: artistProduct } = await supabase
          .from('artist_products')
          .select('total_editions, artwork_edition_type')
          .eq('product_id', productId)
          .single();

        if (
          !artistProduct ||
          artistProduct.artwork_edition_type !== 'limited_edition' ||
          !artistProduct.total_editions
        ) {
          return null;
        }

        const { data: paidOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_status', 'completed')
          .or('payment_status.eq.paid');

        const paidOrderIds = paidOrders?.map(o => o.id) || [];

        if (paidOrderIds.length === 0) {
          return {
            product_id: productId,
            total_editions: artistProduct.total_editions,
            sold_count: 0,
            available_count: artistProduct.total_editions,
            sold_percentage: 0,
          } as EditionTracking;
        }

        const { data: soldItems } = await supabase
          .from('order_items')
          .select('quantity')
          .eq('product_id', productId)
          .eq('product_type', 'artist')
          .in('order_id', paidOrderIds);

        const totalSold = soldItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        const available = artistProduct.total_editions - totalSold;
        const soldPercentage =
          artistProduct.total_editions > 0
            ? Math.round((totalSold / artistProduct.total_editions) * 100)
            : 0;

        return {
          product_id: productId,
          total_editions: artistProduct.total_editions,
          sold_count: totalSold,
          available_count: available,
          sold_percentage: soldPercentage,
          sold_edition_numbers: [],
        } as EditionTracking;
      });

      const results = await Promise.all(trackingPromises);
      return results.filter((r): r is EditionTracking => r !== null);
    },
    enabled: productIds.length > 0,
    staleTime: 30000,
  });
};

