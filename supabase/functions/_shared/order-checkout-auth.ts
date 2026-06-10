import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { createSupabaseUserClient } from './supabase-admin.ts';

const TERMINAL_PAYMENT_STATUSES = new Set(['paid', 'completed', 'refunded', 'cancelled']);

export interface CheckoutOrderContext {
  orderId: string;
  storeId: string;
  amount: number;
  currency: string;
  customerId: string | null;
  customerEmail: string | null;
  paymentStatus: string | null;
}

export async function loadCheckoutOrder(
  supabase: SupabaseClient,
  orderId: string,
  storeId: string
): Promise<CheckoutOrderContext | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, store_id, total_amount, currency, customer_id, customer_email, payment_status')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error || !order) return null;

  const amount =
    typeof order.total_amount === 'string'
      ? parseFloat(order.total_amount)
      : Number(order.total_amount);

  return {
    orderId: order.id,
    storeId: order.store_id,
    amount,
    currency: String(order.currency ?? 'XOF').toUpperCase(),
    customerId: order.customer_id ?? null,
    customerEmail: order.customer_email ?? null,
    paymentStatus: order.payment_status ?? null,
  };
}

export function isOrderPayable(paymentStatus: string | null): boolean {
  if (!paymentStatus) return true;
  return !TERMINAL_PAYMENT_STATUSES.has(paymentStatus);
}

/**
 * Validates checkout access: order exists, store matches, amount from DB, not already paid.
 * If Authorization is present, verifies the caller is the buyer or store owner.
 */
export async function authorizeCheckoutOrder(
  supabase: SupabaseClient,
  req: Request,
  orderId: string,
  storeId: string,
  requestedAmount?: number
): Promise<
  { ok: true; order: CheckoutOrderContext } | { ok: false; status: number; error: string }
> {
  const order = await loadCheckoutOrder(supabase, orderId, storeId);
  if (!order) {
    return { ok: false, status: 404, error: 'Order not found' };
  }

  if (!isOrderPayable(order.paymentStatus)) {
    return { ok: false, status: 409, error: 'Order is not payable' };
  }

  if (requestedAmount != null) {
    const diff = Math.abs(Number(requestedAmount) - order.amount);
    if (diff > 0.01) {
      return { ok: false, status: 400, error: 'Amount mismatch' };
    }
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    const createdCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .gte('created_at', createdCutoff)
      .maybeSingle();

    if (!recent) {
      return { ok: false, status: 401, error: 'Authentication required for this order' };
    }
    return { ok: true, order };
  }

  const supabaseUser = createSupabaseUserClient(authHeader);
  const {
    data: { user },
    error: userError,
  } = await supabaseUser.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401, error: 'Invalid session' };
  }

  const isBuyer =
    order.customerId === user.id ||
    (order.customerEmail != null &&
      order.customerEmail.toLowerCase() === (user.email ?? '').toLowerCase());

  const { data: store } = await supabase
    .from('stores')
    .select('user_id')
    .eq('id', storeId)
    .maybeSingle();

  const isStoreOwner = store?.user_id === user.id;

  if (!isBuyer && !isStoreOwner) {
    return { ok: false, status: 403, error: 'Access denied for this order' };
  }

  return { ok: true, order };
}
