/// <reference path="../deno.d.ts" />
/**
 * Webhook MoneyFusion (FusionPay).
 * Doc: https://docs.moneyfusion.net/fr/webapi
 *
 * Important: MoneyFusion n'envoie PAS de signature HMAC.
 * Chaque notification est re-vérifiée via GET /paiementNotif/{token}
 * avant de marquer une commande comme payée.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.58.0';
import { runPostOrderPaymentFulfillment } from '../_shared/post-order-payment-fulfillment.ts';
import {
  completeTransactionAndOrder,
  markWebhookProcessed,
  recordWebhookEvent,
  validateOrderPaymentAmount,
} from '../_shared/complete-order-payment.ts';
import {
  activatePhysicalSubscriptionFromWebhook,
  billingCustomerFromTransaction,
} from '../_shared/physical-subscription-webhook.ts';
import { applyPaymentRefund } from '../_shared/apply-payment-refund.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://www.emarzona.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const MONEYFUSION_STATUS_URL = 'https://www.pay.moneyfusion.net/paiementNotif';

function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    event: payload.event ?? null,
    tokenPay: payload.tokenPay ?? payload.token ?? null,
    statut: payload.statut ?? payload.status ?? null,
    Montant: payload.Montant ?? payload.montant ?? payload.amount ?? null,
    frais: payload.frais ?? null,
    moyen: payload.moyen ?? null,
    has_personal_Info: Array.isArray(payload.personal_Info),
    numeroTransaction: payload.numeroTransaction ?? null,
    numeroRetrait: payload.numeroRetrait ?? null,
  };
}

async function hashPayload(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchVerifiedStatus(token: string): Promise<{
  ok: boolean;
  statut?: string;
  amount?: number;
  raw?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const res = await fetch(`${MONEYFUSION_STATUS_URL}/${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      return { ok: false, error: 'Réponse statut non-JSON' };
    }
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, raw: data };
    }
    const inner =
      data.data && typeof data.data === 'object'
        ? (data.data as Record<string, unknown>)
        : data;
    const statut = String(inner.statut ?? inner.status ?? '').toLowerCase().trim();
    const amountRaw = inner.Montant ?? inner.montant ?? inner.amount;
    const amount =
      amountRaw != null && amountRaw !== ''
        ? typeof amountRaw === 'string'
          ? parseFloat(amountRaw)
          : Number(amountRaw)
        : undefined;
    return { ok: true, statut, amount, raw: data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function mapMoneyFusionStatus(statut?: string): 'completed' | 'failed' | 'cancelled' | 'processing' {
  const s = (statut || '').toLowerCase();
  if (s === 'paid' || s === 'completed' || s === 'success') return 'completed';
  if (s === 'failure' || s === 'failed') return 'failed';
  if (s === 'no paid' || s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'processing';
}

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // MoneyFusion peut ping en GET
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ success: true, service: 'moneyfusion-webhook' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Configuration manquante' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const rawPayload = await req.text();
    let payload: Record<string, unknown>;
    try {
      payload = rawPayload ? (JSON.parse(rawPayload) as Record<string, unknown>) : {};
    } catch {
      return new Response(JSON.stringify({ error: 'JSON invalide' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safePayload = sanitizePayload(payload);
    console.log('[MoneyFusion webhook] received', safePayload);

    const token = String(payload.tokenPay || payload.token || '').trim();
    if (!token) {
      return new Response(
        JSON.stringify({ success: true, message: 'No token (ignored)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const eventName = typeof payload.event === 'string' ? payload.event : '';

    // Payout / refund reverse — pas de GET paiementNotif (token différent du payin)
    if (eventName.startsWith('payout.')) {
      const { data: txByRefund } = await supabase
        .from('transactions')
        .select('id, status, amount, currency, refunded_amount, metadata')
        .eq('payment_provider', 'moneyfusion')
        .contains('metadata', { moneyfusion_refund: { tokenPay: token } })
        .maybeSingle();

      let payoutTx = txByRefund;
      if (!payoutTx) {
        // Fallback: scan recent MF txs with matching refund token in metadata JSON
        const { data: candidates } = await supabase
          .from('transactions')
          .select('id, status, amount, currency, refunded_amount, metadata')
          .eq('payment_provider', 'moneyfusion')
          .order('updated_at', { ascending: false })
          .limit(50);
        payoutTx =
          (candidates || []).find(row => {
            const m = row.metadata as Record<string, unknown> | null;
            const refund = m?.moneyfusion_refund as Record<string, unknown> | undefined;
            return refund && String(refund.tokenPay || '') === token;
          }) ?? null;
      }

      if (!payoutTx) {
        console.warn('[MoneyFusion webhook] payout token not linked to transaction', {
          token: token.slice(0, 8),
          eventName,
        });
        return new Response(JSON.stringify({ success: true, ignored: true, reason: 'unknown_payout_token' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const meta =
        payoutTx.metadata && typeof payoutTx.metadata === 'object'
          ? (payoutTx.metadata as Record<string, unknown>)
          : {};
      const refundMeta =
        meta.moneyfusion_refund && typeof meta.moneyfusion_refund === 'object'
          ? (meta.moneyfusion_refund as Record<string, unknown>)
          : {};

      if (eventName === 'payout.session.completed') {
        const amount =
          Number(payload.montant ?? payload.Montant ?? refundMeta.amount ?? payoutTx.amount) ||
          Number(payoutTx.amount);
        const reason =
          typeof refundMeta.reason === 'string' && refundMeta.reason
            ? refundMeta.reason
            : 'MoneyFusion payout.session.completed';

        // P0-C: book ledger only when payout settles (idempotent if already refunded)
        if (payoutTx.status !== 'refunded') {
          await applyPaymentRefund(supabase, String(payoutTx.id), {
            refundId: token,
            amount,
            currency: String(payoutTx.currency || 'XOF').toUpperCase(),
            reason,
            provider: 'moneyfusion',
          }).catch(err =>
            console.error('[MoneyFusion webhook] payout applyPaymentRefund failed', err)
          );
        }

        await supabase
          .from('transactions')
          .update({
            metadata: {
              ...meta,
              moneyfusion_refund: {
                ...refundMeta,
                tokenPay: token,
                amount,
                payout_status: 'completed',
                payout_completed_at: new Date().toISOString(),
              },
            },
          })
          .eq('id', payoutTx.id);
      } else if (eventName === 'payout.session.cancelled') {
        // Ledger was never booked on initiate — mark payout failed for retry/manual
        await supabase
          .from('transactions')
          .update({
            metadata: {
              ...meta,
              moneyfusion_refund: {
                ...refundMeta,
                tokenPay: token,
                payout_status: 'cancelled',
                payout_cancelled_at: new Date().toISOString(),
                payout_payload: safePayload,
              },
            },
          })
          .eq('id', payoutTx.id);
      }

      return new Response(JSON.stringify({ success: true, event: eventName, transactionId: payoutTx.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Re-vérification obligatoire (webhook non signé) — payin only
    const verified = await fetchVerifiedStatus(token);
    if (!verified.ok) {
      console.error('[MoneyFusion webhook] Status re-check failed', {
        token: token.slice(0, 8),
        error: verified.error,
      });
      return new Response(
        JSON.stringify({ error: 'Unable to verify payment status', detail: verified.error }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mappedStatus = mapMoneyFusionStatus(verified.statut);
    const eventType =
      typeof payload.event === 'string'
        ? payload.event
        : mappedStatus === 'completed'
          ? 'payin.session.completed'
          : mappedStatus === 'cancelled' || mappedStatus === 'failed'
            ? 'payin.session.cancelled'
            : 'payin.session.pending';

    const personalInfo = Array.isArray(payload.personal_Info)
      ? (payload.personal_Info[0] as Record<string, unknown> | undefined)
      : undefined;

    // Lookup transaction by token (payment_id) or metadata
    let transaction: Record<string, unknown> | null = null;

    const byPaymentId = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,customer_email,customer_name,metadata,webhook_attempts'
      )
      .eq('payment_id', token)
      .eq('payment_provider', 'moneyfusion')
      .maybeSingle();

    if (byPaymentId.data) {
      transaction = byPaymentId.data as Record<string, unknown>;
    }

    if (!transaction && personalInfo?.transaction_id) {
      const byId = await supabase
        .from('transactions')
        .select(
          'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,customer_email,customer_name,metadata,webhook_attempts'
        )
        .eq('id', String(personalInfo.transaction_id))
        .maybeSingle();
      if (byId.data) transaction = byId.data as Record<string, unknown>;
    }

    if (!transaction && personalInfo?.orderId) {
      const orderId = String(personalInfo.orderId);
      if (/^[0-9a-f-]{36}$/i.test(orderId)) {
        const byOrder = await supabase
          .from('transactions')
          .select(
            'id,status,order_id,store_id,payment_id,amount,currency,customer_id,payment_provider,customer_email,customer_name,metadata,webhook_attempts'
          )
          .eq('order_id', orderId)
          .eq('payment_provider', 'moneyfusion')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (byOrder.data) transaction = byOrder.data as Record<string, unknown>;
      }
    }

    if (!transaction) {
      console.error('[MoneyFusion webhook] Transaction not found — orphan PSP payment risk', {
        tokenPrefix: token.slice(0, 8),
        mappedStatus,
        verifiedAmount: verified.amount,
      });
      try {
        await supabase.from('payment_webhook_events').insert({
          provider: 'moneyfusion',
          external_event_id: `moneyfusion:orphan:${token}:${mappedStatus}`,
          event_type: eventType,
          payload: {
            ...safePayload,
            orphan: true,
            verified_statut: verified.statut,
            verified_amount: verified.amount ?? null,
          },
          processing_error: 'transaction_not_found',
        });
      } catch (orphanErr) {
        console.error('[MoneyFusion webhook] Failed to record orphan event', orphanErr);
      }
      // 404 → MoneyFusion peut retenter ; l'événement orphan est visible admin/ops
      return new Response(
        JSON.stringify({
          error: 'Transaction not found',
          orphan: true,
          message: 'Paiement reçu sans transaction locale — à réconcilier',
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transactionId = String(transaction.id);
    const orderId = (transaction.order_id as string | null) ?? null;
    const payloadHash = await hashPayload(rawPayload);
    const externalEventId = `moneyfusion:${token}:${mappedStatus}:${payloadHash.slice(0, 16)}`;

    if (mappedStatus !== 'completed') {
      const isNew = await recordWebhookEvent(
        supabase,
        'moneyfusion',
        externalEventId,
        eventType,
        safePayload,
        orderId,
        transactionId
      );
      if (!isNew) {
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      await supabase
        .from('transactions')
        .update({
          status: mappedStatus === 'processing' ? 'processing' : mappedStatus,
          webhook_processed_at: new Date().toISOString(),
          webhook_attempts: Number(transaction.webhook_attempts || 0) + 1,
          last_webhook_payload: safePayload,
        })
        .eq('id', transactionId);

      await markWebhookProcessed(supabase, 'moneyfusion', externalEventId);

      return new Response(JSON.stringify({ success: true, status: mappedStatus }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // completed — valider le montant réellement payé côté MoneyFusion (PSP),
    // pas seulement le montant local de la transaction.
    const pspAmount =
      verified.amount != null && !Number.isNaN(verified.amount) ? Number(verified.amount) : null;
    const localAmount = Number(transaction.amount);
    const txCurrency =
      typeof transaction.currency === 'string' ? transaction.currency : null;

    if (orderId) {
      const amountToValidate = pspAmount != null ? pspAmount : localAmount;
      const paymentCheck = await validateOrderPaymentAmount(
        supabase,
        orderId,
        amountToValidate,
        txCurrency
      );
      if (!paymentCheck.valid) {
        console.error('[MoneyFusion webhook] Amount validation failed', {
          transactionId,
          orderId,
          pspAmount,
          localAmount,
          expected: paymentCheck.orderAmount,
          reason: paymentCheck.reason,
        });
        await supabase.from('payment_webhook_events').insert({
          provider: 'moneyfusion',
          external_event_id: externalEventId,
          event_type: eventType,
          payload: {
            ...safePayload,
            psp_amount: pspAmount,
            local_amount: localAmount,
          },
          processing_error: paymentCheck.reason ?? 'payment_validation_failed',
          transaction_id: transactionId,
          order_id: orderId,
        });
        return new Response(
          JSON.stringify({
            error: 'Payment validation failed',
            reason: paymentCheck.reason,
            pspAmount,
            localAmount,
            expected: paymentCheck.orderAmount,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Écart PSP vs montant initié localement (sous/sur-paiement)
      if (pspAmount != null && Math.abs(pspAmount - localAmount) > 1) {
        console.error('[MoneyFusion webhook] PSP vs local amount mismatch', {
          transactionId,
          pspAmount,
          localAmount,
        });
        await supabase.from('payment_webhook_events').insert({
          provider: 'moneyfusion',
          external_event_id: `${externalEventId}:psp_local_mismatch`,
          event_type: eventType,
          payload: { ...safePayload, psp_amount: pspAmount, local_amount: localAmount },
          processing_error: 'psp_local_amount_mismatch',
          transaction_id: transactionId,
          order_id: orderId,
        });
        return new Response(
          JSON.stringify({
            error: 'Payment validation failed',
            reason: 'psp_local_amount_mismatch',
            pspAmount,
            localAmount,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { orderId: completedOrderId, alreadyCompleted } = await completeTransactionAndOrder(
      supabase,
      transactionId,
      {
        provider_payment_intent_id: token,
        webhookPayload: safePayload,
        paymentProviderUsed: 'moneyfusion',
        externalEventId,
        eventType,
      }
    );

    // Toujours sync payments/facture (idempotent) ; le reste du fulfillment
    // court-circuite via post_payment_fulfillment_at si déjà fait.
    const fulfillmentOrderId = completedOrderId || orderId;
    if (fulfillmentOrderId) {
      await runPostOrderPaymentFulfillment(supabase, fulfillmentOrderId, transactionId).catch(err =>
        console.error('[MoneyFusion webhook] post-order fulfillment failed', err)
      );
    } else if (alreadyCompleted) {
      console.log('[MoneyFusion webhook] replay ignored (no order_id)', {
        transactionId,
        externalEventId,
      });
    }

    // Abonnements physiques (sans order_id) — même pattern que GeniusPay
    if (!alreadyCompleted && !orderId) {
      try {
        const meta = (transaction.metadata || {}) as Record<string, unknown>;
        const purpose = meta.purpose as string | undefined;
        const planSlug = meta.plan_slug as string | undefined;
        const invoiceId = meta.invoice_id as string | undefined;

        if (purpose === 'physical_plan_change' && invoiceId) {
          const { applyPhysicalPlanChangeFromWebhook } = await import(
            '../_shared/physical-subscription-webhook.ts'
          );
          await applyPhysicalPlanChangeFromWebhook(supabase, {
            invoiceId: String(invoiceId),
            transactionId,
            geniuspayTransactionId: token,
          });
        } else if (purpose === 'physical_subscription_renewal' && invoiceId) {
          const { applyPhysicalSubscriptionRenewalFromWebhook } = await import(
            '../_shared/physical-subscription-webhook.ts'
          );
          await applyPhysicalSubscriptionRenewalFromWebhook(supabase, {
            invoiceId: String(invoiceId),
            transactionId,
            geniuspayTransactionId: token,
            billingCustomer: billingCustomerFromTransaction({
              customer_email: transaction.customer_email as string | null,
              customer_name: transaction.customer_name as string | null,
              metadata: meta,
            }),
            storeId: (transaction.store_id as string) ?? null,
          });
        } else if (purpose === 'physical_subscription' && planSlug && transaction.store_id) {
          const { data: plan } = await supabase
            .from('platform_vendor_plans')
            .select('id, slug, monthly_price, currency, trial_days, applies_to_product_type')
            .eq('slug', String(planSlug))
            .maybeSingle();

          if (plan && plan.applies_to_product_type === 'physical') {
            await activatePhysicalSubscriptionFromWebhook(supabase, {
              storeId: String(transaction.store_id),
              plan,
              transactionId,
              geniuspayTransactionId: token,
              billingCustomer: billingCustomerFromTransaction({
                customer_email: transaction.customer_email as string | null,
                customer_name: transaction.customer_name as string | null,
                metadata: meta,
              }),
            });
          }
        }
      } catch (subErr) {
        console.error('[MoneyFusion webhook] physical subscription error', subErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        alreadyCompleted,
        orderId: completedOrderId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[MoneyFusion webhook] Unhandled error', { message });
    return new Response(JSON.stringify({ error: 'Internal error', message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
