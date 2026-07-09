import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { createSupabaseUserClient } from './supabase-admin.ts';

const TERMINAL_PAYMENT_STATUSES = new Set(['paid', 'completed', 'refunded', 'cancelled']);

/** Guest checkout window without login (requires valid checkout_token). */
export const CHECKOUT_GUEST_WINDOW_MS = 15 * 60 * 1000;

export interface CheckoutOrderContext {
  orderId: string;
  storeId: string;
  amount: number;
  currency: string;
  customerId: string | null;
  customerEmail: string | null;
  paymentStatus: string | null;
  createdAt: string;
  checkoutToken: string | null;
}

async function resolveOrderCustomerEmail(
  supabase: SupabaseClient,
  customerId: string | null,
  metadata: Record<string, unknown> | null
): Promise<string | null> {
  const fromMetadata = metadata?.customer_email;
  if (typeof fromMetadata === 'string' && fromMetadata.trim()) {
    return fromMetadata.trim().toLowerCase();
  }

  if (!customerId) return null;

  const { data: customer } = await supabase
    .from('customers')
    .select('email')
    .eq('id', customerId)
    .maybeSingle();

  const email = customer?.email;
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
}

export async function loadCheckoutOrder(
  supabase: SupabaseClient,
  orderId: string,
  storeId: string
): Promise<CheckoutOrderContext | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, store_id, total_amount, currency, customer_id, payment_status, created_at, metadata')
    .eq('id', orderId)
    .eq('store_id', storeId)
    .maybeSingle();

  if (error || !order) return null;

  const amount =
    typeof order.total_amount === 'string'
      ? parseFloat(order.total_amount)
      : Number(order.total_amount);

  const metadata =
    order.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : null;

  const checkoutToken =
    metadata && typeof metadata.checkout_token === 'string' ? metadata.checkout_token : null;

  const customerEmail = await resolveOrderCustomerEmail(
    supabase,
    order.customer_id ?? null,
    metadata
  );

  return {
    orderId: order.id,
    storeId: order.store_id,
    amount,
    currency: String(order.currency ?? 'XOF').toUpperCase(),
    customerId: order.customer_id ?? null,
    customerEmail,
    paymentStatus: order.payment_status ?? null,
    createdAt: order.created_at,
    checkoutToken,
  };
}

export function isOrderPayable(paymentStatus: string | null): boolean {
  if (!paymentStatus) return true;
  return !TERMINAL_PAYMENT_STATUSES.has(paymentStatus);
}

function isWithinGuestCheckoutWindow(createdAt: string): boolean {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  return Date.now() - createdMs <= CHECKOUT_GUEST_WINDOW_MS;
}

function resolveCheckoutToken(req: Request, explicitToken?: string): string | null {
  const fromArg = explicitToken?.trim();
  if (fromArg) return fromArg;

  const fromHeader = req.headers.get('x-checkout-token')?.trim();
  return fromHeader || null;
}

/**
 * Validates checkout access: order exists, store matches, amount from DB, not already paid.
 * Unauthenticated callers must present a valid checkout_token within the guest window.
 */
export async function authorizeCheckoutOrder(
  supabase: SupabaseClient,
  req: Request,
  orderId: string,
  storeId: string,
  requestedAmount?: number,
  checkoutToken?: string
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
  let user = null;
  let isBuyer = false;
  let isStoreOwner = false;

  // Try to authenticate the user if a bearer token is provided
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const isAnonKey = authHeader.trim() === `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`;
    
    // Only attempt to get user if it's not the anon key
    if (!isAnonKey) {
      const supabaseUser = createSupabaseUserClient(authHeader);
      const { data: userData, error: userError } = await supabaseUser.auth.getUser();
      
      if (!userError && userData.user) {
        user = userData.user;
        
        isBuyer = order.customerId === user.id ||
          (order.customerEmail != null &&
            order.customerEmail.toLowerCase() === (user.email ?? '').toLowerCase());

        const { data: store } = await supabase
          .from('stores')
          .select('user_id')
          .eq('id', storeId)
          .maybeSingle();

        isStoreOwner = store?.user_id === user.id;
      }
    }
  }

  // If successfully authenticated and has access, allow
  if (user && (isBuyer || isStoreOwner)) {
    return { ok: true, order };
  }

  // Otherwise, require guest checkout token validation
  if (!isWithinGuestCheckoutWindow(order.createdAt)) {
    return { ok: false, status: 401, error: 'Authentication required for this order' };
  }

  const providedToken = resolveCheckoutToken(req, checkoutToken);
  if (!order.checkoutToken || !providedToken || providedToken !== order.checkoutToken) {
    return { ok: false, status: 401, error: 'Invalid checkout session' };
  }

  return { ok: true, order };
}
