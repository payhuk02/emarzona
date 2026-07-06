import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
// import { logger } from '@/lib/logger';
import { retryWithExponentialBackoff } from '@/lib/retry-utils';
import { reserveArtistLimitedEdition } from '@/lib/artist-edition-reservation';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import {
  asOptionalString,
  asOrderProduct,
  asOrdersInsert,
  parsePaymentOptions,
  parseStrategyOptions,
  resolveUnitPrice,
} from '@/lib/orders/order-strategy-utils';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';
const ARTIST_PRODUCT_FIELDS =
  'id, artist_name, artwork_title, artwork_year, artwork_edition_type, edition_number, total_editions, requires_shipping, certificate_of_authenticity, signature_authenticated, shipping_fragile, shipping_insurance_required, shipping_insurance_amount, version';

export class ArtistOrderStrategy implements OrderStrategy {
  async createOrder(context: OrderStrategyContext): Promise<OrderCreationResult> {
    const {
      productId,
      storeId,
      customerEmail,
      customerName,
      customerPhone,
      quantity = 1,
      productRecord,
      options,
      returnUrl,
      cancelUrl,
      guestCheckout,
    } = context;

    let product = productRecord ? asOrderProduct(productRecord) : undefined;
    if (!product) {
      product = asOrderProduct(
        await retryWithExponentialBackoff(
          async () => {
            const { data, error } = await supabase
              .from('products')
              .select(PRODUCT_FIELDS)
              .eq('id', productId)
              .single();
            if (error) throw error;
            if (!data) throw new Error('Produit non trouvé');
            return data;
          },
          {
            maxRetries: 3,
            initialDelay: 1000,
            shouldRetry: error => {
              if (error instanceof Error) {
                const msg = error.message.toLowerCase();
                return msg.includes('network') || msg.includes('timeout') || msg.includes('fetch');
              }
              return false;
            },
          }
        )
      );
    }

    const opts = parseStrategyOptions(options);
    const { shippingAddress, giftCardId, giftCardAmount = 0 } = opts;

    let resolvedArtistProductId = asOptionalString(opts.artistProductId);
    if (!resolvedArtistProductId) {
      const { data } = await supabase
        .from('artist_products')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      resolvedArtistProductId = data?.id;
    }

    if (!resolvedArtistProductId) {
      throw new Error("Œuvre d'artiste non trouvée");
    }

    if (import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true') {
      return {
        orderId: `e2e-order-${Date.now()}`,
        orderItemId: `e2e-item-${Date.now()}`,
        checkoutUrl: `/checkout?e2e=1&storeId=${encodeURIComponent(storeId)}&productId=${encodeURIComponent(productId)}&artistProductId=${encodeURIComponent(resolvedArtistProductId!)}`,
        transactionId: `e2e-tx-${Date.now()}`,
      };
    }

    const { payment_type: paymentType, percentage_rate: percentageRate } = parsePaymentOptions(
      product.payment_options
    );

    const { data: artistProduct, error: artistError } = await supabase
      .from('artist_products')
      .select(ARTIST_PRODUCT_FIELDS)
      .eq('id', resolvedArtistProductId)
      .single();

    if (artistError || !artistProduct) {
      throw new Error("Œuvre d'artiste non trouvée");
    }

    await reserveArtistLimitedEdition(productId, quantity);

    if (artistProduct.requires_shipping && !shippingAddress) {
      throw new Error('Adresse de livraison requise pour cette œuvre');
    }

    const { data: authData } = await supabase.auth.getUser();
    let finalUserId = authData?.user?.id;

    if (!finalUserId) {
      const { data: provisionData, error: provisionError } = await supabase.functions.invoke(
        'artist-checkout-provisioning',
        {
          body: {
            email: customerEmail,
            customerName: customerName,
            userId: null,
          },
        }
      );

      if (provisionError)
        throw new Error(provisionError.message || "Impossible de finaliser l'achat invité.");
      if (provisionData?.error) throw new Error(provisionData.error);
      finalUserId = provisionData?.user_id;
    }

    const customerId = await findOrCreateStoreCustomer({
      storeId,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      phone: customerPhone,
    });

    const basePrice = resolveUnitPrice(product);
    let totalPrice = basePrice * quantity;

    if (artistProduct.shipping_insurance_required && artistProduct.shipping_insurance_amount) {
      totalPrice += artistProduct.shipping_insurance_amount;
    }

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
    const orderNumber = await generateOrderNumber();
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(
        asOrdersInsert({
          store_id: storeId,
          customer_id: customerId,
          customer_email: customerEmail,
          order_number: orderNumber,
          total_amount: totalPrice - (giftCardAmount || 0),
          currency: product.currency,
          payment_status: 'pending',
          status: 'pending',
          delivery_status: artistProduct.requires_shipping ? 'pending' : null,
          payment_type: paymentType,
          percentage_paid: percentagePaid,
          remaining_amount: remainingAmount,
          affiliate_tracking_cookie: affiliateTrackingCookie,
          metadata: {
            artist_name: artistProduct.artist_name,
            artwork_title: artistProduct.artwork_title,
            artwork_year: artistProduct.artwork_year,
            edition_type: artistProduct.artwork_edition_type,
            edition_number: artistProduct.edition_number,
            certificate_of_authenticity: artistProduct.certificate_of_authenticity,
            signature_authenticated: artistProduct.signature_authenticated,
            shipping_fragile: artistProduct.shipping_fragile,
            shipping_insurance_required: artistProduct.shipping_insurance_required,
            shipping_insurance_amount: artistProduct.shipping_insurance_amount,
            ...(guestCheckout ? { guest_checkout: true } : {}),
          },
        })
      )
      .select(
        'id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at'
      )
      .single();

    if (orderError || !order) {
      throw new Error('Erreur lors de la création de la commande');
    }

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        product_type: 'artist',
        product_name: product.name,
        quantity,
        unit_price: basePrice,
        total_price: totalPrice - (giftCardAmount || 0),
      })
      .select('id')
      .single();

    if (orderItemError || !orderItem) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Erreur lors de la création de l'élément de commande`);
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(order.id, order).catch(() => {});
    });

    if (giftCardId && giftCardAmount > 0) {
      try {
        await supabase.rpc('redeem_gift_card', {
          p_gift_card_id: giftCardId,
          p_order_id: order.id,
          p_amount: giftCardAmount,
        });
      } catch (_giftCardErr) {
        /* non bloquant */
      }
    }

    const { isSupportedCurrency } = await import('@/lib/currency-converter');
    type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';
    const paymentCurrency: Currency = isSupportedCurrency(product.currency)
      ? (product.currency as Currency)
      : 'XOF';

    const paymentResult = await retryWithExponentialBackoff(
      async () => {
        return await initiatePayment({
          storeId,
          productId,
          orderId: order.id,
          customerId,
          amount: finalAmountToPay,
          currency: paymentCurrency,
          description: `Achat: ${product.name}${artistProduct.artwork_title ? ` - ${artistProduct.artwork_title}` : ''}`,
          customerEmail,
          customerName: customerName || customerEmail.split('@')[0],
          customerPhone,
          returnUrl,
          cancelUrl,
          metadata: {
            product_type: 'artist',
            order_item_id: orderItem.id,
            artist_product_id: resolvedArtistProductId,
            shipping_fragile: artistProduct.shipping_fragile,
            shipping_insurance_required: artistProduct.shipping_insurance_required,
            ...(guestCheckout ? { guest_checkout: true } : {}),
          },
        });
      },
      {
        maxRetries: 3,
        initialDelay: 2000,
        shouldRetry: error => {
          if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            return (
              msg.includes('network') ||
              msg.includes('timeout') ||
              msg.includes('fetch') ||
              msg.includes('503') ||
              msg.includes('502')
            );
          }
          return false;
        },
      }
    );

    if (!paymentResult.success || !paymentResult.checkout_url) {
      await supabase.from('order_items').delete().eq('id', orderItem.id);
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId: order.id,
      orderItemId: orderItem.id,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
    };
  }
}
