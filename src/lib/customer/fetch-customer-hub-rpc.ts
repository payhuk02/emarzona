/**
 * Hub acheteur unifié via RPC (1 round-trip).
 * Fallback client si la fonction n'est pas déployée.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  isRpcUnavailableError,
  logRpcFallback,
  type SupabaseRpcError,
} from '@/lib/dashboard/rpc-error-utils';

export interface CustomerHubOrderItem {
  product_type: string;
}

export interface CustomerHubRecentOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  items: CustomerHubOrderItem[];
}

export interface CustomerHubSummary {
  recentOrders: CustomerHubRecentOrder[];
  countsByType: Record<string, number>;
  activeOrdersCount: number;
  generatedAt: string;
}

export function isCustomerHubRpcUnavailableError(error: SupabaseRpcError): boolean {
  return isRpcUnavailableError(error);
}

function parseRecentOrders(raw: unknown): CustomerHubRecentOrder[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(row => {
    const o = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>;
    const itemsRaw = o.items;
    const items: CustomerHubOrderItem[] = Array.isArray(itemsRaw)
      ? itemsRaw.map(item => {
          const i = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
          return { product_type: typeof i.product_type === 'string' ? i.product_type : 'digital' };
        })
      : [];
    return {
      id: typeof o.id === 'string' ? o.id : String(o.id ?? ''),
      order_number: typeof o.order_number === 'string' ? o.order_number : '',
      status: typeof o.status === 'string' ? o.status : 'pending',
      payment_status: typeof o.payment_status === 'string' ? o.payment_status : 'pending',
      created_at: typeof o.created_at === 'string' ? o.created_at : new Date().toISOString(),
      items,
    };
  });
}

export function parseCustomerHubRpcPayload(payload: unknown): CustomerHubSummary {
  const root = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const countsRaw =
    root.countsByType && typeof root.countsByType === 'object'
      ? (root.countsByType as Record<string, unknown>)
      : {};

  const countsByType: Record<string, number> = {};
  for (const key of ['digital', 'physical', 'service', 'course', 'artist'] as const) {
    const n = Number(countsRaw[key]);
    countsByType[key] = Number.isFinite(n) ? n : 0;
  }

  return {
    recentOrders: parseRecentOrders(root.recentOrders),
    countsByType,
    activeOrdersCount: Number(root.activeOrdersCount) || 0,
    generatedAt: typeof root.generatedAt === 'string' ? root.generatedAt : new Date().toISOString(),
  };
}

export async function fetchCustomerHubFromRpc(
  limit = 5,
  activeOnly = true
): Promise<CustomerHubSummary> {
  const { data, error } = await supabase.rpc('get_customer_hub_summary', {
    p_limit: limit,
    p_active_only: activeOnly,
  });

  if (error) {
    if (isCustomerHubRpcUnavailableError(error)) {
      logRpcFallback('get_customer_hub_summary', error, { limit, activeOnly });
      throw Object.assign(new Error('CUSTOMER_HUB_RPC_UNAVAILABLE'), { cause: error });
    }
    throw error;
  }

  logger.debug('[CustomerHub] Loaded via get_customer_hub_summary', { limit, activeOnly });
  return parseCustomerHubRpcPayload(data);
}

/** Fallback client — même shape que la RPC. */
export async function fetchCustomerHubClientFallback(
  userId: string,
  limit = 5,
  activeOnly = true
): Promise<CustomerHubSummary> {
  let orderQuery = supabase
    .from('orders')
    .select('id, order_number, status, payment_status, created_at')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (activeOnly) {
    orderQuery = orderQuery.not('status', 'eq', 'completed');
  }

  const { data: orderRows, error } = await orderQuery;
  if (error) throw error;

  const orderIds = orderRows?.map(o => o.id) ?? [];
  let items: { order_id: string; product_type: string | null }[] = [];

  if (orderIds.length > 0) {
    const { data: itemRows, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, product_type')
      .in('order_id', orderIds);
    if (itemsError) throw itemsError;
    items = itemRows ?? [];
  }

  const recentOrders: CustomerHubRecentOrder[] = (orderRows ?? []).map(order => ({
    ...order,
    items: items
      .filter(i => i.order_id === order.id)
      .map(i => ({
        product_type: i.product_type ?? 'digital',
      })),
  }));

  return {
    recentOrders,
    countsByType: {
      digital: 0,
      physical: 0,
      service: 0,
      course: 0,
      artist: 0,
    },
    activeOrdersCount: activeOnly ? recentOrders.length : 0,
    generatedAt: new Date().toISOString(),
  };
}

export async function fetchCustomerHubSummary(
  userId: string,
  limit = 5,
  activeOnly = true
): Promise<CustomerHubSummary> {
  try {
    return await fetchCustomerHubFromRpc(limit, activeOnly);
  } catch (err) {
    if (err instanceof Error && err.message === 'CUSTOMER_HUB_RPC_UNAVAILABLE') {
      return fetchCustomerHubClientFallback(userId, limit, activeOnly);
    }
    throw err;
  }
}
