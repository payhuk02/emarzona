import { supabase } from '@/integrations/supabase/client';
import type { PhysicalCheckoutMethod } from '@/constants/physical-checkout-options';
import { initiatePayment } from '@/lib/payment-service';
import { releasePhysicalInventoryForOrder } from '@/lib/physical-inventory';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { createPublicPhysicalOrder } from '@/lib/orders/create-public-physical-order';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import {
  asOrderProduct,
  parsePaymentOptions,
  parseShippingAddress,
  parseStrategyOptions,
} from '@/lib/orders/order-strategy-utils';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

/**
 * Checkout physique via RPC SECURITY DEFINER (`create_public_physical_order`).
 * Les INSERT directs sur `orders` sont bloqués par RLS pour les acheteurs.
 */
export class PhysicalOrderStrategy implements OrderStrategy {
  async createOrder(context: OrderStrategyContext): Promise<OrderCreationResult> {
    const {
      productId,
      storeId,
      customerEmail,
      customerName,
      customerPhone,
      quantity = 1,
      productRecord: product,
      options,
      returnUrl,
      cancelUrl,
      guestCheckout,
    } = context;

    if (!product) {
      throw new Error('Produit non fourni à la stratégie');
    }

    const productData = asOrderProduct(product);
    const opts = parseStrategyOptions(options);
    const {
      variantId,
      giftCardId,
      giftCardAmount = 0,
      checkoutMethod: checkoutMethodOverride,
    } = opts;

    if (!opts.shippingAddress) {
      throw new Error('Adresse de livraison requise pour un produit physique');
    }
    const shippingAddress = parseShippingAddress(opts.shippingAddress);

    const parsedCheckout = parsePhysicalCheckoutOptions(
      productData.payment_options as Parameters<typeof parsePhysicalCheckoutOptions>[0]
    );
    const checkoutMethod = checkoutMethodOverride ?? parsedCheckout.checkout_method;
    const isCashOnDelivery = checkoutMethod === 'cash_on_delivery';

    const { data: physicalRow } = await supabase
      .from('physical_products')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle();

    const resolvedPhysicalProductId = physicalRow?.id;
    if (!resolvedPhysicalProductId) {
      throw new Error('Produit physique non trouvé');
    }

    const { payment_type: paymentTypeRaw, percentage_rate: percentageRate } = parsePaymentOptions(
      productData.payment_options
    );
    const paymentType = isCashOnDelivery ? 'full' : paymentTypeRaw;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isGuest = guestCheckout ?? !user;
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const rpcResult = await createPublicPhysicalOrder({
      productId,
      storeId,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      quantity,
      variantId,
      checkoutMethod: checkoutMethod as PhysicalCheckoutMethod,
      shippingAddress,
      affiliateTrackingCookie,
      guestCheckout: isGuest,
    });

    const orderId = rpcResult.order_id;
    const orderItemId = rpcResult.order_item_id;
    const customerId = rpcResult.customer_id;
    const totalPrice = rpcResult.total_amount;
    const inventoryId = rpcResult.inventory_id ?? '';
    const currency = rpcResult.currency || productData.currency;

    let amountToPay = totalPrice;
    let remainingAmount = 0;

    if (paymentType === 'percentage') {
      amountToPay = Math.round((totalPrice * percentageRate) / 100);
      remainingAmount = totalPrice - amountToPay;
    }

    const finalAmountToPay = Math.max(0, amountToPay - (giftCardAmount || 0));

    if (giftCardId && giftCardAmount > 0) {
      try {
        await supabase.rpc('redeem_gift_card', {
          p_gift_card_id: giftCardId,
          p_order_id: orderId,
          p_amount: giftCardAmount,
        });
      } catch (giftCardError) {
        logger.error('Error in gift card redemption:', giftCardError);
      }
    }

    try {
      await supabase.rpc('create_invoice_from_order', { p_order_id: orderId });
    } catch (_invoiceErr) {
      /* ignore */
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(orderId, {
        store_id: storeId,
        customer_id: customerId,
        order_number: rpcResult.order_number,
        status: isCashOnDelivery || rpcResult.cash_on_delivery ? 'confirmed' : 'pending',
        total_amount: totalPrice - (giftCardAmount || 0),
        currency,
        payment_status: isCashOnDelivery || rpcResult.cash_on_delivery ? 'cod_pending' : 'pending',
        created_at: new Date().toISOString(),
      }).catch(() => {});
    });

    if (paymentType === 'delivery_secured') {
      await supabase.from('secured_payments').insert({
        order_id: orderId,
        total_amount: totalPrice,
        held_amount: amountToPay,
        status: 'held',
        hold_reason: 'delivery_confirmation',
        release_conditions: {
          requires_delivery_confirmation: true,
          auto_release_days: 7,
        },
      });
    }

    if (isCashOnDelivery || rpcResult.cash_on_delivery) {
      return {
        orderId,
        orderItemId,
        inventoryId,
        cashOnDelivery: true,
        orderNumber: rpcResult.order_number,
      };
    }

    const paymentDescription =
      paymentType === 'percentage'
        ? `Acompte ${percentageRate}%: ${productData.name} x${quantity}`
        : paymentType === 'delivery_secured'
          ? `Paiement sécurisé: ${productData.name} x${quantity}`
          : `Achat: ${productData.name} x${quantity}`;

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId,
      customerId,
      amount: finalAmountToPay,
      currency,
      description: paymentDescription,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      returnUrl,
      cancelUrl,
      metadata: {
        product_type: 'physical',
        physical_product_id: resolvedPhysicalProductId,
        variant_id: variantId,
        inventory_id: inventoryId || undefined,
        quantity,
        order_item_id: orderItemId,
        shipping_address: shippingAddress,
        payment_type: paymentType,
        percentage_rate: paymentType === 'percentage' ? percentageRate : null,
        total_price: totalPrice,
        amount_paid: amountToPay,
        remaining_amount: remainingAmount,
        ...(isGuest ? { guest_checkout: true } : {}),
      },
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
      await releasePhysicalInventoryForOrder(orderId);
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId,
      orderItemId,
      inventoryId,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
      orderNumber: rpcResult.order_number,
    };
  }
}
