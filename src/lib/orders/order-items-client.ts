/**
 * Client order_items avec colonnes étendues absentes du schéma généré Supabase.
 */
import { supabase } from '@/integrations/supabase/client';
import type { OrderItemExtendedInsert, OrderItemExtendedRow } from './order-strategy-utils';

type OrderItemsFilterChain = {
  eq: (column: string, value: string) => OrderItemsFilterChain;
  limit: (count: number) => Promise<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>;
};

type OrderItemsQuery = {
  insert: (row: OrderItemExtendedInsert | OrderItemExtendedInsert[]) => {
    select: (cols: string) => {
      single: () => Promise<{
        data: { id: string } | null;
        error: { message: string } | null;
      }>;
    };
  };
  select: (cols: string) => OrderItemsFilterChain;
};

export function orderItemsTable() {
  return supabase.from('order_items') as unknown as OrderItemsQuery;
}

export async function insertOrderItem(row: OrderItemExtendedInsert) {
  return orderItemsTable().insert(row).select('id').single();
}

export async function fetchOrderItemExtended(itemId: string): Promise<OrderItemExtendedRow | null> {
  const { data, error } = await supabase.from('order_items').select('*').eq('id', itemId).single();
  if (error || !data) return null;
  return data as OrderItemExtendedRow;
}
