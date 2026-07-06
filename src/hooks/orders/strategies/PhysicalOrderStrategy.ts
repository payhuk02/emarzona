import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import {
  releasePhysicalInventoryForOrder,
  reservePhysicalInventoryForOrder,
} from '@/lib/physical-inventory';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

// const PHYSICAL_PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';
const PHYSICAL_PRODUCT_VARIANT_FIELDS = 'id, price_adjustment, is_available';

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

    const {
      shippingAddress,
      variantId,
      inventoryLocationId,
      giftCardId,
      giftCardAmount = 0,
      checkoutMethod: checkoutMethodOverride,
    } = options || {};

    if (!shippingAddress) {
      throw new Error('Adresse de livraison requise pour un produit physique');
    }

    const parsedCheckout = parsePhysicalCheckoutOptions(
      product.payment_options as Parameters<typeof parsePhysicalCheckoutOptions>[0]
    );
    const checkoutMethod = checkoutMethodOverride ?? parsedCheckout.checkout_method;
    const isCashOnDelivery = checkoutMethod === 'cash_on_delivery';

    // 1. Récupérer l'ID spécifique physique
    const { data: physicalRow } = await supabase
      .from('physical_products')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle();

    const resolvedPhysicalProductId = physicalRow?.id;

    if (!resolvedPhysicalProductId) {
      throw new Error('Produit physique non trouvé');
    }

    // Récupérer les options de paiement configurées
    const paymentOptions = (product.payment_options as Record<string, unknown>) || {
      payment_type: 'full',
      percentage_rate: 30,
    };
    const paymentType = isCashOnDelivery ? 'full' : paymentOptions.payment_type || 'full';
    const percentageRate = paymentOptions.percentage_rate || 30;

    // 3. Récupérer la variante si spécifiée
    let variantPrice = 0;
    if (variantId) {
      const { data: variant, error: variantError } = await supabase
        .from('physical_product_variants')
        .select(PHYSICAL_PRODUCT_VARIANT_FIELDS)
        .eq('id', variantId)
        .single();

      if (variantError || !variant) {
        throw new Error('Variante non trouvée');
      }

      if (variant.is_available === false) {
        throw new Error("Cette variante n'est pas disponible");
      }

      variantPrice = variant.price_adjustment || 0;
    }

    const customerId = await findOrCreateStoreCustomer({
      storeId,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      phone: customerPhone,
      address: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.postal_code}`,
      city: shippingAddress.city,
      country: shippingAddress.country,
    });

    // 6. Calculer le prix total
    const unitPrice = (product.promotional_price || product.price) + variantPrice;
    const totalPrice = unitPrice * quantity;

    // Calculer le montant à payer selon le type de paiement
    let amountToPay = totalPrice;
    let percentagePaid = 0;
    let remainingAmount = 0;

    if (paymentType === 'percentage') {
      amountToPay = Math.round((totalPrice * percentageRate) / 100);
      percentagePaid = amountToPay;
      remainingAmount = totalPrice - amountToPay;
    } else if (paymentType === 'delivery_secured') {
      amountToPay = totalPrice;
    }

    const finalAmountToPay = Math.max(0, amountToPay - (giftCardAmount || 0));

    // 7. Générer un numéro de commande
    const orderNumber = await generateOrderNumber();

    // 8. Créer la commande
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        customer_email: customerEmail,
        order_number: orderNumber,
        total_amount: totalPrice - (giftCardAmount || 0),
        currency: product.currency,
        payment_status: isCashOnDelivery ? 'cod_pending' : 'pending',
        status: isCashOnDelivery ? 'confirmed' : 'pending',
        delivery_status: 'pending',
        payment_type: paymentType,
        percentage_paid: percentagePaid,
        remaining_amount: remainingAmount,
        affiliate_tracking_cookie: affiliateTrackingCookie,
        metadata: {
          checkout_method: checkoutMethod,
          guest_checkout: guestCheckout ?? true,
        },
      })
      .select(
        'id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at'
      )
      .single();

    if (orderError || !order) {
      throw new Error('Erreur lors de la création de la commande');
    }

    // 8a. Rédimer la carte cadeau
    if (giftCardId && giftCardAmount && giftCardAmount > 0) {
      try {
        const { data: redeemResult, error: redeemError } = await supabase.rpc('redeem_gift_card', {
          p_gift_card_id: giftCardId,
          p_order_id: order.id,
          p_amount: giftCardAmount,
        });
        if (redeemError) {
          logger.error('Error redeeming gift card:', redeemError);
        } else if (redeemResult && redeemResult.length > 0 && !redeemResult[0].success) {
          logger.error('Gift card redemption failed:', redeemResult[0].message);
        }
      } catch (giftCardError) {
        logger.error('Error in gift card redemption:', giftCardError);
      }
    }

    // 9. Créer automatiquement la facture
    try {
      const { data: invoiceId, error: invoiceError } = await supabase.rpc(
        'create_invoice_from_order',
        { p_order_id: order.id }
      );
      if (invoiceError) {
        logger.error('Error creating invoice:', invoiceError);
      } else {
        logger.info(`Invoice created: ${invoiceId}`);
      }
    } catch (invoiceErr) {
      logger.error('Error in invoice creation:', invoiceErr);
    }

    // 10. Webhook (asynchrone)
    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(order.id, order).catch(err => {
        logger.error('Error in analytics tracking', { error: err, orderId: order.id });
      });
    });

    // 11. Créer l'order_item
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        product_type: 'physical',
        physical_product_id: resolvedPhysicalProductId,
        variant_id: variantId,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        item_metadata: {
          variant_price_adjustment: variantPrice,
          shipping_address: shippingAddress,
          ...(inventoryLocationId ? { preferred_inventory_id: inventoryLocationId } : {}),
        },
      })
      .select('id')
      .single();

    if (orderItemError || !orderItem) {
      throw new Error("Erreur lors de la création de l'élément de commande");
    }

    try {
      await reservePhysicalInventoryForOrder(order.id);
    } catch (stockErr) {
      throw stockErr instanceof Error ? stockErr : new Error('Stock insuffisant');
    }

    const { data: reservedItem } = await supabase
      .from('order_items')
      .select('item_metadata')
      .eq('id', orderItem.id)
      .single();

    const reservedMeta = (reservedItem?.item_metadata ?? {}) as Record<string, unknown>;
    const inventoryId =
      typeof reservedMeta.inventory_id === 'string' ? reservedMeta.inventory_id : '';
    const inventoryLocation =
      typeof reservedMeta.inventory_location === 'string'
        ? reservedMeta.inventory_location
        : undefined;

    // Secured payment
    if (paymentType === 'delivery_secured') {
      await supabase.from('secured_payments').insert({
        order_id: order.id,
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

    // COD
    if (isCashOnDelivery) {
      return {
        orderId: order.id,
        orderItemId: orderItem.id,
        inventoryId,
        cashOnDelivery: true,
        orderNumber: order.order_number,
      };
    }

    // Payment init
    const paymentDescription =
      paymentType === 'percentage'
        ? `Acompte ${percentageRate}%: ${product.name} x${quantity}`
        : paymentType === 'delivery_secured'
          ? `Paiement sécurisé: ${product.name} x${quantity}`
          : `Achat: ${product.name} x${quantity}`;

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId: order.id,
      customerId,
      amount: finalAmountToPay,
      currency: product.currency,
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
        inventory_location: inventoryLocation,
        quantity,
        order_item_id: orderItem.id,
        shipping_address: shippingAddress,
        payment_type: paymentType,
        percentage_rate: paymentType === 'percentage' ? percentageRate : null,
        total_price: totalPrice,
        amount_paid: amountToPay,
        remaining_amount: remainingAmount,
        ...(guestCheckout ? { guest_checkout: true } : {}),
      },
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
      await releasePhysicalInventoryForOrder(order.id);
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
      inventoryId,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
      orderNumber: order.order_number,
    };
  }
}
