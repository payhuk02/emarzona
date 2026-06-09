/**
 * Client Supabase staging pour validations E2E post-déploiement (C1, C5).
 *
 * Variables requises pour les tests staging :
 *   E2E_STAGING_SUPABASE_URL
 *   E2E_STAGING_SUPABASE_SERVICE_KEY
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function hasStagingSupabaseCredentials(): boolean {
  return Boolean(
    process.env.E2E_STAGING_SUPABASE_URL?.trim() &&
      process.env.E2E_STAGING_SUPABASE_SERVICE_KEY?.trim()
  );
}

export function createStagingSupabaseClient(): SupabaseClient {
  const url = process.env.E2E_STAGING_SUPABASE_URL?.trim();
  const key = process.env.E2E_STAGING_SUPABASE_SERVICE_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      'Staging Supabase credentials missing. Set E2E_STAGING_SUPABASE_URL and E2E_STAGING_SUPABASE_SERVICE_KEY.'
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function findPhysicalOnlyPaidOrder(
  supabase: SupabaseClient
): Promise<{ orderId: string; storeId: string; totalAmount: number } | null> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, store_id, total_amount, payment_status, status')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(40);

  if (error || !orders?.length) {
    return null;
  }

  for (const order of orders) {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_type')
      .eq('order_id', order.id);

    if (!items?.length) continue;

    const types = items.map(i => i.product_type).filter(Boolean);
    if (types.length === 0) continue;

    const allPhysical = types.every(t => t === 'physical');
    if (allPhysical) {
      return {
        orderId: order.id,
        storeId: order.store_id,
        totalAmount: Number(order.total_amount ?? 0),
      };
    }
  }

  return null;
}

export async function findDigitalOnlyPaidOrder(
  supabase: SupabaseClient
): Promise<{ orderId: string; storeId: string } | null> {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, store_id, payment_status')
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(40);

  if (!orders?.length) return null;

  for (const order of orders) {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_type')
      .eq('order_id', order.id);

    if (!items?.length) continue;

    const types = items.map(i => i.product_type).filter(Boolean);
    if (types.length === 0) continue;

    const allCommissionable = types.every(t =>
      ['digital', 'service', 'course', 'artist'].includes(String(t))
    );
    if (allCommissionable) {
      return { orderId: order.id, storeId: order.store_id };
    }
  }

  return null;
}
