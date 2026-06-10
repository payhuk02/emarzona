import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { InventoryItem } from '@/hooks/physical/useInventory';

const INVENTORY_ITEM_FIELDS =
  'id, physical_product_id, variant_id, sku, quantity_available, quantity_reserved, quantity_committed, warehouse_location, bin_location, reorder_point, reorder_quantity, unit_cost, total_value, last_counted_at, created_at, updated_at';

/** Inventory rows for a physical product (all variants/locations). */
export function useInventory(physicalProductId: string) {
  return useQuery({
    queryKey: ['inventory-by-physical-product', physicalProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(INVENTORY_ITEM_FIELDS)
        .eq('physical_product_id', physicalProductId);

      if (error) throw error;
      return (data ?? []) as InventoryItem[];
    },
    enabled: !!physicalProductId,
  });
}
