/**
 * Artist Products Hooks
 * Date: 28 Février 2025
 * 
 * React Query hooks for managing artist products (œuvres d'artistes)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ArtistProduct } from '@/types/artist-product';
import { logger } from '@/lib/logger';

export interface ArtistProductWithStats extends ArtistProduct {
  product?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    short_description?: string;
    price: number;
    compare_at_price?: number;
    currency: string;
    image_url?: string;
    images?: string[];
    is_active: boolean;
    is_draft: boolean;
    created_at: string;
    updated_at: string;
  };
  total_quantity_sold?: number;
  total_revenue?: number;
}

/**
 * Get all artist products for a store
 */
export const useArtistProducts = (storeId?: string) => {
  return useQuery({
    queryKey: ['artist-products', storeId],
    queryFn: async () => {
      try {
        let query = supabase
          .from('artist_products')
          .select(`
            *,
            product:products(
              id,
              name,
              slug,
              description,
              short_description,
              price,
              compare_at_price,
              currency,
              image_url,
              images,
              is_active,
              is_draft,
              created_at,
              updated_at
            )
          `)
          .order('created_at', { ascending: false });

        if (storeId) {
          query = query.eq('store_id', storeId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calculate sales stats from orders
        const productIds = (data || [])
          .map(ap => ap.product_id)
          .filter((id): id is string => !!id);

        if (productIds.length > 0) {
          // Get order items for artist products
          // First get the artist product IDs from products table, then fetch order items
          const { data: artistProducts, error: productsError } = await supabase
            .from('products')
            .select('id')
            .in('id', productIds)
            .eq('product_type', 'artist');
          
          if (productsError) throw productsError;
          
          const artistProductIds = (artistProducts || []).map(p => p.id);
          
          if (artistProductIds.length > 0) {
            const { data: orderItems, error: orderItemsError } = await supabase
              .from('order_items')
              .select('product_id, quantity, unit_price, total_price')
              .in('product_id', artistProductIds);

            if (!orderItemsError && orderItems) {
              const salesMap = new Map<string, { quantity: number; revenue: number }>();

              orderItems.forEach(item => {
                const existing = salesMap.get(item.product_id) || { quantity: 0, revenue: 0 };
                existing.quantity += item.quantity || 0;
                existing.revenue += item.total_price || item.unit_price * (item.quantity || 0);
                salesMap.set(item.product_id, existing);
              });

              return (data || []).map((artistProduct) => {
                const sales = salesMap.get(artistProduct.product_id) || { quantity: 0, revenue: 0 };
                return {
                  ...artistProduct,
                  total_quantity_sold: sales.quantity,
                  total_revenue: sales.revenue,
                } as ArtistProductWithStats;
              });
            }
          }
        }

        // Fallback if no orders found
        return (data || []).map((artistProduct) => ({
          ...artistProduct,
          total_quantity_sold: 0,
          total_revenue: 0,
        })) as ArtistProductWithStats[];
      } catch (error) {
        logger.error('Error fetching artist products', { error, storeId });
        throw error;
      }
    },
    enabled: !!storeId,
  });
};

/**
 * Get a single artist product by product_id
 */
export const useArtistProduct = (productId?: string) => {
  return useQuery({
    queryKey: ['artist-product', productId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID is required');

      try {
        const { data, error } = await supabase
          .from('artist_products')
          .select(`
            *,
            product:products(*)
          `)
          .eq('product_id', productId)
          .single();

        if (error) throw error;
        return data as ArtistProductWithStats;
      } catch (error) {
        logger.error('Error fetching artist product', { error, productId });
        throw error;
      }
    },
    enabled: !!productId,
  });
};

/**
 * Get a single artist product by artist_product id
 */
export const useArtistProductById = (artistProductId?: string) => {
  return useQuery({
    queryKey: ['artist-product-by-id', artistProductId],
    queryFn: async () => {
      if (!artistProductId) throw new Error('Artist Product ID is required');

      try {
        const { data, error } = await supabase
          .from('artist_products')
          .select(`
            *,
            product:products(*)
          `)
          .eq('id', artistProductId)
          .single();

        if (error) throw error;
        return data as ArtistProductWithStats;
      } catch (error) {
        logger.error('Error fetching artist product by ID', { error, artistProductId });
        throw error;
      }
    },
    enabled: !!artistProductId,
  });
};

/**
 * Create a new artist product
 */
export const useCreateArtistProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ArtistProduct>) => {
      try {
        const { data: result, error } = await supabase
          .from('artist_products')
          .insert(data)
          .select(`
            *,
            product:products(*)
          `)
          .single();

        if (error) throw error;
        return result as ArtistProductWithStats;
      } catch (error) {
        logger.error('Error creating artist product', { error, data });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-products'] });
    },
  });
};

/**
 * Update an artist product
 */
export const useUpdateArtistProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: Partial<ArtistProduct> 
    }) => {
      try {
        const { data: result, error } = await supabase
          .from('artist_products')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            product:products(*)
          `)
          .single();

        if (error) throw error;
        return result as ArtistProductWithStats;
      } catch (error) {
        logger.error('Error updating artist product', { error, id, data });
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['artist-products'] });
      queryClient.invalidateQueries({ queryKey: ['artist-product'] });
      queryClient.invalidateQueries({ queryKey: ['artist-product-by-id', variables.id] });
    },
  });
};

/**
 * Delete an artist product
 */
export const useDeleteArtistProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase
          .from('artist_products')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        logger.error('Error deleting artist product', { error, id });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artist-products'] });
    },
  });
};

/**
 * Get artist products by artist type
 */
export const useArtistProductsByType = (
  storeId: string, 
  artistType: string
) => {
  return useQuery({
    queryKey: ['artist-products', storeId, 'type', artistType],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('artist_products')
          .select(`
            *,
            product:products(*)
          `)
          .eq('store_id', storeId)
          .eq('artist_type', artistType)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ArtistProductWithStats[];
      } catch (error) {
        logger.error('Error fetching artist products by type', { error, storeId, artistType });
        throw error;
      }
    },
    enabled: !!storeId && !!artistType,
  });
};

/**
 * Get popular artist products
 */
export const usePopularArtistProducts = (storeId: string, limit = 5) => {
  return useQuery({
    queryKey: ['popular-artist-products', storeId, limit],
    queryFn: async () => {
      try {
        // First get all artist product IDs from the store
        const { data: artistProducts, error: artistError } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', storeId)
          .eq('product_type', 'artist')
          .eq('is_active', true);
        
        if (artistError) throw artistError;
        
        const artistProductIds = (artistProducts || []).map(p => p.id);
        
        if (artistProductIds.length === 0) {
          return [];
        }
        
        // Get order items for these artist products
        const { data: orderItems, error: orderError } = await supabase
          .from('order_items')
          .select('product_id')
          .in('product_id', artistProductIds);

        if (orderError) throw orderError;

        // Count orders per product
        const productOrderCounts = new Map<string, number>();
        orderItems?.forEach(item => {
          productOrderCounts.set(
            item.product_id,
            (productOrderCounts.get(item.product_id) || 0) + 1
          );
        });

        // Get all artist products for the store
        const { data: artistProductsData, error: artistProductsError } = await supabase
          .from('artist_products')
          .select(`
            *,
            product:products(*)
          `)
          .eq('store_id', storeId)
          .in('product_id', artistProductIds);

        if (artistProductsError) throw artistProductsError;

        // Sort by order count and limit
        const sorted = (artistProductsData || [])
          .map(ap => ({
            ...ap,
            orderCount: productOrderCounts.get(ap.product_id) || 0,
          }))
          .sort((a, b) => b.orderCount - a.orderCount)
          .slice(0, limit) as ArtistProductWithStats[];

        return sorted;
      } catch (error) {
        logger.error('Error fetching popular artist products', { error, storeId, limit });
        throw error;
      }
    },
    enabled: !!storeId,
  });
};

