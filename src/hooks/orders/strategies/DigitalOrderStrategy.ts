import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import { validateCheckoutPromotion } from '@/lib/checkout/promotion';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency';

async function generateLicenseKeyViaRpc(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_license_key');
  if (error || !data) {
    logger.error('generate_license_key RPC failed', { error });
    throw new Error('Erreur lors de la génération de la clé de licence');
  }
  return data as string;
}

export class DigitalOrderStrategy implements OrderStrategy {
  async createOrder(context: OrderStrategyContext): Promise<OrderCreationResult> {
    const {
      productId,
      storeId,
      customerEmail,
      customerName,
      customerPhone,
      productRecord,
      options,
      returnUrl,
      cancelUrl,
      guestCheckout,
    } = context;

    // Resolve digital product details if productRecord was missing
    let product = productRecord;
    if (!product) {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('id', productId)
        .single();
      if (error || !data) throw new Error('Produit non trouvé');
      product = data;
    }

    const {
      digitalProductId,
      generateLicense = true,
      licenseType = 'single',
      maxActivations = 1,
      licenseExpiryDays,
      giftCardId,
      giftCardAmount = 0,
      couponCode,
      couponDiscountAmount = 0,
      promotionId,
    } = options || {};

    let resolvedDigitalProductId = digitalProductId;
    if (!resolvedDigitalProductId) {
      const { data } = await supabase
        .from('digital_products')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      resolvedDigitalProductId = data?.id;
    }

    if (!resolvedDigitalProductId) {
      throw new Error('Produit digital non trouvé');
    }

    const customerId = await findOrCreateStoreCustomer({
      storeId,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      phone: customerPhone,
    });

    let licenseId: string | undefined;
    if (generateLicense) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const expiresAt = licenseExpiryDays
          ? new Date(Date.now() + licenseExpiryDays * 24 * 60 * 60 * 1000).toISOString()
          : null;

        const { data: license, error: licenseError } = await supabase
          .from('digital_licenses')
          .insert({
            digital_product_id: resolvedDigitalProductId,
            user_id: user.id,
            license_key: await generateLicenseKeyViaRpc(),
            license_type: licenseType,
            max_activations: licenseType === 'unlimited' ? -1 : maxActivations,
            current_activations: 0,
            expires_at: expiresAt,
            status: 'pending',
            customer_email: customerEmail,
            customer_name: customerName || customerEmail.split('@')[0],
          })
          .select('id')
          .single();

        if (licenseError || !license) {
          logger.error('License creation error', { error: licenseError, resolvedDigitalProductId });
          throw new Error('Erreur lors de la génération de la licence');
        }
        licenseId = license.id;
      } else {
        const { data, error: functionError } = await supabase.functions.invoke(
          'guest-checkout-provisioning',
          {
            body: {
              email: customerEmail,
              customerName: customerName,
              digitalProductId: resolvedDigitalProductId,
              licenseType: licenseType,
              maxActivations: maxActivations,
              licenseExpiryDays: licenseExpiryDays,
            },
          }
        );

        if (functionError) {
          logger.error('Guest checkout provisioning error', { error: functionError });
          throw new Error(
            functionError.message || "Impossible de générer la licence pour l'invité"
          );
        }
        if (data?.error) throw new Error(data.error);
        if (!data?.success || !data?.license_id)
          throw new Error("Erreur inattendue lors de l'auto-provisioning");
        licenseId = data.license_id;
      }
    }

    const baseAmount = Number(product.promotional_price ?? product.price);
    let promoDiscount = Math.max(0, couponDiscountAmount || 0);
    let resolvedPromotionId = promotionId;

    if (couponCode?.trim() && promoDiscount <= 0) {
      const validation = await validateCheckoutPromotion({
        code: couponCode,
        storeId,
        productIds: [productId],
        orderAmount: baseAmount,
        customerId,
      });
      if (!validation.valid) throw new Error(validation.message);
      promoDiscount = validation.promotion.discountAmount;
      resolvedPromotionId = validation.promotion.promotionId;
    }

    const finalAmount = Math.max(0, baseAmount - promoDiscount - (giftCardAmount || 0));
    const orderNumber = await generateOrderNumber();
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        customer_email: customerEmail,
        order_number: orderNumber,
        total_amount: finalAmount,
        currency: product.currency,
        payment_status: 'pending',
        status: 'pending',
        affiliate_tracking_cookie: affiliateTrackingCookie,
        metadata: guestCheckout ? { guest_checkout: true } : undefined,
      })
      .select(
        'id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at'
      )
      .single();

    if (orderError || !order) {
      throw new Error('Erreur lors de la création de la commande');
    }

    if (giftCardId && giftCardAmount && giftCardAmount > 0) {
      try {
        await supabase.rpc('redeem_gift_card', {
          p_gift_card_id: giftCardId,
          p_order_id: order.id,
          p_amount: giftCardAmount,
        });
      } catch (giftCardError) {
        logger.error('Error in gift card redemption:', { error: giftCardError });
      }
    }

    try {
      await supabase.rpc('create_invoice_from_order', { p_order_id: order.id });
    } catch (_invoiceErr) {
      /* ignore */
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(order.id, order).catch(() => {});
    });

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        product_type: 'digital',
        digital_product_id: resolvedDigitalProductId,
        license_id: licenseId,
        product_name: product.name,
        quantity: 1,
        unit_price: product.promotional_price || product.price,
        total_price: product.promotional_price || product.price,
        item_metadata: {
          license_generated: !!licenseId,
          license_type: licenseType,
        },
      })
      .select('id')
      .single();

    if (orderItemError || !orderItem) {
      throw new Error("Erreur lors de la création de l'élément de commande");
    }

    if (promoDiscount > 0 && resolvedPromotionId) {
      await supabase.from('promotion_usage').insert({
        promotion_id: resolvedPromotionId,
        order_id: order.id,
        customer_id: customerId,
        discount_amount: promoDiscount,
        order_total_before_discount: baseAmount,
        order_total_after_discount: finalAmount,
      });
    }

    const paymentCurrency: Currency = isSupportedCurrency(String(product.currency ?? 'XOF'))
      ? (product.currency as Currency)
      : 'XOF';

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId: order.id,
      customerId,
      amount: finalAmount,
      currency: paymentCurrency,
      description: `Achat: ${product.name}`,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      returnUrl,
      cancelUrl,
      metadata: {
        product_type: 'digital',
        digital_product_id: resolvedDigitalProductId,
        license_id: licenseId,
        order_item_id: orderItem.id,
        ...(guestCheckout ? { guest_checkout: true } : {}),
      },
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
      licenseId,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
    };
  }
}
