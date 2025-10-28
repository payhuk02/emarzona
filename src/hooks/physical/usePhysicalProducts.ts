/**
 * Physical Products Hooks
 * Date: 28 octobre 2025
 * 
 * React Query hooks pour produits physiques
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PhysicalProductFormData } from '@/types/physical-product';

// =====================================================
// TYPES
// =====================================================

export interface PhysicalProduct {
  id: string;
  product_id: string;
  track_inventory: boolean;
  inventory_policy: 'deny' | 'continue';
  sku?: string;
  barcode?: string;
  requires_shipping: boolean;
  weight?: number;
  weight_unit?: string;
  has_variants: boolean;
  option1_name?: string;
  option2_name?: string;
  option3_name?: string;
  created_at: string;
  updated_at: string;
  product?: any; // Reference to products table
}

export interface ProductVariant {
  id: string;
  physical_product_id: string;
  option1_value: string;
  option2_value?: string;
  option3_value?: string;
  price: number;
  compare_at_price?: number;
  sku: string;
  quantity: number;
  is_available: boolean;
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Get all physical products for a store
 */
export const usePhysicalProducts = (storeId?: string) => {
  return useQuery({
    queryKey: ['physical-products', storeId],
    queryFn: async () => {
      let query = supabase
        .from('physical_products')
        .select(`
          *,
          product:products (
            id,
            name,
            description,
            price,
            image_url,
            store_id,
            is_active
          )
        `);

      if (storeId) {
        query = query.eq('product.store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PhysicalProduct[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get a single physical product
 */
export const usePhysicalProduct = (productId: string) => {
  return useQuery({
    queryKey: ['physical-product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_products')
        .select(`
          *,
          product:products (*),
          variants:product_variants (*)
        `)
        .eq('product_id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
};

/**
 * Get variants for a physical product
 */
export const useProductVariants = (physicalProductId: string) => {
  return useQuery({
    queryKey: ['product-variants', physicalProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('physical_product_id', physicalProductId)
        .order('position');

      if (error) throw error;
      return data as ProductVariant[];
    },
    enabled: !!physicalProductId,
  });
};

/**
 * Get single variant
 */
export const useProductVariant = (variantId: string) => {
  return useQuery({
    queryKey: ['product-variant', variantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', variantId)
        .single();

      if (error) throw error;
      return data as ProductVariant;
    },
    enabled: !!variantId,
  });
};

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Create physical product
 */
export const useCreatePhysicalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PhysicalProductFormData> & { product_id: string }) => {
      // 1. Create physical product
      const { data: physicalProduct, error: productError } = await supabase
        .from('physical_products')
        .insert({
          product_id: data.product_id,
          track_inventory: data.track_inventory,
          inventory_policy: data.inventory_policy,
          sku: data.sku,
          barcode: data.barcode,
          requires_shipping: data.requires_shipping,
          weight: data.weight,
          weight_unit: data.weight_unit,
          length: data.dimensions?.length,
          width: data.dimensions?.width,
          height: data.dimensions?.height,
          dimensions_unit: data.dimensions?.unit,
          free_shipping: data.free_shipping,
          has_variants: data.has_variants,
          option1_name: data.options?.[0]?.name,
          option2_name: data.options?.[1]?.name,
          option3_name: data.options?.[2]?.name,
        })
        .select()
        .single();

      if (productError) throw productError;

      // 2. Create variants if needed
      if (data.has_variants && data.variants && data.variants.length > 0) {
        const variantsData = data.variants.map((variant, index) => ({
          physical_product_id: physicalProduct.id,
          option1_value: variant.option1_value,
          option2_value: variant.option2_value,
          option3_value: variant.option3_value,
          price: variant.price,
          compare_at_price: variant.compare_at_price,
          cost_per_item: variant.cost_per_item,
          sku: variant.sku,
          barcode: variant.barcode,
          quantity: variant.quantity,
          weight: variant.weight,
          image_url: variant.image_url,
          position: index,
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsData);

        if (variantsError) throw variantsError;
      }

      return physicalProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
};

/**
 * Update physical product
 */
export const useUpdatePhysicalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PhysicalProduct>;
    }) => {
      const { data: updated, error } = await supabase
        .from('physical_products')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['physical-product', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
};

/**
 * Delete physical product
 */
export const useDeletePhysicalProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('physical_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
};

/**
 * Create/Update variant
 */
export const useUpsertVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variant: Partial<ProductVariant>) => {
      const { data, error } = await supabase
        .from('product_variants')
        .upsert(variant)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['product-variants', variables.physical_product_id],
      });
    },
  });
};

/**
 * Delete variant
 */
export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: string) => {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
    },
  });
};

/**
 * Update variant quantity
 */
export const useUpdateVariantQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      const { data, error } = await supabase
        .from('product_variants')
        .update({ quantity })
        .eq('id', variantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
    },
  });
};

/**
 * Bulk update variant availability
 */
export const useBulkUpdateVariantAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantIds,
      is_available,
    }: {
      variantIds: string[];
      is_available: boolean;
    }) => {
      const { error } = await supabase
        .from('product_variants')
        .update({ is_available })
        .in('id', variantIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants'] });
    },
  });
};

