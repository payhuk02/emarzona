import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
// import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
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
      quantity = 1,
      productRecord,
      options,
    } = context;

    let product = productRecord;
    if (!product) {
      const { data, error } = await supabase.from('products').select(PRODUCT_FIELDS).eq('id', productId).single();
      if (error || !data) throw new Error('Produit non trouvé');
      product = data;
    }

    const {
      courseId,
      giftCardId,
      giftCardAmount = 0,
    } = options || {};

    let resolvedCourseId = courseId;
    if (!resolvedCourseId) {
      const { data } = await supabase.from('courses').select('id').eq('product_id', productId).maybeSingle();
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
        checkoutUrl: `/checkout?e2e=1&storeId=${encodeURIComponent(storeId)}&productId=${encodeURIComponent(productId)}&courseId=${encodeURIComponent(resolvedCourseId)}`,
        transactionId: `e2e-tx-${Date.now()}`,
      };
    }

    const paymentOptions = (product.payment_options as Record<string, unknown>) || { payment_type: 'full', percentage_rate: 30 };
    const paymentType = paymentOptions.payment_type || 'full';
    const percentageRate = paymentOptions.percentage_rate || 30;

    const { data: { user } } = await supabase.auth.getUser();
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

      if (provisionError) throw new Error(provisionError.message || "Impossible de finaliser l'achat invité.");
      if (provisionData?.error) throw new Error(provisionData.error);
      _finalUserId = provisionData?.user_id;
    }

    const customerId = await findOrCreateStoreCustomer({
      storeId,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      phone: customerPhone,
    });

    const basePrice = product.promotional_price || product.price;
    const totalPrice = basePrice * quantity;

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
      .insert({
        store_id: storeId,
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalPrice - (giftCardAmount || 0),
        currency: product.currency,
        payment_status: 'pending',
        status: 'pending',
        payment_type: paymentType,
        percentage_paid: percentagePaid,
        remaining_amount: remainingAmount,
        affiliate_tracking_cookie: affiliateTrackingCookie,
        metadata: {
          course_id: resolvedCourseId,
          course_name: product.name,
          auto_enroll: true,
        },
      })
      .select('id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at')
      .single();

    if (orderError || !order) {
      throw new Error('Erreur lors de la création de la commande');
    }

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        product_type: 'course',
        product_name: product.name,
        quantity,
        unit_price: basePrice,
        total_price: totalPrice - (giftCardAmount || 0),
      })
      .select('id')
      .single();

    if (orderItemError || !orderItem) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Erreur lors de la création de l'élément de commande: ${orderItemError.message}`);
    }

    if (giftCardId && giftCardAmount && giftCardAmount > 0) {
      try {
        await supabase.rpc('redeem_gift_card', {
          p_gift_card_id: giftCardId,
          p_order_id: order.id,
          p_amount: giftCardAmount,
        });
      } catch (_giftCardErr) { /* ignore */ }
    }

    import('@/lib/webhooks').then(({ triggerOrderCreatedWebhook }) => {
      triggerOrderCreatedWebhook(order.id, order).catch(() => {});
    });

    const { isSupportedCurrency } = await import('@/lib/currency-converter');
    type Currency = 'XOF' | 'EUR' | 'USD' | 'GBP' | 'NGN' | 'GHS' | 'KES' | 'ZAR';
    const paymentCurrency: Currency = isSupportedCurrency(product.currency)
      ? (product.currency as Currency)
      : 'XOF';

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId: order.id,
      customerId,
      amount: finalAmountToPay,
      currency: paymentCurrency,
      description: `Achat: ${product.name}`,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      metadata: {
        product_type: 'course',
        order_item_id: orderItem.id,
        course_id: resolvedCourseId,
        auto_enroll: true,
      },
    });

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
