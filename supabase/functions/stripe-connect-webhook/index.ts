/**
 * Stripe Connect — Webhooks (checkout.session.completed, account.updated)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createSupabaseAdmin } from '../_shared/supabase-admin.ts';
import {
  completeTransactionAndOrder,
  markWebhookProcessed,
  recordWebhookEvent,
  validateOrderPaymentAmount,
} from '../_shared/complete-order-payment.ts';
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';
import { fromStripeAmount } from '../_shared/stripe-api.ts';

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function verifyStripeSignature(
  payload: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false;
  const parts = signatureHeader.split(',').reduce(
    (acc, part) => {
      const [k, v] = part.split('=');
      if (!k || !v) return acc;
      const key = k.trim();
      const value = v.trim();
      if (key === 'v1') {
        acc.v1.push(value);
        return acc;
      }
      if (key === 't') {
        acc.t = value;
        return acc;
      }
      return acc;
    },
    { t: null as string | null, v1: [] as string[] }
  );
  const timestamp = parts.t;
  const signatures = parts.v1;
  if (!timestamp || signatures.length === 0) return false;

  // Replay protection: reject if timestamp is too far from now.
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  const toleranceSec = 5 * 60;
  if (Math.abs(nowSec - ts) > toleranceSec) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`));
  const expected = Array.from(new Uint8Array(signed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return signatures.some(sig => constantTimeEquals(expected, sig));
}

serve(async req => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET missing');
    return new Response('Webhook not configured', { status: 500 });
  }

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  const valid = await verifyStripeSignature(payload, signature, webhookSecret);
  if (!valid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(payload) as {
    id: string;
    type: string;
    data: { object: Record<string, unknown> };
  };

  const supabase = createSupabaseAdmin();

  try {
    const isNew = await recordWebhookEvent(
      supabase,
      'stripe_connect',
      event.id,
      event.type,
      event as unknown as Record<string, unknown>
    );
    if (!isNew) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as {
        id: string;
        payment_status?: string;
        payment_intent?: string;
        amount_total?: number | null;
        currency?: string | null;
        metadata?: Record<string, string>;
      };

      if (session.payment_status !== 'paid') {
        await markWebhookProcessed(supabase, 'stripe_connect', event.id);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const transactionId = session.metadata?.transaction_id;
      if (transactionId) {
        const { data: txRow } = await supabase
          .from('transactions')
          .select('order_id')
          .eq('id', transactionId)
          .maybeSingle();

        if (txRow?.order_id && session.amount_total != null && session.currency) {
          const paidAmount = fromStripeAmount(session.amount_total, session.currency);
          const paymentCheck = await validateOrderPaymentAmount(
            supabase,
            txRow.order_id,
            paidAmount,
            session.currency
          );

          if (!paymentCheck.valid) {
            console.error('SECURITY: Stripe amount/currency mismatch', {
              transactionId,
              orderId: txRow.order_id,
              reason: paymentCheck.reason,
              difference: paymentCheck.difference,
            });
            await supabase
              .from('payment_webhook_events')
              .update({
                processing_error: paymentCheck.reason ?? 'payment_validation_failed',
              })
              .eq('provider', 'stripe_connect')
              .eq('external_event_id', event.id);
            return new Response(JSON.stringify({ error: 'Payment validation failed' }), {
              status: 400,
            });
          }
        }

        const { orderId, alreadyCompleted } = await completeTransactionAndOrder(
          supabase,
          transactionId,
          {
            provider_session_id: session.id,
            provider_payment_intent_id:
              typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
            webhookPayload: session as unknown as Record<string, unknown>,
          }
        );

        if (orderId && !alreadyCompleted) {
          await runPostOrderPaymentFulfillment(supabase, orderId, transactionId);
        }
      }
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as {
        id: string;
        charges_enabled?: boolean;
        payouts_enabled?: boolean;
        details_submitted?: boolean;
      };
      const status = account.charges_enabled && account.details_submitted ? 'active' : 'restricted';

      await supabase
        .from('store_payment_connections')
        .update({
          external_account_status: status,
          capabilities: {
            card_payments: account.charges_enabled ?? false,
            transfers: account.payouts_enabled ?? false,
          },
          onboarding_completed_at: account.details_submitted ? new Date().toISOString() : null,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('external_account_id', account.id)
        .eq('provider', 'stripe_connect');
    }

    await markWebhookProcessed(supabase, 'stripe_connect', event.id);
    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('stripe-connect-webhook error:', message);
    await supabase
      .from('payment_webhook_events')
      .update({ processing_error: message })
      .eq('provider', 'stripe_connect')
      .eq('external_event_id', event.id);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
