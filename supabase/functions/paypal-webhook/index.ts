/**
 * PayPal Commerce — Webhooks (onboarding, capture, fulfillment)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  capturePayPalOrder,
  isPayPalLiveMode,
  verifyPayPalWebhookSignature,
} from '../_shared/paypal-api.ts';
import {
  completeTransactionAndOrder,
  markWebhookProcessed,
  recordWebhookEvent,
} from '../_shared/complete-order-payment.ts';
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';
import { syncStoreEnabledPaymentProviders } from '../_shared/sync-enabled-providers.ts';
import { applyPaymentRefund } from '../_shared/apply-payment-refund.ts';

async function completePayPalPayment(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  transactionId: string,
  extras: {
    provider_session_id?: string;
    provider_payment_intent_id?: string;
    webhookPayload?: Record<string, unknown>;
  }
): Promise<void> {
  const { orderId, alreadyCompleted } = await completeTransactionAndOrder(supabase, transactionId, {
    ...extras,
    paymentProviderUsed: 'paypal_commerce',
  });

  if (orderId && !alreadyCompleted) {
    await runPostOrderPaymentFulfillment(supabase, orderId, transactionId);
  }
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
  if (!webhookId) {
    console.error('PAYPAL_WEBHOOK_ID missing');
    return new Response('Webhook not configured', { status: 500 });
  }

  const payload = await req.text();
  const valid = await verifyPayPalWebhookSignature(req.headers, payload, webhookId);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload) as {
    id: string;
    event_type: string;
    resource: Record<string, unknown>;
  };

  const supabase = createSupabaseAdmin();

  try {
    const isNew = await recordWebhookEvent(
      supabase,
      'paypal_commerce',
      event.id,
      event.event_type,
      event as unknown as Record<string, unknown>
    );
    if (!isNew) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }

    const eventType = event.event_type;

    if (
      eventType === 'MERCHANT.ONBOARDING.COMPLETED' ||
      eventType === 'CUSTOMER.MERCHANT-INTEGRATION.COMPLETED'
    ) {
      const resource = event.resource;
      const merchantId =
        (resource.merchant_id as string) ||
        (resource.merchant_id_in_paypal as string) ||
        ((resource.merchant_integration as Record<string, unknown>)?.merchant_id as string);

      const trackingId =
        (resource.tracking_id as string) || ((resource.partner_client_id as string) ? null : null);

      const storeId =
        trackingId ||
        (resource.custom_id as string) ||
        ((resource.metadata as Record<string, unknown>)?.store_id as string);

      if (merchantId && storeId) {
        await supabase.from('store_payment_connections').upsert(
          {
            store_id: storeId,
            provider: 'paypal_commerce',
            connection_mode: 'oauth_connected',
            external_account_id: merchantId,
            external_account_status: 'active',
            capabilities: { express_checkout: true },
            livemode: isPayPalLiveMode(),
            onboarding_completed_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'store_id,provider' }
        );
        await syncStoreEnabledPaymentProviders(supabase, storeId);
      } else if (merchantId) {
        await supabase
          .from('store_payment_connections')
          .update({
            external_account_id: merchantId,
            external_account_status: 'active',
            onboarding_completed_at: new Date().toISOString(),
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('external_account_id', merchantId)
          .eq('provider', 'paypal_commerce');
      }
    }

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const resource = event.resource;
      const paypalOrderId = resource.id as string;

      const capture = await capturePayPalOrder(paypalOrderId);
      const transactionId = capture.customId;

      if (transactionId && capture.status === 'COMPLETED') {
        await completePayPalPayment(supabase, transactionId, {
          provider_session_id: paypalOrderId,
          provider_payment_intent_id: capture.captureId,
          webhookPayload: resource,
        });
      }
    }

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const resource = event.resource;
      const customId = resource.custom_id as string | undefined;
      const supplementary = resource.supplementary_data as Record<string, unknown> | undefined;
      const relatedIds = supplementary?.related_ids as Record<string, string> | undefined;
      const orderId = relatedIds?.order_id;

      let transactionId = customId;
      if (!transactionId && orderId) {
        const { data: tx } = await supabase
          .from('transactions')
          .select('id')
          .eq('provider_session_id', orderId)
          .maybeSingle();
        transactionId = tx?.id;
      }

      if (transactionId) {
        await completePayPalPayment(supabase, transactionId, {
          provider_payment_intent_id: resource.id as string,
          webhookPayload: resource,
        });
      }
    }

    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const resource = event.resource;
      const customId = resource.custom_id as string | undefined;
      const amountValue = (resource.amount as { value?: string })?.value;
      const amountCurrency = (resource.amount as { currency_code?: string })?.currency_code;

      let transactionId = customId;
      if (!transactionId) {
        const supplementary = resource.supplementary_data as Record<string, unknown> | undefined;
        const relatedIds = supplementary?.related_ids as Record<string, string> | undefined;
        if (relatedIds?.order_id) {
          const { data: tx } = await supabase
            .from('transactions')
            .select('id')
            .eq('provider_session_id', relatedIds.order_id)
            .maybeSingle();
          transactionId = tx?.id;
        }
      }

      if (transactionId) {
        await applyPaymentRefund(supabase, transactionId, {
          refundId: resource.id as string,
          amount: parseFloat(amountValue ?? '0'),
          currency: amountCurrency ?? 'USD',
          provider: 'paypal_commerce',
        });
      }
    }

    if (eventType === 'MERCHANT.PARTNER-CONSENT.REVOKED') {
      const merchantId = event.resource.merchant_id as string;
      if (merchantId) {
        await supabase
          .from('store_payment_connections')
          .update({
            external_account_status: 'revoked',
            updated_at: new Date().toISOString(),
          })
          .eq('external_account_id', merchantId)
          .eq('provider', 'paypal_commerce');
      }
    }

    await markWebhookProcessed(supabase, 'paypal_commerce', event.id);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('paypal-webhook error:', message);
    await supabase
      .from('payment_webhook_events')
      .update({ processing_error: message })
      .eq('provider', 'paypal_commerce')
      .eq('external_event_id', event.id);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
