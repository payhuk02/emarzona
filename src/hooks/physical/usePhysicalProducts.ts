import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const PHYSICAL_PRODUCT_FIELDS =
  'id, product_id, sku, barcode, has_variants, track_inventory, total_quantity, low_stock_threshold, total_quantity_sold, total_revenue, created_at, updated_at';
const PRODUCT_ITEM_FIELDS =
  'id, store_id, name, description, price, currency, image_url, is_active, status, product_type, slug, created_at, updated_at';

export interface PhysicalProduct {
  id: string;
  product_id: string;
  sku?: string | null;
  barcode?: string | null;
  has_variants: boolean;
  track_inventory: boolean;
  total_quantity?: number | null;
  low_stock_threshold?: number | null;
  total_quantity_sold?: number;
  total_revenue?: number;
  created_at: string;
  updated_at?: string | null;
  /** @deprecated Prefer product.name — kept for legacy table components */
  name?: string;
  price?: number;
  currency?: string;
  image_url?: string | null;
  is_active?: boolean;
  product?: {
    id: string;
    store_id: string;
    name: string;
    description?: string | null;
    price: number;
    currency?: string | null;
    image_url?: string | null;
    is_active?: boolean | null;
    status?: string | null;
    product_type?: string | null;
    slug?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
}

// ============================================================================
// FETCH PHYSICAL PRODUCTS
// ============================================================================

export function usePhysicalProducts(storeId: string) {
  return useQuery({
    queryKey: ['physical-products', storeId],
    queryFn: async () => {
      let query = supabase
        .from('physical_products')
        .select(
          `
          ${PHYSICAL_PRODUCT_FIELDS},
          product:products!inner(${PRODUCT_ITEM_FIELDS})
        `
        )
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('product.store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows = (data ?? []) as PhysicalProduct[];
      const productIds = rows.map(p => p.product_id).filter(Boolean);

      if (productIds.length === 0) {
        return rows.map(p => ({ ...p, total_quantity_sold: 0, total_revenue: 0 }));
      }

      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity, unit_price, total_price, orders!inner(payment_status)')
        .in('product_id', productIds)
        .eq('orders.payment_status', 'paid');

      const salesMap = new Map<string, { quantity: number; revenue: number }>();

      if (!orderItemsError && orderItems) {
        for (const item of orderItems) {
          const existing = salesMap.get(item.product_id) || { quantity: 0, revenue: 0 };
          existing.quantity += item.quantity || 0;
          existing.revenue += item.total_price || item.unit_price * (item.quantity || 0);
          salesMap.set(item.product_id, existing);
        }
      }

      return rows.map(product => {
        const sales = salesMap.get(product.product_id) || { quantity: 0, revenue: 0 };
        return {
          ...product,
          name: product.product?.name ?? '',
          price: product.product?.price ?? 0,
          currency: product.product?.currency ?? 'XOF',
          image_url: product.product?.image_url ?? null,
          is_active: product.product?.is_active ?? false,
          total_quantity_sold: sales.quantity,
          total_revenue: sales.revenue,
        };
      });
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
        .select(
          `
          ${PHYSICAL_PRODUCT_FIELDS},
          product:products(${PRODUCT_ITEM_FIELDS})
        `
        )
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as PhysicalProduct;
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
    onSuccess: () => {
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
    onSuccess: (_data, variables) => {
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
    mutationFn: async (physicalProductId: string) => {
      const { error } = await supabase
        .from('physical_products')
        .delete()
        .eq('id', physicalProductId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['physical-products'] });
    },
  });
}
