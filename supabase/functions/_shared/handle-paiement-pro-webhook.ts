/**
 * Handler webhook Paiement Pro (partagé — plafond de fonctions Edge).
 * Auth: hashcode MD5 (formules candidates) + amount match.
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { runPostOrderPaymentFulfillment } from './post-order-payment-fulfillment.ts';
import {
  completeTransactionAndOrder,
  markWebhookProcessed,
  recordWebhookEvent,
  validateOrderPaymentAmount,
} from './complete-order-payment.ts';
import {
  getPaiementProCredentials,
  isPaiementProSuccessCode,
  verifyPaiementProHashcode,
} from './paiement-pro-hash.ts';

export const paiementProWebhookCors = {
  'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') || 'https://www.emarzona.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

function parseBody(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  const params = new URLSearchParams(trimmed);
  const out: Record<string, unknown> = {};
  for (const [k, v] of params.entries()) out[k] = v;
  return out;
}

function parseReturnContext(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

/** True if payload looks like a Paiement Pro notification (not our create_checkout). */
export function looksLikePaiementProWebhook(payload: Record<string, unknown>): boolean {
  if (payload.action === 'create_checkout' || payload.action === 'ping') return false;
  if (payload.data && typeof payload.data === 'object') return false;
  const hasRef = !!(payload.referenceNumber || payload.referencenumber || payload.reference);
  const hasHash = !!(payload.hashcode || payload.hashCode);
  const hasCode = payload.responsecode != null || payload.responseCode != null || payload.code != null;
  return hasRef && (hasHash || hasCode);
}

export async function handlePaiementProWebhookRaw(
  rawPayload: string,
  corsHeaders: Record<string, string> = paiementProWebhookCors
): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Configuration manquante' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceKey);
  const payload = parseBody(rawPayload);

  const referenceNumber = String(
    payload.referenceNumber || payload.referencenumber || payload.reference || ''
  ).trim();
  const hashcode = String(payload.hashcode || payload.hashCode || '').trim();
  const responsecode = payload.responsecode ?? payload.responseCode ?? payload.code;
  const amountRaw = payload.amount ?? payload.montant ?? payload.Amount;
  const merchantIdPayload = String(payload.merchantId || payload.merchantid || '').trim();
  const customerId = String(payload.customerId || payload.customerid || '').trim();
  const transactiondt = String(payload.transactiondt || payload.transactionDt || '').trim();
  const ctx = parseReturnContext(payload.returnContext || payload.returncontext);

  console.log('[PaiementPro webhook] received', {
    referenceNumber: referenceNumber.slice(0, 24),
    responsecode,
    hasHash: !!hashcode,
    amount: amountRaw,
  });

  if (!referenceNumber) {
    return new Response(JSON.stringify({ success: true, message: 'No reference (ignored)' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { merchantId, secretKey } = getPaiementProCredentials();
  const hashCheck = await verifyPaiementProHashcode({
    hashcode,
    secretKey,
    merchantId: merchantIdPayload || merchantId,
    referenceNumber,
    amount: amountRaw != null ? String(amountRaw) : '',
    customerId,
    transactiondt,
  });

  if (secretKey && hashcode && !hashCheck.ok) {
    console.error('[PaiementPro webhook] hash mismatch', {
      referenceNumber: referenceNumber.slice(0, 24),
    });
    return new Response(JSON.stringify({ error: 'Invalid hashcode' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (secretKey && !hashcode && isPaiementProSuccessCode(responsecode)) {
    console.error('[PaiementPro webhook] missing hashcode on success');
    return new Response(JSON.stringify({ error: 'Missing hashcode' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let transaction: Record<string, unknown> | null = null;

  const byPaymentId = await supabase
    .from('transactions')
    .select(
      'id,status,order_id,store_id,payment_id,amount,currency,customer_email,metadata,webhook_attempts'
    )
    .eq('payment_id', referenceNumber)
    .eq('payment_provider', 'paiement_pro')
    .maybeSingle();
  if (byPaymentId.data) transaction = byPaymentId.data as Record<string, unknown>;

  if (!transaction && ctx.transaction_id) {
    const byId = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,amount,currency,customer_email,metadata,webhook_attempts'
      )
      .eq('id', String(ctx.transaction_id))
      .eq('payment_provider', 'paiement_pro')
      .maybeSingle();
    if (byId.data) transaction = byId.data as Record<string, unknown>;
  }

  if (!transaction && ctx.order_id) {
    const byOrder = await supabase
      .from('transactions')
      .select(
        'id,status,order_id,store_id,payment_id,amount,currency,customer_email,metadata,webhook_attempts'
      )
      .eq('order_id', String(ctx.order_id))
      .eq('payment_provider', 'paiement_pro')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byOrder.data) transaction = byOrder.data as Record<string, unknown>;
  }

  if (!transaction) {
    console.error('[PaiementPro webhook] transaction not found', {
      referenceNumber: referenceNumber.slice(0, 24),
    });
    return new Response(JSON.stringify({ success: true, message: 'transaction_not_found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const transactionId = String(transaction.id);
  const orderId = transaction.order_id ? String(transaction.order_id) : null;
  const externalEventId = `paiement_pro:${referenceNumber}:${String(responsecode ?? 'na')}`;
  const eventType = isPaiementProSuccessCode(responsecode)
    ? 'paiement_pro.payment.success'
    : 'paiement_pro.payment.failed';

  const isNew = await recordWebhookEvent(
    supabase,
    'paiement_pro',
    externalEventId,
    eventType,
    {
      referenceNumber,
      responsecode,
      amount: amountRaw,
      hash_matched: hashCheck.matchedFormula ?? null,
    },
    orderId,
    transactionId
  );
  if (!isNew) {
    return new Response(JSON.stringify({ success: true, message: 'already_processed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!isPaiementProSuccessCode(responsecode)) {
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        metadata: {
          ...((transaction.metadata as Record<string, unknown>) || {}),
          paiement_pro_responsecode: responsecode,
          paiement_pro_webhook_at: new Date().toISOString(),
        },
      })
      .eq('id', transactionId);
    await markWebhookProcessed(supabase, 'paiement_pro', externalEventId);
    return new Response(JSON.stringify({ success: true, status: 'failed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const paidAmount = Number(amountRaw);
  if (Number.isFinite(paidAmount) && orderId) {
    const amountCheck = await validateOrderPaymentAmount(supabase, orderId, paidAmount);
    if (!amountCheck.valid) {
      console.error('[PaiementPro webhook] amount mismatch', amountCheck);
      await supabase.from('transactions').update({ status: 'failed' }).eq('id', transactionId);
      await markWebhookProcessed(supabase, 'paiement_pro', externalEventId);
      return new Response(JSON.stringify({ error: 'amount_mismatch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } else if (
    Number.isFinite(paidAmount) &&
    Math.round(paidAmount) !== Math.round(Number(transaction.amount))
  ) {
    console.error('[PaiementPro webhook] tx amount mismatch');
    await supabase.from('transactions').update({ status: 'failed' }).eq('id', transactionId);
    await markWebhookProcessed(supabase, 'paiement_pro', externalEventId);
    return new Response(JSON.stringify({ error: 'amount_mismatch' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { orderId: completedOrderId, alreadyCompleted } = await completeTransactionAndOrder(
    supabase,
    transactionId,
    {
      provider_payment_intent_id: referenceNumber,
      paymentProviderUsed: 'paiement_pro',
      webhookPayload: {
        referenceNumber,
        responsecode,
        amount: amountRaw,
        hash_formula: hashCheck.matchedFormula ?? null,
      },
      externalEventId,
      eventType,
    }
  );

  if (!alreadyCompleted && completedOrderId) {
    await runPostOrderPaymentFulfillment(supabase, completedOrderId).catch(err =>
      console.error('[PaiementPro webhook] fulfillment failed', err)
    );
  }

  await markWebhookProcessed(supabase, 'paiement_pro', externalEventId);

  return new Response(
    JSON.stringify({
      success: true,
      status: 'completed',
      transactionId,
      orderId: completedOrderId,
      alreadyCompleted,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
