import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category: string | null;
  product_type: string | null;
  rating: number;
  reviews_count: number;
  is_active: boolean;
  digital_file_url: string | null;
  stock_quantity?: number | null;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | null;
  sku?: string | null;
  track_inventory?: boolean;
  low_stock_threshold?: number | null;
  created_at: string;
  updated_at: string;
  product_affiliate_settings?: Array<{
    commission_rate: number;
    affiliate_enabled: boolean;
  }> | null;
}

/**
 * @deprecated Ce hook charge TOUS les produits sans pagination.
 * Utilisez useProductsOptimized à la place pour de meilleures performances.
 *
 * Ce hook sera supprimé dans une future version.
 */
export const useProducts = (storeId?: string | null) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Avertissement en développement
  if (import.meta.env.DEV) {
    console.warn(
      '[useProducts] ⚠️ Hook déprécié détecté. Ce hook charge TOUS les produits sans pagination.\n' +
        'Migrez vers useProductsOptimized pour de meilleures performances:\n' +
        "import { useProductsOptimized } from '@/hooks/useProductsOptimized';\n" +
        'const { products } = useProductsOptimized(storeId, { page: 1, itemsPerPage: 20 });'
    );
  }

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('products')
          .select(
            `
            *,
            product_affiliate_settings!left (
              commission_rate,
              affiliate_enabled
            )
          `
          )
          .order('created_at', { ascending: false });

        if (storeId) {
          query = query.eq('store_id', storeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        setProducts(data || []);
      } catch (_error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erreur lors de la récupération des produits';
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeId]); // toast intentionnellement omis pour éviter re-renders

  const refetch = useCallback(async () => {
    if (!storeId) return;

    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(
          `
          *,
          product_affiliate_settings!left (
            commission_rate,
            affiliate_enabled
          )
        `
        )
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setProducts(data || []);
    } catch (_error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erreur lors de la récupération des produits';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  return { products, loading, refetch };
};
