import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { StockMovement } from '@/components/physical/StockMovementHistory';
import {
  mapDbStockMovementToUi,
  type InventoryItemRow,
} from '@/lib/physical/stock-movement-mapper';

const INVENTORY_STOCK_MOVEMENT_FIELDS =
  'id, inventory_item_id, movement_type, quantity, order_id, user_id, reason, notes, movement_date, created_at';

export function useStoreStockMovementHistory(
  storeId: string,
  options?: { limit?: number; productId?: string }
) {
  const limit = options?.limit ?? 200;
  const productId = options?.productId;

  return useQuery({
    queryKey: ['store-stock-movement-history', storeId, productId, limit],
    queryFn: async (): Promise<StockMovement[]> => {
      const { data: items, error: itemsError } = await supabase.from('inventory_items').select(`
          id,
          sku,
          physical_product:physical_products (
            id,
            product_id,
            product:products ( name, store_id )
          ),
          variant:product_variants ( id, option1_value, option2_value )
        `);

      if (itemsError) throw itemsError;

      let storeItems = ((items ?? []) as InventoryItemRow[]).filter(
        item => item.physical_product?.product?.store_id === storeId
      );

      if (productId) {
        storeItems = storeItems.filter(
          item =>
            item.physical_product?.product_id === productId ||
            item.physical_product?.id === productId
        );
      }

      const itemIds = storeItems.map(item => item.id);
      if (itemIds.length === 0) return [];

      const { data: movements, error } = await supabase
        .from('stock_movements')
        .select(INVENTORY_STOCK_MOVEMENT_FIELDS)
        .in('inventory_item_id', itemIds)
        .order('movement_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const itemMap = new Map(storeItems.map(item => [item.id, item]));

      return (movements ?? []).map(row =>
        mapDbStockMovementToUi(row, itemMap.get(row.inventory_item_id))
      );
    },
    enabled: !!storeId,
    staleTime: 60_000,
  });
}
