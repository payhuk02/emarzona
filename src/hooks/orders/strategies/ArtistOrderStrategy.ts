import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { retryWithExponentialBackoff } from '@/lib/retry-utils';
import { reserveArtistLimitedEdition } from '@/lib/artist-edition-reservation';
import {
  asOptionalString,
  asOrderProduct,
  parseStrategyOptions,
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

    // Création commande via RPC SECURITY DEFINER : les acheteurs n'ont pas le
    // droit d'INSERT direct sur orders (RLS).
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: rpcResult, error: orderError } = await supabase.rpc(
      // @ts-expect-error: RPC type not yet updated in supabase types
      'create_public_artist_order',
      {
        p_product_id: productId,
        p_store_id: storeId,
        p_customer_email: customerEmail,
        p_customer_name: customerName || customerEmail.split('@')[0],
        p_customer_phone: customerPhone ?? null,
        p_gift_card_id: giftCardId ?? null,
        p_gift_card_amount_requested: giftCardAmount || 0,
        p_coupon_code: null,
        p_affiliate_tracking_cookie: affiliateTrackingCookie,
        p_guest_checkout: guestCheckout ?? !authData?.user?.id,
      }
    );

    if (orderError || !rpcResult) {
      logger.error('create_public_artist_order failed', { error: orderError });
      throw new Error(
        `Erreur lors de la création de la commande: ${orderError?.message || 'Inconnue'}`
      );
    }

    const orderData = rpcResult as unknown as {
      order_id: string;
      order_item_id: string;
      order_number: string;
      customer_id: string;
      total_amount: number;
    };

    const orderId = orderData.order_id;
    const orderItemId = orderData.order_item_id;
    const customerId = orderData.customer_id;
    const finalAmountToPay = Number(orderData.total_amount) || 0;

    const { error: invoiceError } = await supabase.rpc('create_invoice_from_order', {
      p_order_id: orderId,
    });
    if (invoiceError) {
      logger.error('Error creating invoice for artist order', { error: invoiceError, orderId });
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(orderId, {
        store_id: storeId,
        customer_id: customerId,
        order_number: orderData.order_number,
        status: 'pending',
        total_amount: finalAmountToPay,
        currency: product.currency,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      }).catch(() => {});
    });

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
          orderId,
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
            order_item_id: orderItemId,
            artist_product_id: resolvedArtistProductId,
            shipping_fragile: artistProduct.shipping_fragile,
            shipping_insurance_required: artistProduct.shipping_insurance_required,
            ...(shippingAddress ? { shipping_address: shippingAddress } : {}),
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
      throw new Error("Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId,
      orderItemId,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
    };
  }
}
