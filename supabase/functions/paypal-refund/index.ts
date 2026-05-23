/**
 * PayPal Commerce — remboursement capture (vendeur authentifié)
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import { formatPayPalAmount, refundPayPalCapture } from '../_shared/paypal-api.ts';
import { applyPaymentRefund } from '../_shared/apply-payment-refund.ts';

interface RefundBody {
  transactionId: string;
  amount?: number;
  reason?: string;
}

serve(async req => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: buildCorsHeaders(origin) });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, origin);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const supabaseUser = createSupabaseUserClient(authHeader);
    const supabaseAdmin = createSupabaseAdmin();
    const body = (await req.json()) as RefundBody;

    if (!body.transactionId) {
      return jsonResponse({ error: 'transactionId is required' }, 400, origin);
    }

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select(
        'id, store_id, status, amount, currency, payment_provider, provider_payment_intent_id'
      )
      .eq('id', body.transactionId)
      .single();

    if (txError || !transaction) {
      return jsonResponse({ error: 'Transaction not found' }, 404, origin);
    }

    if (transaction.payment_provider !== 'paypal_commerce') {
      return jsonResponse({ error: 'Not a PayPal Commerce transaction' }, 400, origin);
    }

    await assertStoreOwner(supabaseUser, transaction.store_id);

    const captureId = transaction.provider_payment_intent_id;
    if (!captureId) {
      return jsonResponse({ error: 'PayPal capture ID missing on transaction' }, 400, origin);
    }

    const txAmount = Number(transaction.amount ?? 0);
    const refundAmount = body.amount ?? txAmount;
    const currency = (transaction.currency || 'EUR').toUpperCase();

    const paypalRefund = await refundPayPalCapture(
      captureId,
      { currency, value: formatPayPalAmount(refundAmount) },
      body.reason
    );

    await applyPaymentRefund(supabaseAdmin, body.transactionId, {
      refundId: paypalRefund.id,
      amount: parseFloat(paypalRefund.amount?.value ?? String(refundAmount)),
      currency: paypalRefund.amount?.currency_code ?? currency,
      reason: body.reason,
      provider: 'paypal_commerce',
    });

    return jsonResponse(
      {
        success: true,
        refund_id: paypalRefund.id,
        amount: parseFloat(paypalRefund.amount?.value ?? String(refundAmount)),
        currency: paypalRefund.amount?.currency_code ?? currency,
        status: paypalRefund.status,
      },
      200,
      origin
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('paypal-refund error:', message);
    return jsonResponse({ error: message, success: false }, 500, origin);
  }
});
