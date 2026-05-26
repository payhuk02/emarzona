/**
 * Checkout Moneroo pour l'enchérisseur gagnant (H-03).
 */

import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { logger } from '@/lib/logger';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';

export interface AuctionWinnerCheckoutResult {
  orderId: string;
  checkoutUrl: string;
  transactionId: string;
}

export async function ensureAuctionWinnerOrder(auctionId: string): Promise<string> {
  const { data: orderId, error } = await supabase.rpc('create_auction_winner_order', {
    p_auction_id: auctionId,
  });

  if (error) {
    logger.error('create_auction_winner_order failed', { error, auctionId });
    throw new Error(error.message || "Impossible de créer la commande d'enchère");
  }

  if (!orderId) {
    throw new Error(
      "Aucune commande créée pour cette enchère (réserve non atteinte ou pas d'offre gagnante)"
    );
  }

  return orderId as string;
}

export async function startAuctionWinnerPayment(
  auctionId: string,
  options: {
    customerEmail: string;
    customerName?: string;
    customerPhone?: string;
  }
): Promise<AuctionWinnerCheckoutResult> {
  const orderId = await ensureAuctionWinnerOrder(auctionId);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
      id,
      store_id,
      customer_id,
      total_amount,
      currency,
      payment_status,
      metadata,
      order_items (
        id,
        product_id,
        product_name
      )
    `
    )
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error("Commande d'enchère introuvable");
  }

  if (order.payment_status === 'paid' || order.payment_status === 'completed') {
    throw new Error('Cette enchère est déjà réglée');
  }

  const orderItem = order.order_items?.[0];
  const productId = orderItem?.product_id;
  if (!productId) {
    throw new Error('Ligne de commande invalide');
  }

  const paymentCurrency: Currency = isSupportedCurrency(order.currency)
    ? (order.currency as Currency)
    : 'XOF';

  const paymentResult = await initiatePayment({
    storeId: order.store_id,
    productId,
    orderId: order.id,
    customerId: order.customer_id,
    amount: Number(order.total_amount),
    currency: paymentCurrency,
    description: `Enchère gagnée — ${orderItem.product_name}`,
    customerEmail: options.customerEmail,
    customerName: options.customerName ?? options.customerEmail.split('@')[0],
    customerPhone: options.customerPhone,
    metadata: {
      product_type: 'artist',
      source: 'auction',
      auction_id: auctionId,
      order_item_id: orderItem.id,
    },
  });

  if (!paymentResult.success || !paymentResult.checkout_url) {
    throw new Error("Erreur lors de l'initialisation du paiement");
  }

  return {
    orderId: order.id,
    checkoutUrl: paymentResult.checkout_url,
    transactionId: paymentResult.transaction_id,
  };
}
