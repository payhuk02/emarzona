/**
 * Inventory Management Hooks
 * Date: 28 octobre 2025
 * 
 * Hooks pour gestion inventaire et stock
 */

import { useQuery, useMutation, useQueryClient } from '@antml:invoke>
<parameter name="@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface InventoryItem {
  id: string;
  physical_product_id?: string;
  variant_id?: string;
  sku: string;
  quantity_available: number;
  quantity_reserved: number;
  quantity_committed: number;
  warehouse_location?: string;
  bin_location?: string;
  reorder_point: number;
  reorder_quantity: number;
  unit_cost?: number;
  total_value?: number;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage' | 'transfer' | 'recount';
  quantity: number;
  order_id?: string;
  user_id?: string;
  reason?: string;
  notes?: string;
  unit_cost?: number;
  total_cost?: number;
  movement_date: string;
  created_at: string;
}

export interface StockAlert {
  product_name: string;
  sku: string;
  quantity_available: number;
  reorder_point: number;
  alert_type: 'low_stock' | 'out_of_stock';
}

// =====================================================
// QUERY HOOKS
// =====================================================

/**
 * Get inventory items for a store
 */
export const useInventoryItems = (storeId?: string) => {
  return useQuery({
    queryKey: ['inventory-items', storeId],
    queryFn: async () => {
      // Complex query to get inventory with product/variant info
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          physical_product:physical_products (
            id,
            product:products (
              id,
              name,
              store_id
            )
          ),
          variant:product_variants (
            id,
            option1_value,
            option2_value,
            option3_value,
            physical_product:physical_products (
              product:products (
                id,
                name,
                store_id
              )
            )
          )
        `);

      if (error) throw error;

      // Filter by store
      if (storeId) {
        return data.filter((item: any) => {
          const productStoreId =
            item.physical_product?.product?.store_id ||
            item.variant?.physical_product?.product?.store_id;
          return productStoreId === storeId;
        });
      }

      return data as InventoryItem[];
    },
    enabled: !!storeId,
  });
};

/**
 * Get inventory item by ID
 */
export const useInventoryItem = (itemId: string) => {
  return useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data as InventoryItem;
    },
    enabled: !!itemId,
  });
};

/**
 * Get inventory item by SKU
 */
export const useInventoryItemBySKU = (sku: string) => {
  return useQuery({
    queryKey: ['inventory-item-sku', sku],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('sku', sku)
        .single();

      if (error) throw error;
      return data as InventoryItem;
    },
    enabled: !!sku,
  });
};

/**
 * Get stock movements for an inventory item
 */
export const useStockMovements = (inventoryItemId: string) => {
  return useQuery({
    queryKey: ['stock-movements', inventoryItemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('inventory_item_id', inventoryItemId)
        .order('movement_date', { ascending: false });

      if (error) throw error;
      return data as StockMovement[];
    },
    enabled: !!inventoryItemId,
  });
};

/**
 * Get low stock alerts
 */
export const useLowStockAlerts = (storeId: string) => {
  return useQuery({
    queryKey: ['low-stock-alerts', storeId],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('inventory_items')
        .select(`
          *,
          physical_product:physical_products (
            product:products (
              name,
              store_id
            )
          ),
          variant:product_variants (
            option1_value,
            option2_value,
            physical_product:physical_products (
              product:products (
                name,
                store_id
              )
            )
          )
        `);

      if (!items) return [];

      // Filter for low stock
      const alerts: StockAlert[] = [];

      items.forEach((item: any) => {
        const storeMatches =
          item.physical_product?.product?.store_id === storeId ||
          item.variant?.physical_product?.product?.store_id === storeId;

        if (!storeMatches) return;

        const productName =
          item.physical_product?.product?.name ||
          item.variant?.physical_product?.product?.name ||
          'Unknown';

        const variantInfo = item.variant
          ? ` (${item.variant.option1_value}${item.variant.option2_value ? ' / ' + item.variant.option2_value : ''})`
          : '';

        if (item.quantity_available === 0) {
          alerts.push({
            product_name: productName + variantInfo,
            sku: item.sku,
            quantity_available: item.quantity_available,
            reorder_point: item.reorder_point,
            alert_type: 'out_of_stock',
          });
        } else if (item.quantity_available <= item.reorder_point) {
          alerts.push({
            product_name: productName + variantInfo,
            sku: item.sku,
            quantity_available: item.quantity_available,
            reorder_point: item.reorder_point,
            alert_type: 'low_stock',
          });
        }
      });

      return alerts;
    },
    enabled: !!storeId,
  });
};

/**
 * Get inventory value for a store
 */
export const useInventoryValue = (storeId: string) => {
  return useQuery({
    queryKey: ['inventory-value', storeId],
    queryFn: async () => {
      const { data: items } = await supabase
        .from('inventory_items')
        .select(`
          *,
          physical_product:physical_products (
            product:products (store_id)
          ),
          variant:product_variants (
            physical_product:physical_products (
              product:products (store_id)
            )
          )
        `);

      if (!items) return { total_value: 0, total_items: 0 };

      const storeItems = items.filter((item: any) => {
        return (
          item.physical_product?.product?.store_id === storeId ||
          item.variant?.physical_product?.product?.store_id === storeId
        );
      });

      const total_value = storeItems.reduce(
        (sum: number, item: any) => sum + (item.total_value || 0),
        0
      );

      return {
        total_value,
        total_items: storeItems.length,
        total_quantity: storeItems.reduce(
          (sum: number, item: any) => sum + item.quantity_available,
          0
        ),
      };
    },
    enabled: !!storeId,
  });
};

// =====================================================
// MUTATION HOOKS
// =====================================================

/**
 * Update inventory quantity
 */
export const useUpdateInventoryQuantity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryItemId,
      quantity,
    }: {
      inventoryItemId: string;
      quantity: number;
    }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({ quantity_available: quantity })
        .eq('id', inventoryItemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });
};

/**
 * Create stock movement
 */
export const useCreateStockMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, 'id' | 'created_at' | 'total_cost'>) => {
      const { data, error } = await supabase
        .from('stock_movements')
        .insert(movement)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['stock-movements', variables.inventory_item_id],
      });
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });
};

/**
 * Adjust stock (creates movement + updates quantity)
 */
export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryItemId,
      quantity,
      reason,
      notes,
    }: {
      inventoryItemId: string;
      quantity: number;
      reason?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Create stock movement (trigger will update inventory_items)
      const { data, error } = await supabase
        .from('stock_movements')
        .insert({
          inventory_item_id: inventoryItemId,
          movement_type: 'adjustment',
          quantity,
          user_id: user?.id,
          reason,
          notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });
};

/**
 * Reserve inventory
 */
export const useReserveInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      inventoryItemId,
      quantity,
    }: {
      inventoryItemId: string;
      quantity: number;
    }) => {
      // Call the SQL function
      const { data, error } = await supabase.rpc('reserve_inventory', {
        p_inventory_item_id: inventoryItemId,
        p_quantity: quantity,
      });

      if (error) throw error;
      if (!data) throw new Error('Insufficient inventory');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
    },
  });
};

/**
 * Bulk update reorder points
 */
export const useBulkUpdateReorderPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; reorder_point: number }[]) => {
      const promises = updates.map(({ id, reorder_point }) =>
        supabase
          .from('inventory_items')
          .update({ reorder_point })
          .eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });
};

/**
 * Transfer stock between locations
 */
export const useTransferStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      fromInventoryId,
      toInventoryId,
      quantity,
      notes,
    }: {
      fromInventoryId: string;
      toInventoryId: string;
      quantity: number;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Create two movements: one out, one in
      const movements = [
        {
          inventory_item_id: fromInventoryId,
          movement_type: 'transfer',
          quantity: -quantity,
          user_id: user?.id,
          notes: `Transfer to ${toInventoryId}: ${notes || ''}`,
        },
        {
          inventory_item_id: toInventoryId,
          movement_type: 'transfer',
          quantity: quantity,
          user_id: user?.id,
          notes: `Transfer from ${fromInventoryId}: ${notes || ''}`,
        },
      ];

      const { error } = await supabase.from('stock_movements').insert(movements);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });
};

