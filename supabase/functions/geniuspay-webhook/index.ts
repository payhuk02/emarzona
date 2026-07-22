import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';
import {
  completeTransactionAndOrder,
  markWebhookProcessed,
  recordWebhookEvent,
  validateOrderPaymentAmount,
} from '../_shared/complete-order-payment.ts';
import { applyPaymentRefund } from '../_shared/apply-payment-refund.ts';
import {
  activatePhysicalSubscriptionFromWebhook,
  billingCustomerFromTransaction,
} from '../_shared/physical-subscription-webhook.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://www.emarzona.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function maskIp(ip?: string | null): string {
  if (!ip) return 'unknown';
  const first = ip.split(',')[0]?.trim() || '';
  if (!first) return 'unknown';
  const parts = first.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.*.*`;
  return 'masked';
}

function sanitizeWebhookPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    transaction_id: payload.transaction_id ?? null,
    status: payload.status ?? null,
    amount: payload.amount ?? null,
    currency: payload.currency ?? null,
    has_metadata: !!payload.metadata,
    provider_reference: payload.reference ?? null,
  };
}

async function calculateHMACSignature(timestamp: string, payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(timestamp + '.' + payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPayload(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function resolveGeniusPayExternalEventId(
  payload: Record<string, unknown>,
  transactionId: string,
  payloadHash: string
): string {
  const explicit = payload.event_id ?? payload.webhook_id ?? payload.id ?? payload.reference;
  if (explicit != null && String(explicit).trim() !== '') {
    return `geniuspay:${String(explicit).trim()}`;
  }
  return `geniuspay:${transactionId}:${payloadHash}`;
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function extractSignatureFromHeader(headers: Headers): string | null {
  const signature =
    headers.get('x-webhook-signature') ||
    headers.get('X-Webhook-Signature') ||
    headers.get('webhook-signature');

  if (!signature) {
    return null;
  }

  const match = signature.match(/sha256=(.+)/i);
  return match ? match[1] : signature;
}

function extractTimestampFromHeader(headers: Headers): string {
  return headers.get('x-webhook-timestamp') || headers.get('X-Webhook-Timestamp') || '';
}

async function verifyWebhookSignature(
  timestamp: string,
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  if (!signature || !secret || !timestamp) {
    return false;
  }

  try {
    const calculatedSignature = await calculateHMACSignature(timestamp, payload, secret);
    return constantTimeEquals(calculatedSignature, signature);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookSecret = Deno.env.get('GENIUSPAY_WEBHOOK_SECRET');
    const env = (Deno.env.get('ENV') || Deno.env.get('NODE_ENV') || '').toLowerCase();
    const isProduction = env === 'production' || !!Deno.env.get('DENO_DEPLOYMENT_ID');

    const rawPayload = await req.text();

    if (webhookSecret) {
      const signature = extractSignatureFromHeader(req.headers);
      const timestamp = extractTimestampFromHeader(req.headers);

      if (!signature || !timestamp) {
        console.error('Webhook signature or timestamp missing');
        return new Response(JSON.stringify({ error: 'Webhook signature or timestamp missing' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const isValid = await verifyWebhookSignature(timestamp, rawPayload, signature, webhookSecret);

      if (!isValid) {
        console.error('Invalid webhook signature');
        await supabase
          .from('transaction_logs')
          .insert({
            event_type: 'webhook_signature_failed',
            status: 'failed',
            request_data: {
              ip: maskIp(req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')),
              user_agent: req.headers.get('user-agent') || 'unknown',
              timestamp: new Date().toISOString(),
            },
            error_data: {
              error: 'Invalid webhook signature',
              signature_preview: signature.substring(0, 20) + '...',
            },
          })
          .then(null, (err: unknown) => console.error('Error logging failed webhook:', err));

        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log('Webhook signature verified successfully');
    } else {
      if (isProduction) {
        console.error('GENIUSPAY_WEBHOOK_SECRET not configured in production - rejecting webhook');
        return new Response(
          JSON.stringify({
            error: 'Webhook misconfigured',
            message: 'Webhook signature secret is required in production',
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.warn(
        'GENIUSPAY_WEBHOOK_SECRET not configured (non-production) - webhook signature verification disabled'
      );
    }

    const payload = JSON.parse(rawPayload);
    const safePayloadForLogs = sanitizeWebhookPayload(payload);
    console.log('GeniusPay webhook received', safePayloadForLogs);

    const transaction_id = payload.transaction_id || payload.id || payload.reference || payload.transactionId;
    const { status, amount, currency, metadata } = payload;

    if (!transaction_id) {
      console.log('Webhook payload missing transaction identifier. Payload:', payload);
      // Return 200 OK for generic tests/pings to avoid dashboard errors
      return new Response(JSON.stringify({ success: true, message: 'Webhook received but no transaction ID found (test event?)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find transaction by GeniusPay transaction ID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,payment_method,geniuspay_payment_method,geniuspay_transaction_id,webhook_attempts,customer_email,customer_name,metadata'
      )
      .eq('geniuspay_transaction_id', transaction_id)
      .single();

    if (findError) {
      console.warn('Transaction not found:', transaction_id, 'Ignoring to prevent retries (might be a test payload).');
      return new Response(JSON.stringify({ success: true, message: 'Transaction not found (ignored)' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map GeniusPay status to our status
    const statusMap: Record<string, string> = {
      completed: 'completed',
      success: 'completed',
      failed: 'failed',
      pending: 'processing',
      cancelled: 'cancelled',
      refunded: 'refunded',
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || 'processing';

    // Prevent state regression on out-of-order events.
    const TERMINAL: Record<string, number> = {
      processing: 1,
      cancelled: 2,
      failed: 2,
      completed: 3,
      refunded: 4,
    };
    const currentRank = TERMINAL[String(transaction.status ?? 'processing')] ?? 0;
    const nextRank = TERMINAL[String(mappedStatus)] ?? 0;
    if (currentRank >= 3 && nextRank < currentRank) {
      console.warn('Ignoring webhook that would regress terminal status', {
        transaction_id: transaction.id,
        current: transaction.status,
        incoming: mappedStatus,
      });
      return new Response(JSON.stringify({ success: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payloadHash = await hashPayload(rawPayload);
    const externalEventId = resolveGeniusPayExternalEventId(
      payload as Record<string, unknown>,
      transaction_id,
      payloadHash
    );

    // For 'completed', we will handle idempotency inside the atomic RPC
    // to prevent race conditions. For other statuses, we use the legacy approach.
    let isNewEvent = true;
    if (mappedStatus !== 'completed') {
      isNewEvent = await recordWebhookEvent(
        supabase,
        'geniuspay',
        externalEventId,
        String(status ?? 'unknown'),
        safePayloadForLogs,
        transaction.order_id,
        transaction.id
      );

      if (!isNewEvent) {
        console.log('Duplicate GeniusPay webhook ignored', { externalEventId });
        return new Response(
          JSON.stringify({ success: true, message: 'Webhook already processed', duplicate: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 🔒 Valider montant + devise avant mise à jour
    if (amount != null && transaction.order_id) {
      const webhookAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
      const paymentCheck = await validateOrderPaymentAmount(
        supabase,
        transaction.order_id,
        webhookAmount,
        typeof currency === 'string' ? currency : null
      );

      if (!paymentCheck.valid) {
        console.error('SECURITY: GeniusPay payment validation failed', {
          transaction_id: transaction.id,
          order_id: transaction.order_id,
          reason: paymentCheck.reason,
          difference: paymentCheck.difference,
        });

        if (mappedStatus === 'completed') {
          await supabase.from('payment_webhook_events').insert({
            provider: 'geniuspay',
            external_event_id: externalEventId,
            event_type: String(status ?? 'unknown'),
            payload: safePayloadForLogs,
            processing_error: paymentCheck.reason ?? 'payment_validation_failed',
            transaction_id: transaction.id,
            order_id: transaction.order_id,
          });
        } else {
          await supabase
            .from('payment_webhook_events')
            .update({
              processing_error: paymentCheck.reason ?? 'payment_validation_failed',
            })
            .eq('provider', 'geniuspay')
            .eq('external_event_id', externalEventId);
        }

        await supabase.from('transaction_logs').insert({
          event_type: 'webhook_amount_mismatch',
          status: 'failed',
          transaction_id: transaction.id,
          request_data: safePayloadForLogs,
          error_data: {
            error: paymentCheck.reason ?? 'payment_validation_failed',
            severity: 'high',
          },
        });

        return new Response(
          JSON.stringify({
            error: 'Payment validation failed',
            reason: paymentCheck.reason,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update transaction
    const updates: Record<string, unknown> = {
      status: mappedStatus,
      geniuspay_response: safePayloadForLogs,
      updated_at: new Date().toISOString(),
      webhook_processed_at: new Date().toISOString(),
      webhook_attempts: (transaction.webhook_attempts || 0) + 1,
      last_webhook_payload: safePayloadForLogs,
    };

    if (mappedStatus === 'completed') {
      updates.completed_at = new Date().toISOString();

      // Update associated payment if exists
      if (transaction.payment_id) {
        const { data: payment, error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'completed',
            transaction_id: transaction_id,
          })
          .eq('id', transaction.payment_id)
          .select('*, order_id, store_id')
          .single();

        if (paymentError) {
          console.error('Error updating payment:', paymentError);
        } else if (payment) {
          await supabase
            .rpc('trigger_webhook', {
              p_event_type: 'payment.completed',
              p_event_id: payment.id,
              p_event_data: {
                payment: {
                  id: payment.id,
                  order_id: payment.order_id,
                  transaction_id: transaction_id,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  status: 'completed',
                  payment_method: transaction.geniuspay_payment_method || 'geniuspay',
                  created_at: payment.created_at,
                },
              },
              p_store_id: payment.store_id,
            })
            .then(null, (err: unknown) => console.error('Webhook error:', err));
        }
      }

      // Commande : même pipeline que Stripe/PayPal (statut paid + fulfillment unifié)
      let order: Record<string, unknown> | null = null;
      if (transaction.order_id) {
        const { orderId } = await completeTransactionAndOrder(
          supabase,
          transaction.id,
          {
            webhookPayload: safePayloadForLogs,
            paymentProviderUsed: transaction.payment_provider || 'geniuspay_platform',
            externalEventId,
            eventType: String(status ?? 'unknown'),
          }
        );

        if (orderId) {
          await runPostOrderPaymentFulfillment(supabase, orderId, transaction.id);

          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(
              'id,store_id,order_number,customer_id,total_amount,currency,status,payment_status,created_at,metadata,customer_email,shipping_address,expected_delivery_date,tracking_number,tracking_link'
            )
            .eq('id', orderId)
            .single();

          if (orderError) {
            console.error('Error loading order after payment:', orderError);
          } else if (orderData) {
            order = orderData as Record<string, unknown>;
          }
        }
      }

      // -------------------------------------------------------------------
      // 🧾 Abonnement produits physiques (pas de order_id)
      // -------------------------------------------------------------------
      try {
        const purpose =
          (transaction?.metadata as Record<string, unknown> | null | undefined)?.purpose ||
          (metadata as Record<string, unknown> | null | undefined)?.purpose;
        const planSlug =
          (transaction?.metadata as Record<string, unknown> | null | undefined)?.plan_slug ||
          (metadata as Record<string, unknown> | null | undefined)?.plan_slug;

        const invoiceId =
          (transaction?.metadata as Record<string, unknown> | null | undefined)?.invoice_id ||
          (metadata as Record<string, unknown> | null | undefined)?.invoice_id;

        if (!transaction.order_id && purpose === 'physical_plan_change' && invoiceId) {
          const { applyPhysicalPlanChangeFromWebhook } =
            await import('../_shared/physical-subscription-webhook.ts');
          const planChange = await applyPhysicalPlanChangeFromWebhook(supabase, {
            invoiceId: String(invoiceId),
            transactionId: transaction.id,
            geniuspayTransactionId: transaction.geniuspay_transaction_id ?? null,
          });
          console.log('Applied physical plan change from invoice', {
            invoice_id: invoiceId,
            subscription_id: planChange.subscriptionId,
            transaction_id: transaction.id,
          });
        } else if (
          !transaction.order_id &&
          purpose === 'physical_subscription_renewal' &&
          invoiceId
        ) {
          const { applyPhysicalSubscriptionRenewalFromWebhook } =
            await import('../_shared/physical-subscription-webhook.ts');
          const billingCustomer = billingCustomerFromTransaction(transaction);
          const renewal = await applyPhysicalSubscriptionRenewalFromWebhook(supabase, {
            invoiceId: String(invoiceId),
            transactionId: transaction.id,
            geniuspayTransactionId: transaction.geniuspay_transaction_id ?? null,
            billingCustomer,
            storeId: transaction.store_id ?? null,
          });
          console.log('Renewed physical subscription from invoice', {
            invoice_id: invoiceId,
            subscription_id: renewal.subscriptionId,
            transaction_id: transaction.id,
          });
        } else if (!transaction.order_id && purpose === 'physical_subscription' && planSlug) {
          const { data: plan, error: planError } = await supabase
            .from('platform_vendor_plans')
            .select('id, slug, monthly_price, currency, trial_days, applies_to_product_type')
            .eq('slug', String(planSlug))
            .maybeSingle();

          if (planError || !plan) {
            console.error('Subscription plan not found for webhook:', planError);
          } else if (plan.applies_to_product_type !== 'physical') {
            console.error('Subscription plan not physical, ignoring:', plan.slug);
          } else if (!transaction.store_id) {
            console.error('Physical subscription webhook missing store_id', {
              transaction_id: transaction.id,
            });
          } else {
            const activation = await activatePhysicalSubscriptionFromWebhook(supabase, {
              storeId: transaction.store_id,
              plan,
              transactionId: transaction.id,
              geniuspayTransactionId: transaction.geniuspay_transaction_id ?? null,
              billingCustomer: billingCustomerFromTransaction(transaction),
            });

            console.log('Activated physical subscription for store', {
              store_id: transaction.store_id,
              plan: plan.slug,
              transaction_id: transaction.id,
              subscription_id: activation.subscriptionId,
              created: activation.created,
            });
          }
        }
      } catch (subErr: unknown) {
        console.error('Error activating physical subscription:', subErr);
      }

      // ✅ Créer une notification de paiement réussi
      // NOTE: Cette notification sera automatiquement affichée avec son via useRealtimeNotifications
      // Pour une meilleure cohérence, idéalement utiliser sendUnifiedNotification (nécessite adaptation pour Edge Functions)
      if (transaction.customer_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: transaction.customer_id,
            type: 'order_payment_received', // ✅ Utiliser le type unifié
            title: '✅ Paiement réussi !',
            message: `Votre paiement de ${transaction.amount} ${transaction.currency} a été confirmé avec succès.${transaction.order_id ? ` Commande #${transaction.order_id}` : ''}`,
            priority: 'high', // ✅ Priorité haute pour notification importante
            metadata: {
              transaction_id: transaction.id,
              order_id: transaction.order_id,
              amount: transaction.amount,
              currency: transaction.currency,
              payment_method: transaction.geniuspay_payment_method || 'geniuspay',
            },
            action_url: transaction.order_id ? `/orders/${transaction.order_id}` : '/orders',
            action_label: 'Voir la commande',
            is_read: false,
          })
          .then(null, (err: unknown) => console.error('Error creating notification:', err));

        // ✅ Envoyer également un email via Edge Function pour multi-canaux
        try {
          const { data: user } = await supabase.auth.admin.getUserById(transaction.customer_id);
          if (user?.user?.email) {
            await supabase.functions
              .invoke('send-email', {
                body: {
                  to: user.user.email,
                  template: 'payment_success',
                  data: {
                    customerName:
                      user.user.user_metadata?.full_name ||
                      user.user.email.split('@')[0] ||
                      'Client',
                    orderNumber:
                      (order as { order_number?: string })?.order_number || transaction.order_id,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    transactionId: transaction.id,
                  },
                },
              })
              .then(null, (err: unknown) => console.error('Error sending payment email:', err));
          }
        } catch (emailErr) {
          console.error('Error sending payment email:', emailErr);
        }
      }
    } else if (mappedStatus === 'failed') {
      updates.failed_at = new Date().toISOString();
      updates.error_message = payload.error_message || 'Payment failed';

      // Update payment and order status
      if (transaction.payment_id) {
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('id', transaction.payment_id);
      }

      if (transaction.order_id) {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', transaction.order_id);
      }

      // ✅ Créer une notification de paiement échoué
      // NOTE: Cette notification sera automatiquement affichée avec son via useRealtimeNotifications
      if (transaction.customer_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: transaction.customer_id,
            type: 'order_payment_failed', // ✅ Utiliser le type unifié
            title: '❌ Paiement échoué',
            message: `Votre paiement de ${transaction.amount} ${transaction.currency} a échoué. Veuillez réessayer.`,
            priority: 'high', // ✅ Priorité haute pour notification importante
            metadata: {
              transaction_id: transaction.id,
              order_id: transaction.order_id,
              amount: transaction.amount,
              currency: transaction.currency,
              error_message: payload.error_message,
            },
            action_url: transaction.order_id ? `/orders/${transaction.order_id}` : '/orders',
            action_label: 'Réessayer le paiement',
            is_read: false,
          })
          .then(null, (err: unknown) => console.error('Error creating notification:', err));

        // ✅ Envoyer également un email via Edge Function pour multi-canaux
        try {
          const { data: user } = await supabase.auth.admin.getUserById(transaction.customer_id);
          if (user?.user?.email) {
            const currentOrder = transaction.order_id
              ? await supabase
                  .from('orders')
                  .select('order_number')
                  .eq('id', transaction.order_id)
                  .single()
                  .then(({ data }) => data)
              : null;
            await supabase.functions
              .invoke('send-email', {
                body: {
                  to: user.user.email,
                  template: 'payment_failed',
                  data: {
                    customerName:
                      user.user.user_metadata?.full_name ||
                      user.user.email.split('@')[0] ||
                      'Client',
                    orderNumber: currentOrder?.order_number,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    reason: payload.error_message,
                    transactionId: transaction.id,
                  },
                },
              })
              .then(null, (err: unknown) =>
                console.error('Error sending payment failed email:', err)
              );
          }
        } catch (emailErr) {
          console.error('Error sending payment failed email:', emailErr);
        }
      }
    } else if (mappedStatus === 'refunded') {
      const refundAmountRaw = payload.amount ?? transaction.amount;
      const refundAmount =
        typeof refundAmountRaw === 'string' ? parseFloat(refundAmountRaw) : Number(refundAmountRaw);

      try {
        await applyPaymentRefund(supabase, transaction.id, {
          refundId: String(payload.refund_id ?? externalEventId),
          amount: Number.isFinite(refundAmount) ? refundAmount : Number(transaction.amount ?? 0),
          currency: String(payload.currency ?? transaction.currency ?? 'XOF'),
          reason: typeof payload.reason === 'string' ? payload.reason : undefined,
          provider: transaction.payment_provider || 'geniuspay_platform',
        });
      } catch (refundError) {
        console.error('GeniusPay applyPaymentRefund failed:', refundError);
        await supabase
          .from('payment_webhook_events')
          .update({
            processing_error:
              refundError instanceof Error ? refundError.message : 'refund_apply_failed',
          })
          .eq('provider', 'geniuspay')
          .eq('external_event_id', externalEventId);
        throw refundError;
      }

      updates.status = 'refunded';
      updates.refunded_at = new Date().toISOString();
      updates.geniuspay_refund_id = payload.refund_id;
      updates.geniuspay_refund_amount = payload.amount;
      updates.geniuspay_refund_reason = payload.reason;

      // Create refund notification
      if (transaction.customer_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: transaction.customer_id,
            type: 'payment_refunded',
            title: '🔄 Paiement remboursé',
            message: `Votre paiement de ${payload.amount} ${payload.currency} a été remboursé.`,
            metadata: {
              transaction_id: transaction.id,
              refund_id: payload.refund_id,
              amount: payload.amount,
              currency: payload.currency,
              reason: payload.reason,
            },
            is_read: false,
          })
          .then(null, (err: unknown) => console.error('Error creating refund notification:', err));
      }
    }

    const { error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      throw updateError;
    }

    await supabase.from('transaction_logs').insert({
      transaction_id: transaction.id,
      event_type: 'webhook_received',
      status: mappedStatus,
      response_data: safePayloadForLogs,
    });

    await markWebhookProcessed(supabase, 'geniuspay', externalEventId);

    console.log('Transaction updated successfully:', transaction.id);

    return new Response(JSON.stringify({ success: true, message: 'Webhook processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
