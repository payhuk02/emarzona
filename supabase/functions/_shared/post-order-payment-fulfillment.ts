/**
 * Fulfillment post-paiement unifié (Stripe, futur PayPal, etc.)
 * Aligné sur geniuspay-webhook : bookings, certificats artiste, emails, webhooks store.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logArtistFulfillmentEvent } from './artist-fulfillment-observability.ts';
import { triggerEmailWorkflowsForEvent } from './workflow-executor.ts';
import { triggerSequenceEnrollmentsForEvent } from './sequence-enrollment-utils.ts';

const ORDER_SELECT =
  'id, store_id, order_number, customer_id, total_amount, currency, status, payment_status, created_at, metadata, customer_email, shipping_address, expected_delivery_date, tracking_number, tracking_link';

function parseOrderMetadata(metadata: unknown): Record<string, unknown> {
  if (metadata == null) return {};
  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function parseOrderItemMetadata(item: {
  item_metadata?: unknown;
  metadata?: unknown;
}): Record<string, unknown> {
  const raw = item.item_metadata ?? item.metadata;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

async function sendOrderConfirmationEmail(
  supabase: SupabaseClient,
  order: Record<string, unknown>
): Promise<void> {
  try {
    const orderId = order.id as string;
    let customerEmail = order.customer_email as string | undefined;
    let customerName = (order.customer_name as string) || 'Client';
    const customerId = order.customer_id as string | undefined;

    if (!customerEmail && customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('email, name, full_name')
        .eq('id', customerId)
        .single();
      if (customer) {
        customerEmail = customer.email ?? undefined;
        customerName = customer.full_name || customer.name || 'Client';
      }
    }

    if (!customerEmail) {
      console.warn(`Cannot send confirmation email for order ${orderId}: no email`);
      return;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) return;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseServiceKey}`,
        ...(Deno.env.get('EDGE_INTERNAL_SECRET')
          ? { 'x-internal-secret': Deno.env.get('EDGE_INTERNAL_SECRET')! }
          : {}),
      },
      body: JSON.stringify({
        order_id: orderId,
        customer_email: customerEmail,
        customer_name: customerName,
        customer_id: customerId,
      }),
    });

    if (!response.ok) {
      console.error(`send-order-confirmation-email failed for ${orderId}:`, await response.text());
    }
  } catch (error) {
    console.error('sendOrderConfirmationEmail error:', error);
  }
}

async function confirmServiceBookings(
  supabase: SupabaseClient,
  order: Record<string, unknown>
): Promise<void> {
  const orderId = order.id as string;
  const storeId = order.store_id as string;
  const orderNumber = order.order_number;

  const { data: serviceOrderItems, error } = await supabase
    .from('order_items')
    .select('id, booking_id, product_type')
    .eq('order_id', orderId)
    .eq('product_type', 'service')
    .not('booking_id', 'is', null);

  if (error || !serviceOrderItems?.length) return;

  for (const item of serviceOrderItems) {
    if (!item.booking_id) continue;

    const { error: bookingUpdateError } = await supabase
      .from('service_bookings')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', item.booking_id)
      .eq('status', 'pending');

    if (bookingUpdateError) {
      console.error(`Error confirming booking ${item.booking_id}:`, bookingUpdateError);
      continue;
    }

    await supabase
      .rpc('trigger_webhook', {
        p_store_id: storeId,
        p_event_type: 'service.booking_confirmed',
        p_payload: {
          booking_id: item.booking_id,
          order_id: orderId,
          order_number: orderNumber,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        },
      })
      .then(null, (err: unknown) => console.error('service.booking_confirmed webhook:', err));
  }
}

async function processArtistOrderItems(
  supabase: SupabaseClient,
  order: Record<string, unknown>,
  transactionId: string,
  paymentProvider: string
): Promise<void> {
  const orderId = order.id as string;
  const customerId = order.customer_id as string;
  const orderNumber = order.order_number;

  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('id, product_id, product_type, item_metadata')
    .eq('order_id', orderId)
    .eq('product_type', 'artist');

  if (itemsError || !orderItems?.length) return;

  const { data: customer } = await supabase
    .from('customers')
    .select('id, user_id')
    .eq('id', customerId)
    .single();

  const { data: transaction } = await supabase
    .from('transactions')
    .select('customer_id')
    .eq('id', transactionId)
    .maybeSingle();

  const userId = customer?.user_id || transaction?.customer_id;
  if (!userId) return;

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) return;

  for (const item of orderItems) {
    try {
      const metadata = parseOrderItemMetadata(item);
      const artistProductId = metadata.artist_product_id as string | undefined;
      if (!artistProductId) continue;

      const { data: artistProduct } = await supabase
        .from('artist_products')
        .select(
          'certificate_of_authenticity, artwork_edition_type, store_id, artist_name, artwork_title'
        )
        .eq('id', artistProductId)
        .single();

      const shouldGenerate =
        artistProduct &&
        (artistProduct.certificate_of_authenticity === true ||
          artistProduct.artwork_edition_type === 'limited_edition');

      if (shouldGenerate) {
        const edgeInternalSecret = Deno.env.get('EDGE_INTERNAL_SECRET');
        if (!edgeInternalSecret) {
          console.error('generate-artist-certificate: EDGE_INTERNAL_SECRET is not configured');
          await logArtistFulfillmentEvent(supabase, {
            event_type: 'certificate.config_missing',
            severity: 'error',
            order_id: orderId,
            product_id: item.product_id as string,
            artist_product_id: artistProductId,
            message: 'EDGE_INTERNAL_SECRET is not configured',
          });
        } else {
          const certHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
            'x-internal-secret': edgeInternalSecret,
          };

          const certResponse = await fetch(
            `${supabaseUrl}/functions/v1/generate-artist-certificate`,
            {
              method: 'POST',
              headers: certHeaders,
              body: JSON.stringify({
                order_id: orderId,
                order_item_id: item.id,
                product_id: item.product_id,
                artist_product_id: artistProductId,
                user_id: userId,
              }),
            }
          );

          if (!certResponse.ok) {
            const errText = await certResponse.text();
            console.error('generate-artist-certificate:', errText);
            await logArtistFulfillmentEvent(supabase, {
              event_type: 'certificate.generation_failed',
              severity: 'error',
              order_id: orderId,
              product_id: item.product_id as string,
              artist_product_id: artistProductId,
              message: errText.slice(0, 500),
              metadata: { http_status: certResponse.status },
            });
          } else {
            await logArtistFulfillmentEvent(supabase, {
              event_type: 'certificate.generation_ok',
              severity: 'info',
              order_id: orderId,
              product_id: item.product_id as string,
              artist_product_id: artistProductId,
            });
          }
        }
      }

      if (artistProduct?.store_id) {
        const { data: buyerInfo } = await supabase
          .from('customers')
          .select('name, full_name, email')
          .eq('id', customerId)
          .single();

        const { data: storeInfo } = await supabase
          .from('stores')
          .select('name')
          .eq('id', artistProduct.store_id)
          .single();

        const buyerName =
          buyerInfo?.full_name || buyerInfo?.name || (order.customer_email as string) || 'Acheteur';

        const { error: provenanceError } = await supabase.from('artwork_provenance').insert({
          product_id: item.product_id,
          store_id: artistProduct.store_id,
          provenance_type: 'ownership',
          event_date: new Date().toISOString().split('T')[0],
          previous_owner_name: storeInfo?.name || 'Vendeur',
          current_owner_id: userId,
          current_owner_name: buyerName,
          description: `Transfert de propriété suite à la vente - Commande #${orderNumber || orderId}`,
          is_verified: true,
          metadata: {
            order_id: orderId,
            order_item_id: item.id,
            transaction_id: transactionId,
            payment_provider: paymentProvider,
            purchase_date: new Date().toISOString(),
          },
        });

        if (provenanceError) {
          console.error('artwork_provenance insert:', provenanceError);
        }
      }
    } catch (itemErr) {
      console.error('artist item fulfillment:', itemErr);
    }
  }
}

async function triggerStoreWebhooks(
  supabase: SupabaseClient,
  order: Record<string, unknown>,
  transaction: Record<string, unknown>
): Promise<void> {
  const storeId = order.store_id as string;

  await supabase
    .rpc('trigger_webhook', {
      p_store_id: storeId,
      p_event_type: 'order.completed',
      p_payload: {
        order_id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        total_amount: order.total_amount,
        currency: order.currency,
        status: 'confirmed',
        payment_status: 'paid',
        created_at: order.created_at,
      },
    })
    .then(null, (err: unknown) => console.error('order.completed webhook:', err));

  await supabase
    .rpc('trigger_webhook', {
      p_store_id: storeId,
      p_event_type: 'payment.completed',
      p_payload: {
        transaction_id: transaction.id,
        order_id: order.id,
        order_number: order.order_number,
        amount: transaction.amount,
        currency: transaction.currency,
        payment_method: transaction.payment_provider || 'stripe_connect',
        customer_id: order.customer_id,
      },
    })
    .then(null, (err: unknown) => console.error('payment.completed webhook:', err));
}

async function checkMultiStoreGroup(
  supabase: SupabaseClient,
  order: Record<string, unknown>
): Promise<void> {
  const metadata = order.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return;
  const meta = metadata as Record<string, unknown>;
  if (meta.multi_store !== true || !meta.group_id) return;

  await supabase
    .rpc('check_and_notify_multi_store_group_completion', { p_order_id: order.id })
    .then(null, (err: unknown) => console.error('multi-store group check:', err));
}

async function triggerMarketingWorkflowsAfterOrder(
  supabase: SupabaseClient,
  order: Record<string, unknown>,
  transaction: { amount?: number; customer_id?: string } | null
): Promise<void> {
  const storeId = order.store_id as string | undefined;
  if (!storeId) return;

  let email = order.customer_email as string | undefined;
  let customerName = (order.customer_name as string) || 'Client';
  const customerId = order.customer_id as string | undefined;
  let guestCheckout = false;

  if (!email && customerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('email, name, full_name, user_id')
      .eq('id', customerId)
      .maybeSingle();
    if (customer) {
      email = customer.email ?? undefined;
      customerName = customer.full_name || customer.name || customerName;
      guestCheckout = !customer.user_id;
    }
  }

  const orderMeta = parseOrderMetadata(order.metadata);
  if (!email && typeof orderMeta.customer_email === 'string') {
    email = orderMeta.customer_email;
  }
  if (orderMeta.guest_checkout === true) {
    guestCheckout = true;
  }

  const context = {
    store_id: storeId,
    order_id: order.id as string,
    customer_id: customerId,
    email,
    customer_name: customerName,
    order_total: (order.total_amount ?? transaction?.amount) as number | undefined,
    currency: order.currency as string | undefined,
    guest_checkout: guestCheckout,
  };

  const events = ['order.paid', 'order.completed'];
  for (const event of events) {
    try {
      const result = await triggerEmailWorkflowsForEvent(supabase, storeId, event, context);
      if (result.triggered > 0) {
        console.log(
          `Email workflows [${event}]: ${result.succeeded}/${result.triggered} succeeded for order ${order.id}`
        );
      }
    } catch (err) {
      console.error(`triggerEmailWorkflowsForEvent ${event}:`, err);
    }

    try {
      const seqResult = await triggerSequenceEnrollmentsForEvent(
        supabase,
        storeId,
        event,
        context
      );
      if (seqResult.triggered > 0) {
        console.log(
          `Email sequences [${event}]: ${seqResult.enrolled}/${seqResult.triggered} enrolled for order ${order.id}`
        );
      }
    } catch (err) {
      console.error(`triggerSequenceEnrollmentsForEvent ${event}:`, err);
    }
  }
}

/**
 * Exécute le fulfillment métier après passage commande en paid.
 * Les triggers SQL (digital licenses, course enrollment) restent actifs sur UPDATE orders.
 */
export async function runPostOrderPaymentFulfillment(
  supabase: SupabaseClient,
  orderId: string,
  transactionId: string
): Promise<void> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('runPostOrderPaymentFulfillment: order not found', orderId);
    return;
  }

  const orderMetadata = parseOrderMetadata((order as Record<string, unknown>).metadata);
  if (orderMetadata.post_payment_fulfillment_at) {
    console.log(
      `Post-payment fulfillment already completed for order ${orderId} at ${orderMetadata.post_payment_fulfillment_at}`
    );
    return;
  }

  const { data: transaction } = await supabase
    .from('transactions')
    .select('id, amount, currency, payment_provider, customer_id')
    .eq('id', transactionId)
    .single();

  if (transaction) {
    await triggerStoreWebhooks(supabase, order as Record<string, unknown>, transaction);
  }

  await confirmServiceBookings(supabase, order as Record<string, unknown>);
  await checkMultiStoreGroup(supabase, order as Record<string, unknown>);
  await sendOrderConfirmationEmail(supabase, order as Record<string, unknown>);
  await triggerMarketingWorkflowsAfterOrder(
    supabase,
    order as Record<string, unknown>,
    transaction
  );
  const paymentProvider = (transaction?.payment_provider as string) || 'geniuspay_platform';
  await processArtistOrderItems(
    supabase,
    order as Record<string, unknown>,
    transactionId,
    paymentProvider
  );

  await supabase
    .from('orders')
    .update({
      metadata: {
        ...orderMetadata,
        post_payment_fulfillment_at: new Date().toISOString(),
        post_payment_fulfillment_tx: transactionId,
      },
    })
    .eq('id', orderId);

  console.log(`Post-payment fulfillment completed for order ${orderId} (tx ${transactionId})`);
}
