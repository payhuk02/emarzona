import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  mapPhysicalProductInventoryRow,
  PHYSICAL_PRODUCT_INVENTORY_SELECT,
} from '@/lib/physical/inventory-adapter';

/** Inventory rows for a physical product (canonical: physical_product_inventory). */
export function useInventory(physicalProductId: string) {
  return useQuery({
    queryKey: ['inventory-by-physical-product', physicalProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_product_inventory')
        .select(PHYSICAL_PRODUCT_INVENTORY_SELECT)
        .eq('physical_product_id', physicalProductId);

      if (error) throw error;
      return (data ?? []).map(row => mapPhysicalProductInventoryRow(row as never));
    },
    enabled: !!physicalProductId,
  });
}
