/**
 * Inventory Management Hooks
 * Date: 28 octobre 2025
 *
 * Hooks pour gestion inventaire et stock
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  getInventoryRowProductName,
  getInventoryRowStoreId,
  getInventoryRowVariantLabel,
  mapPhysicalProductInventoryRow,
  PHYSICAL_PRODUCT_INVENTORY_SELECT,
} from '@/lib/physical/inventory-adapter';

const INVENTORY_ITEM_FIELDS =
  'id, physical_product_id, variant_id, quantity_available, quantity, quantity_reserved, reserved_quantity, location_name, reorder_point, reorder_quantity, unit_cost, last_counted_at, created_at, updated_at';
const INVENTORY_STOCK_MOVEMENT_FIELDS =
  'id, inventory_item_id, movement_type, quantity, order_id, user_id, reason, notes, unit_cost, total_cost, movement_date, created_at';

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
      const { data, error } = await supabase
        .from('physical_product_inventory')
        .select(PHYSICAL_PRODUCT_INVENTORY_SELECT);

      if (error) throw error;

      const rows = (data ?? []) as never[];
      const filtered = storeId ? rows.filter(row => getInventoryRowStoreId(row) === storeId) : rows;

      return filtered.map(row => mapPhysicalProductInventoryRow(row));
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
        .from('physical_product_inventory')
        .select(INVENTORY_ITEM_FIELDS)
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return mapPhysicalProductInventoryRow(data as never);
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
      const { data: variant, error: variantError } = await supabase
        .from('physical_product_variants')
        .select('id')
        .eq('sku', sku)
        .maybeSingle();

      if (variantError) throw variantError;
      if (!variant) throw new Error('SKU introuvable');

      const { data, error } = await supabase
        .from('physical_product_inventory')
        .select(PHYSICAL_PRODUCT_INVENTORY_SELECT)
        .eq('variant_id', variant.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Inventaire introuvable pour ce SKU');
      return mapPhysicalProductInventoryRow(data as never);
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
        .select(INVENTORY_STOCK_MOVEMENT_FIELDS)
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
      const { data: items, error } = await supabase
        .from('physical_product_inventory')
        .select(PHYSICAL_PRODUCT_INVENTORY_SELECT);

      if (error) throw error;
      if (!items) return [];

      const alerts: StockAlert[] = [];

      items.forEach((rawRow: never) => {
        const row = rawRow as Parameters<typeof getInventoryRowStoreId>[0];
        if (getInventoryRowStoreId(row) !== storeId) return;

        const mapped = mapPhysicalProductInventoryRow(row);
        const productName = getInventoryRowProductName(row) + getInventoryRowVariantLabel(row);

        if (mapped.quantity_available === 0) {
          alerts.push({
            product_name: productName,
            sku: mapped.sku,
            quantity_available: mapped.quantity_available,
            reorder_point: mapped.reorder_point,
            alert_type: 'out_of_stock',
          });
        } else if (mapped.quantity_available <= mapped.reorder_point) {
          alerts.push({
            product_name: productName,
            sku: mapped.sku,
            quantity_available: mapped.quantity_available,
            reorder_point: mapped.reorder_point,
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
      const { data: items, error } = await supabase
        .from('physical_product_inventory')
        .select(PHYSICAL_PRODUCT_INVENTORY_SELECT);

      if (error) throw error;
      if (!items) return { total_value: 0, total_items: 0, total_quantity: 0 };

      const storeItems = items
        .filter((row: never) => getInventoryRowStoreId(row as never) === storeId)
        .map(row => mapPhysicalProductInventoryRow(row as never));

      const total_value = storeItems.reduce((sum, item) => sum + (item.total_value || 0), 0);

      return {
        total_value,
        total_items: storeItems.length,
        total_quantity: storeItems.reduce((sum, item) => sum + item.quantity_available, 0),
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
        .from('physical_product_inventory')
        .update({
          quantity_available: quantity,
          quantity,
        })
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
      const { data: current, error: readError } = await supabase
        .from('physical_product_inventory')
        .select('quantity_available, quantity')
        .eq('id', inventoryItemId)
        .single();

      if (readError || !current) throw readError ?? new Error('Inventaire introuvable');

      const currentQty = current.quantity_available ?? current.quantity ?? 0;
      const nextQty = Math.max(0, currentQty + quantity);

      const { data, error } = await supabase
        .from('physical_product_inventory')
        .update({
          quantity_available: nextQty,
          quantity: nextQty,
        })
        .eq('id', inventoryItemId)
        .select()
        .single();

      if (error) throw error;

      void reason;
      void notes;
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
      const { data: row, error: readError } = await supabase
        .from('physical_product_inventory')
        .select('quantity_available, quantity, quantity_reserved, reserved_quantity')
        .eq('id', inventoryItemId)
        .single();

      if (readError || !row) throw readError ?? new Error('Inventaire introuvable');

      const available = row.quantity_available ?? row.quantity ?? 0;
      const reserved = row.quantity_reserved ?? row.reserved_quantity ?? 0;
      const sellable = available - reserved;

      if (sellable < quantity) {
        throw new Error('Insufficient inventory');
      }

      const nextReserved = reserved + quantity;
      const { error } = await supabase
        .from('physical_product_inventory')
        .update({
          quantity_reserved: nextReserved,
          reserved_quantity: nextReserved,
        })
        .eq('id', inventoryItemId);

      if (error) throw error;
      return true;
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
        supabase.from('inventory_items').update({ reorder_point }).eq('id', id)
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
