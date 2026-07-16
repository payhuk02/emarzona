/**
 * Création commande + réservation stock avant paiement GeniusPay (achat direct).
 */

import { supabase } from '@/integrations/supabase/client';
import { buildOrderItemRows } from '@/lib/checkout-order-items';
import { logger } from '@/lib/logger';
import {
  releasePhysicalInventoryForOrder,
  reservePhysicalInventoryForOrder,
} from '@/lib/physical-inventory';
import type { CartItem } from '@/types/cart';

export type BuyNowOrderInput = {
  productId: string;
  storeId: string;
  productName: string;
  productType: string;
  unitPrice: number;
  quantity?: number;
  variantId?: string | null;
  customerId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  currency: string;
  shippingAddress: Record<string, unknown>;
};

export type BuyNowOrderResult = {
  orderId: string;
  orderNumber: string;
};

/** Une ligne panier synthétique pour réutiliser buildOrderItemRows. */
function toCartItem(input: BuyNowOrderInput): CartItem {
  return {
    product_id: input.productId,
    product_name: input.productName,
    product_type: input.productType as CartItem['product_type'],
    quantity: input.quantity ?? 1,
    unit_price: input.unitPrice,
    currency: input.currency,
    variant_id: input.variantId ?? undefined,
    metadata: {},
  };
}

export async function createBuyNowOrderBeforePayment(
  input: BuyNowOrderInput
): Promise<BuyNowOrderResult> {
  const { data: orderNumberData } = await supabase.rpc('generate_order_number');
  const orderNumber = orderNumberData || `ORD-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: input.storeId,
      customer_id: input.customerId ?? null,
      order_number: orderNumber,
      total_amount: input.totalAmount,
      currency: input.currency,
      payment_status: 'pending',
      status: 'pending',
      shipping_address: input.shippingAddress as never,
      metadata: { buy_now: true, checkout_source: 'buy_now' },
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message || 'Erreur lors de la création de la commande');
  }

  const cartItem = toCartItem(input);
  const orderItems = await buildOrderItemRows(order.id, [cartItem]);

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems as never);
  if (itemsError) {
    throw new Error(itemsError.message || 'Erreur lors de la création des articles');
  }

  if (input.productType === 'physical') {
    try {
      await reservePhysicalInventoryForOrder(order.id);
    } catch (stockErr) {
      await releasePhysicalInventoryForOrder(order.id);
      throw stockErr;
    }
  }

  try {
    const { createInvoiceFromOrder } = await import('@/lib/supabase-rpc');
    const { error: invoiceError } = await createInvoiceFromOrder({ p_order_id: order.id });
    if (invoiceError) {
      logger.warn('Buy-now invoice creation failed', { orderId: order.id, error: invoiceError });
    }
  } catch (invoiceErr) {
    logger.warn('Buy-now invoice creation error', { orderId: order.id, error: invoiceErr });
  }

  return { orderId: order.id, orderNumber };
}
