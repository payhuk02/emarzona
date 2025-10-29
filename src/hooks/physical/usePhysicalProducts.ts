import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PhysicalProduct } from '@/components/physical/PhysicalProductsList';

// ============================================================================
// FETCH PHYSICAL PRODUCTS
// ============================================================================

export function usePhysicalProducts(storeId: string) {
  return useQuery({
    queryKey: ['physical-products', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_products')
        .select(`
          id,
          name,
          sku,
          barcode,
          image_url,
          price,
          currency,
          has_variants,
          track_inventory,
          total_quantity,
          low_stock_threshold,
          is_active,
          created_at
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate sales stats (this would come from orders table in production)
      const productsWithStats: PhysicalProduct[] = (data || []).map((product) => ({
        ...product,
        total_quantity_sold: 0, // TODO: Calculate from orders
        total_revenue: 0, // TODO: Calculate from orders
      }));

      return productsWithStats;
    },
    enabled: !!storeId,
  });
}

// ============================================================================
// FETCH SINGLE PRODUCT
// ============================================================================

export function usePhysicalProduct(productId: string) {
  return useQuery({
    queryKey: ['physical-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

// ============================================================================
// CREATE PRODUCT
// ============================================================================

export function useCreatePhysicalProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Partial<PhysicalProduct>) => {
      const { data, error } = await supabase
        .from('physical_products')
        .insert([product])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
}

// ============================================================================
// UPDATE PRODUCT
// ============================================================================

export function useUpdatePhysicalProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      updates,
    }: {
      productId: string;
      updates: Partial<PhysicalProduct>;
    }) => {
      const { data, error } = await supabase
        .from('physical_products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
      queryClient.invalidateQueries({ queryKey: ['physical-product', variables.productId] });
    },
  });
}

// ============================================================================
// DELETE PRODUCT
// ============================================================================

export function useDeletePhysicalProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('physical_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
}
