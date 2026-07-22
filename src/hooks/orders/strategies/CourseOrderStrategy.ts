import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import {
  asOptionalString,
  asOrderProduct,
  parseStrategyOptions,
} from '@/lib/orders/order-strategy-utils';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, payment_options';

export class CourseOrderStrategy implements OrderStrategy {
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
    const { giftCardId, giftCardAmount = 0 } = opts;

    let resolvedCourseId = asOptionalString(opts.courseId);
    if (!resolvedCourseId) {
      const { data } = await supabase
        .from('courses')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      resolvedCourseId = data?.id;
    }

    if (!resolvedCourseId) {
      throw new Error('Cours non trouvé');
    }

    // E2E local: bypass RLS + PSP dependencies (checkout stub).
    if (import.meta.env.DEV && import.meta.env.VITE_E2E_PAYMENT_STUB === 'true') {
      return {
        orderId: `e2e-order-${Date.now()}`,
        orderItemId: `e2e-item-${Date.now()}`,
        checkoutUrl: `/checkout?e2e=1&storeId=${encodeURIComponent(storeId)}&productId=${encodeURIComponent(productId)}&courseId=${encodeURIComponent(resolvedCourseId!)}`,
        transactionId: `e2e-tx-${Date.now()}`,
      };
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: existingEnrollment } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', resolvedCourseId)
        .eq('user_id', user.id)
        .single();

      if (existingEnrollment) {
        throw new Error('Vous êtes déjà inscrit à ce cours');
      }
    }

    let _finalUserId = user?.id;
    if (!user) {
      const { data: provisionData, error: provisionError } = await supabase.functions.invoke(
        'course-checkout-provisioning',
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
      _finalUserId = provisionData?.user_id;
    }

    // Création commande via RPC SECURITY DEFINER : les acheteurs n'ont pas le
    // droit d'INSERT direct sur orders (RLS).
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: rpcResult, error: orderError } = await supabase.rpc(
      // @ts-expect-error: RPC type not yet updated in supabase types
      'create_public_course_order',
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
        p_guest_checkout: guestCheckout ?? !user,
      }
    );

    if (orderError || !rpcResult) {
      logger.error('create_public_course_order failed', { error: orderError });
      throw new Error(
        `Erreur lors de la création de la commande: ${orderError?.message || 'Inconnue'}`
      );
    }

    const orderData = rpcResult as unknown as {
      order_id: string;
      order_item_id: string;
      order_number: string;
      customer_id: string;
      course_id: string;
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
      logger.error('Error creating invoice for course order', { error: invoiceError, orderId });
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

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId,
      customerId,
      amount: finalAmountToPay,
      currency: paymentCurrency,
      description: `Achat: ${product.name}`,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      returnUrl,
      cancelUrl,
      metadata: {
        product_type: 'course',
        order_item_id: orderItemId,
        course_id: resolvedCourseId,
        auto_enroll: true,
        ...(guestCheckout ? { guest_checkout: true } : {}),
      },
    });

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
