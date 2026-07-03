import { supabase } from '@/integrations/supabase/client';
import { initiatePayment } from '@/lib/payment-service';
import { getAffiliateTrackingCookie } from '@/hooks/useAffiliateTracking';
import { logger } from '@/lib/logger';
import { findOrCreateStoreCustomer } from '@/lib/orders/customers-data';
import { generateOrderNumber } from '@/lib/orders/orders-data';
import { OrderStrategy, OrderStrategyContext, OrderCreationResult } from './OrderStrategy';

const PRODUCT_FIELDS = 'id, name, price, promotional_price, currency, product_type';

export class GenericOrderStrategy implements OrderStrategy {
  async createOrder(context: OrderStrategyContext): Promise<OrderCreationResult> {
    const {
      productId,
      storeId,
      customerEmail,
      customerName,
      customerPhone,
      quantity = 1,
      productType = 'generic',
      productRecord,
    } = context;

    let product = productRecord;
    if (!product) {
      const { data, error } = await supabase.from('products').select(PRODUCT_FIELDS).eq('id', productId).single();
      if (error || !data) throw new Error('Produit non trouvé');
      product = data;
    }

    const customerId = await findOrCreateStoreCustomer({
      storeId,
      email: customerEmail,
      name: customerName || customerEmail.split('@')[0],
      phone: customerPhone,
    });

    const orderNumber = await generateOrderNumber();
    const totalPrice = (product.promotional_price || product.price) * quantity;
    const affiliateTrackingCookie = getAffiliateTrackingCookie();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        store_id: storeId,
        customer_id: customerId,
        order_number: orderNumber,
        total_amount: totalPrice,
        currency: product.currency,
        payment_status: 'pending',
        status: 'pending',
        affiliate_tracking_cookie: affiliateTrackingCookie,
        metadata: {
          product_id: productId,
          product_type: productType,
          flow: 'generic_product_checkout',
        },
      })
      .select('id, store_id, customer_id, order_number, total_amount, currency, status, payment_status, created_at')
      .single();

    if (orderError || !order) {
      throw new Error('Erreur lors de la création de la commande');
    }

    import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
      triggerWebhook(order.store_id, 'order.created', {
        order_id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        currency: order.currency,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
      }).catch(err => {
        logger.error('Error triggering webhook', { error: err, orderId: order.id });
      });
    });

    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: productId,
        product_type: productType === 'generic' ? 'generic' : productType,
        product_name: product.name,
        quantity,
        unit_price: product.promotional_price || product.price,
        total_price: totalPrice,
        item_metadata: {
          product_type: productType,
          source: 'useCreateOrder_generic',
        },
      })
      .select('id')
      .single();

    if (orderItemError || !orderItem) {
      throw new Error("Erreur lors de la création de l'élément de commande");
    }

    const paymentResult = await initiatePayment({
      storeId,
      productId,
      orderId: order.id,
      customerId,
      amount: totalPrice,
      currency: product.currency,
      description: `Achat: ${product.name}`,
      customerEmail,
      customerName: customerName || customerEmail.split('@')[0],
      customerPhone,
      metadata: {
        product_type: productType,
        order_item_id: orderItem.id,
      },
    });

    if (!paymentResult.success || !paymentResult.checkout_url) {
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
