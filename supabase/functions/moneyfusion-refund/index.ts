/**
 * MoneyFusion — remboursement vendeur (via API payout / retrait).
 * Payin n'expose pas de refund ; on reverse le montant vers le MSISDN d'origine.
 *
 * Secrets:
 * - MONEYFUSION_PRIVATE_KEY (dashboard MF → Paramètres ; IP Edge Functions whitelistée)
 *
 * Body:
 * - transactionId (required)
 * - amount? partial
 * - reason?
 * - confirmManual? — si true, enregistre le refund DB après remboursement manuel dashboard MF
 *   (sans appel payout). Utile si la clé privée / IP n'est pas configurée.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { buildCorsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  assertStoreOwner,
  createSupabaseAdmin,
  createSupabaseUserClient,
} from '../_shared/supabase-admin.ts';
import { applyPaymentRefund } from '../_shared/apply-payment-refund.ts';
import {
  inferCountryCodeFromPhone,
  initiateMoneyFusionWithdraw,
  resolveWithdrawMode,
} from '../_shared/moneyfusion-payout.ts';

interface RefundBody {
  transactionId: string;
  amount?: number;
  reason?: string;
  confirmManual?: boolean;
}

function readPhone(meta: Record<string, unknown> | null, webhook: Record<string, unknown> | null): string | null {
  const candidates = [
    meta?.customer_phone,
    meta?.numeroSend,
    meta?.phone,
    webhook?.numeroSend,
    webhook?.numeroRetrait,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.replace(/\D/g, '').length >= 8) return c;
  }
  return null;
}

function readMoyen(meta: Record<string, unknown> | null, webhook: Record<string, unknown> | null): string | null {
  const candidates = [webhook?.moyen, meta?.moyen, meta?.payment_method];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
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
        'id, store_id, status, amount, currency, payment_provider, payment_id, refunded_amount, metadata, last_webhook_payload, customer_email'
      )
      .eq('id', body.transactionId)
      .single();

    if (txError || !transaction) {
      return jsonResponse({ error: 'Transaction not found' }, 404, origin);
    }

    if (transaction.payment_provider !== 'moneyfusion') {
      return jsonResponse({ error: 'Not a MoneyFusion transaction' }, 400, origin);
    }

    await assertStoreOwner(supabaseUser, transaction.store_id);

    if (!['completed', 'partially_refunded'].includes(String(transaction.status ?? ''))) {
      return jsonResponse(
        { error: `Cannot refund transaction with status: ${transaction.status}` },
        400,
        origin
      );
    }

    const txAmount = Number(transaction.amount ?? 0);
    const alreadyRefunded = Number(transaction.refunded_amount ?? 0);
    const refundAmount = body.amount ?? Math.max(0, txAmount - alreadyRefunded);
    if (refundAmount <= 0 || alreadyRefunded + refundAmount > txAmount + 0.01) {
      return jsonResponse({ error: 'Invalid refund amount' }, 400, origin);
    }

    const currency = String(transaction.currency || 'XOF').toUpperCase();
    const meta =
      transaction.metadata && typeof transaction.metadata === 'object'
        ? (transaction.metadata as Record<string, unknown>)
        : null;
    const webhookPayload =
      transaction.last_webhook_payload && typeof transaction.last_webhook_payload === 'object'
        ? (transaction.last_webhook_payload as Record<string, unknown>)
        : null;

    // Chemin manuel : vendeur a déjà remboursé via le dashboard MoneyFusion
    if (body.confirmManual === true) {
      const refundId = `mf-manual-${body.transactionId.slice(0, 8)}-${Date.now()}`;
      await applyPaymentRefund(supabaseAdmin, body.transactionId, {
        refundId,
        amount: refundAmount,
        currency,
        reason: body.reason ?? 'Manual MoneyFusion refund confirmed',
        provider: 'moneyfusion',
      });

      await supabaseAdmin
        .from('transactions')
        .update({
          metadata: {
            ...(meta || {}),
            moneyfusion_refund: {
              mode: 'manual_confirmed',
              refund_id: refundId,
              amount: refundAmount,
              reason: body.reason ?? null,
              confirmed_at: new Date().toISOString(),
            },
          },
        })
        .eq('id', body.transactionId);

      return jsonResponse(
        {
          success: true,
          refund_id: refundId,
          amount: refundAmount,
          currency,
          status: 'refunded',
          mode: 'manual_confirmed',
        },
        200,
        origin
      );
    }

    const privateKey = (Deno.env.get('MONEYFUSION_PRIVATE_KEY') || '').trim();
    if (!privateKey) {
      return jsonResponse(
        {
          success: false,
          error:
            'MoneyFusion refund API not configured (MONEYFUSION_PRIVATE_KEY). Refund via MoneyFusion dashboard then retry with confirmManual: true.',
          requires_manual: true,
        },
        501,
        origin
      );
    }

    const phone = readPhone(meta, webhookPayload);
    if (!phone) {
      return jsonResponse(
        {
          success: false,
          error:
            'Customer phone missing on transaction — cannot auto-refund via MoneyFusion payout. Use dashboard refund + confirmManual.',
          requires_manual: true,
        },
        400,
        origin
      );
    }

    const countryCode = inferCountryCodeFromPhone(phone);
    const moyen = readMoyen(meta, webhookPayload);
    const withdrawMode = await resolveWithdrawMode(moyen, countryCode, privateKey);
    if (!withdrawMode) {
      return jsonResponse(
        {
          success: false,
          error: `Unable to resolve MoneyFusion withdraw_mode for moyen=${moyen ?? 'unknown'}`,
          requires_manual: true,
        },
        400,
        origin
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const webhookUrl = `${supabaseUrl}/functions/v1/moneyfusion-webhook`;

    const withdraw = await initiateMoneyFusionWithdraw({
      privateKey,
      countryCode,
      phone,
      amount: refundAmount,
      withdrawMode,
      webhookUrl,
    });

    if (!withdraw.ok) {
      return jsonResponse(
        {
          success: false,
          error: withdraw.message,
          requires_manual: true,
        },
        502,
        origin
      );
    }

    await applyPaymentRefund(supabaseAdmin, body.transactionId, {
      refundId: withdraw.tokenPay,
      amount: refundAmount,
      currency,
      reason: body.reason ?? 'Customer request',
      provider: 'moneyfusion',
    });

    await supabaseAdmin
      .from('transactions')
      .update({
        metadata: {
          ...(meta || {}),
          moneyfusion_refund: {
            mode: 'payout',
            tokenPay: withdraw.tokenPay,
            amount: refundAmount,
            withdraw_mode: withdrawMode,
            countryCode,
            reason: body.reason ?? null,
            initiated_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', body.transactionId);

    return jsonResponse(
      {
        success: true,
        refund_id: withdraw.tokenPay,
        amount: refundAmount,
        currency,
        status: 'refunded',
        mode: 'payout',
      },
      200,
      origin
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('moneyfusion-refund error:', message);
    const status = message === 'Unauthorized' || message.includes('access denied') ? 403 : 500;
    return jsonResponse({ error: message, success: false }, status, origin);
  }
});
