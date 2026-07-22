import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { isSupportedCurrency, type Currency } from '@/lib/currency-converter';
import {
  asOptionalString,
  asOrderProduct,
  parseStrategyOptions,
} from '@/lib/orders/order-strategy-utils';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency';

/**
 * Checkout digital via RPC SECURITY DEFINER (`create_public_digital_order`).
 * Les INSERT directs sur `orders` sont bloqués par RLS pour les acheteurs
 * (invités ou connectés) — la RPC calcule le montant côté serveur.
 * Les licences sont générées au paiement (trigger fulfill_digital_order_items_on_paid).
 */
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

    let product = productRecord ? asOrderProduct(productRecord) : undefined;
    if (!product) {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_FIELDS)
        .eq('id', productId)
        .single();
      if (error || !data) throw new Error('Produit non trouvé');
      product = asOrderProduct(data);
    }

    const opts = parseStrategyOptions(options);
    const {
      generateLicense = true,
      licenseType = 'single',
      maxActivations = 1,
      licenseExpiryDays,
      giftCardId,
      giftCardAmount = 0,
      couponCode,
    } = opts;

    let resolvedDigitalProductId = asOptionalString(opts.digitalProductId);
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isGuest = guestCheckout ?? !user;

    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    // Signature compatible avec la RPC prod actuelle (sans p_license_id).
    // Les licences sont créées au paiement par le trigger SQL.
    const { data: rpcResult, error: orderError } = await supabase.rpc(
      // @ts-expect-error: RPC type not yet updated in supabase types
      'create_public_digital_order',
      {
        p_product_id: productId,
        p_store_id: storeId,
        p_customer_email: customerEmail,
        p_customer_name: customerName || customerEmail.split('@')[0],
        p_customer_phone: customerPhone ?? null,
        p_generate_license: generateLicense,
        p_license_type: licenseType,
        p_max_activations: maxActivations,
        p_license_expiry_days: licenseExpiryDays ?? null,
        p_gift_card_id: giftCardId ?? null,
        p_gift_card_amount_requested: giftCardAmount || 0,
        p_coupon_code: couponCode?.trim() || null,
        p_affiliate_tracking_cookie: affiliateTrackingCookie,
        p_guest_checkout: isGuest,
      }
    );

    if (orderError || !rpcResult) {
      logger.error('create_public_digital_order failed', { error: orderError });
      throw new Error(
        `Erreur lors de la création de la commande: ${orderError?.message || 'Inconnue'}`
      );
    }

    const orderData = rpcResult as unknown as {
      order_id: string;
      order_item_id: string;
      order_number: string;
      customer_id: string;
      digital_product_id: string;
      total_amount: number;
      checkout_token?: string | null;
    };

    const orderId = orderData.order_id;
    const orderItemId = orderData.order_item_id;
    const customerId = orderData.customer_id;
    const finalAmount = Number(orderData.total_amount) || 0;
    const checkoutToken = orderData.checkout_token || undefined;

    try {
      const { error: invoiceError } = await supabase.rpc('create_invoice_from_order', {
        p_order_id: orderId,
      });
      if (invoiceError) {
        logger.error('Error creating invoice for digital order', { error: invoiceError, orderId });
      }
    } catch (invoiceErr) {
      logger.error('Error creating invoice for digital order', { error: invoiceErr, orderId });
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(orderId, {
        store_id: storeId,
        customer_id: customerId,
        order_number: orderData.order_number,
        status: 'pending',
        total_amount: finalAmount,
        currency: product.currency,
        payment_status: 'pending',
        created_at: new Date().toISOString(),
      }).catch(() => {});
    });

    const paymentCurrency: Currency = isSupportedCurrency(product.currency)
      ? (product.currency as Currency)
      : 'XOF';

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId,
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
        order_id: orderId,
        order_number: orderData.order_number,
        digital_product_id: orderData.digital_product_id || resolvedDigitalProductId,
        order_item_id: orderItemId,
        ...(checkoutToken ? { checkout_token: checkoutToken } : {}),
        ...(isGuest ? { guest_checkout: true } : {}),
      },
      checkoutToken,
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
      throw new Error(paymentResult.error || "Erreur lors de l'initialisation du paiement");
    }

    return {
      orderId,
      orderItemId,
      licenseId: undefined,
      checkoutUrl: paymentResult.checkout_url,
      transactionId: paymentResult.transaction_id,
    };
  }
}
