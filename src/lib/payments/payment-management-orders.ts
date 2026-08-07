/**
 * Helpers for vendor payment management list (orders with percentage / escrow).
 */

import type { AdvancedPayment, PaymentStatus, PaymentType } from '@/types/advanced-features';

export type PaymentManagementOrder = {
  id: string;
  payment_status?: string | null;
  payment_type?: 'full' | 'percentage' | 'delivery_secured' | string | null;
  percentage_paid?: number | null;
  remaining_amount?: number | null;
  delivery_status?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  order_number?: string | null;
  store_id?: string | null;
  customer_id?: string | null;
  created_at?: string;
  customers?: { name?: string; email?: string } | null;
  order_items?: Array<{ product_name?: string }>;
};

const SETTLED_STATUSES = new Set(['paid', 'completed']);

export function isOrderPaymentSettled(paymentStatus?: string | null): boolean {
  if (!paymentStatus) return false;
  return SETTLED_STATUSES.has(paymentStatus.toLowerCase());
}

export function orderHasPartialPercentage(order: PaymentManagementOrder): boolean {
  const pct = Number(order.percentage_paid ?? 0);
  return pct > 0 && pct < 100;
}

export function orderHasRemainingBalance(order: PaymentManagementOrder): boolean {
  return Number(order.remaining_amount ?? 0) > 0;
}

/** Commandes à afficher dans la gestion des paiements avancés. */
export function orderNeedsAdvancedManagement(order: PaymentManagementOrder): boolean {
  const type = (order.payment_type ?? 'full').toLowerCase();
  const settled = isOrderPaymentSettled(order.payment_status);
  const remaining = orderHasRemainingBalance(order);
  const partialPct = orderHasPartialPercentage(order);

  if (type === 'percentage') {
    return remaining || partialPct || !settled;
  }

  if (type === 'delivery_secured') {
    const delivery = (order.delivery_status ?? 'pending').toLowerCase();
    if (delivery === 'confirmed' || delivery === 'delivered') {
      return remaining || !settled;
    }
    return !settled || remaining;
  }

  if (remaining || partialPct) return true;
  if (order.payment_status === 'partial') return true;

  return false;
}

export type ManagementPaymentKind = 'escrow' | 'percentage' | 'standard';

export function getManagementPaymentKind(order: PaymentManagementOrder): ManagementPaymentKind {
  const type = (order.payment_type ?? 'full').toLowerCase();
  if (type === 'delivery_secured') return 'escrow';
  if (
    type === 'percentage' ||
    orderHasPartialPercentage(order) ||
    orderHasRemainingBalance(order)
  ) {
    return 'percentage';
  }
  return 'standard';
}

export type ManagementStatusKind = 'completed' | 'pending' | 'partial';

export function getManagementStatusKind(order: PaymentManagementOrder): ManagementStatusKind {
  if (orderHasRemainingBalance(order) || order.payment_status === 'partial') {
    return 'partial';
  }
  if (isOrderPaymentSettled(order.payment_status)) {
    const type = (order.payment_type ?? 'full').toLowerCase();
    if (type === 'delivery_secured') {
      const delivery = (order.delivery_status ?? 'pending').toLowerCase();
      if (delivery !== 'confirmed' && delivery !== 'delivered') {
        return 'pending';
      }
    }
    return 'completed';
  }
  return 'pending';
}

export const SYNTHETIC_ORDER_PAYMENT_PREFIX = 'order:';

export function syntheticPaymentIdForOrder(orderId: string): string {
  return `${SYNTHETIC_ORDER_PAYMENT_PREFIX}${orderId}`;
}

export function isSyntheticOrderPaymentId(paymentId: string): boolean {
  return paymentId.startsWith(SYNTHETIC_ORDER_PAYMENT_PREFIX);
}

export function orderIdFromSyntheticPaymentId(paymentId: string): string {
  return paymentId.slice(SYNTHETIC_ORDER_PAYMENT_PREFIX.length);
}

export function advancedPaymentFromOrder(order: PaymentManagementOrder): AdvancedPayment {
  const paymentType = (order.payment_type ?? 'full') as PaymentType;
  let status: PaymentStatus = 'pending';
  const kind = getManagementStatusKind(order);
  if (kind === 'completed') status = 'completed';
  else if (paymentType === 'delivery_secured' && isOrderPaymentSettled(order.payment_status)) {
    status = 'held';
  }

  return {
    id: syntheticPaymentIdForOrder(order.id),
    store_id: order.store_id ?? '',
    order_id: order.id,
    customer_id: order.customer_id ?? undefined,
    payment_method: 'geniuspay',
    amount: Number(order.total_amount ?? 0),
    currency: order.currency ?? 'XOF',
    status,
    payment_type: paymentType,
    percentage_amount: orderHasPartialPercentage(order) ? Number(order.percentage_paid) : undefined,
    remaining_amount: Number(order.remaining_amount ?? 0) || undefined,
    is_held: paymentType === 'delivery_secured' && kind !== 'completed',
    customers: order.customers
      ? { name: order.customers.name ?? 'N/A', email: order.customers.email }
      : undefined,
    orders: order.order_number ? { order_number: order.order_number } : undefined,
    created_at: order.created_at ?? new Date().toISOString(),
    updated_at: order.created_at ?? new Date().toISOString(),
  };
}
