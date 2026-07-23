/**
 * MoneyFusion seller refund — payin has no refund API; reverse via payout withdraw.
 * Shared so it can run as moneyfusion action=refund_payment (function-slot limit).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { assertStoreOwner, createSupabaseUserClient } from './supabase-admin.ts';
import { applyPaymentRefund } from './apply-payment-refund.ts';
import {
  inferCountryCodeFromPhone,
  initiateMoneyFusionWithdraw,
  resolveWithdrawMode,
} from './moneyfusion-payout.ts';

export interface MoneyFusionRefundBody {
  transactionId: string;
  amount?: number;
  reason?: string;
  confirmManual?: boolean;
}

function readPhone(
  meta: Record<string, unknown> | null,
  webhook: Record<string, unknown> | null
): string | null {
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

function readMoyen(
  meta: Record<string, unknown> | null,
  webhook: Record<string, unknown> | null
): string | null {
  const candidates = [webhook?.moyen, meta?.moyen, meta?.payment_method];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
  }
  return null;
}

export async function handleMoneyFusionRefund(
  supabaseAdmin: SupabaseClient,
  authHeader: string | null,
  body: MoneyFusionRefundBody
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!body.transactionId) {
    return { status: 400, body: { success: false, error: 'transactionId is required' } };
  }

  const { data: transaction, error: txError } = await supabaseAdmin
    .from('transactions')
    .select(
      'id, store_id, status, amount, currency, payment_provider, payment_id, refunded_amount, metadata, last_webhook_payload, customer_email'
    )
    .eq('id', body.transactionId)
    .single();

  if (txError || !transaction) {
    return { status: 404, body: { success: false, error: 'Transaction not found' } };
  }

  if (transaction.payment_provider !== 'moneyfusion') {
    return { status: 400, body: { success: false, error: 'Not a MoneyFusion transaction' } };
  }

  const supabaseUser = createSupabaseUserClient(authHeader);
  await assertStoreOwner(supabaseUser, transaction.store_id);

  if (!['completed', 'partially_refunded'].includes(String(transaction.status ?? ''))) {
    return {
      status: 400,
      body: { success: false, error: `Cannot refund transaction with status: ${transaction.status}` },
    };
  }

  const meta =
    transaction.metadata && typeof transaction.metadata === 'object'
      ? (transaction.metadata as Record<string, unknown>)
      : null;
  const webhookPayload =
    transaction.last_webhook_payload && typeof transaction.last_webhook_payload === 'object'
      ? (transaction.last_webhook_payload as Record<string, unknown>)
      : null;

  const existingRefund =
    meta?.moneyfusion_refund && typeof meta.moneyfusion_refund === 'object'
      ? (meta.moneyfusion_refund as Record<string, unknown>)
      : null;
  if (
    existingRefund &&
    String(existingRefund.payout_status || '') === 'pending' &&
    body.confirmManual !== true
  ) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'A MoneyFusion refund payout is already pending for this transaction',
        refund_id: existingRefund.tokenPay ?? null,
        status: 'processing',
      },
    };
  }

  const txAmount = Number(transaction.amount ?? 0);
  const alreadyRefunded = Number(transaction.refunded_amount ?? 0);
  const refundAmount = body.amount ?? Math.max(0, txAmount - alreadyRefunded);
  if (refundAmount <= 0 || alreadyRefunded + refundAmount > txAmount + 0.01) {
    return { status: 400, body: { success: false, error: 'Invalid refund amount' } };
  }

  const currency = String(transaction.currency || 'XOF').toUpperCase();

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

    return {
      status: 200,
      body: {
        success: true,
        refund_id: refundId,
        amount: refundAmount,
        currency,
        status: 'refunded',
        mode: 'manual_confirmed',
      },
    };
  }

  const privateKey = (Deno.env.get('MONEYFUSION_PRIVATE_KEY') || '').trim();
  if (!privateKey) {
    return {
      status: 501,
      body: {
        success: false,
        error:
          'MoneyFusion refund API not configured (MONEYFUSION_PRIVATE_KEY). Refund via MoneyFusion dashboard then retry with confirmManual: true.',
        requires_manual: true,
      },
    };
  }

  const phone = readPhone(meta, webhookPayload);
  if (!phone) {
    return {
      status: 400,
      body: {
        success: false,
        error:
          'Customer phone missing on transaction — cannot auto-refund via MoneyFusion payout. Use dashboard refund + confirmManual.',
        requires_manual: true,
      },
    };
  }

  const countryCode = inferCountryCodeFromPhone(phone);
  const moyen = readMoyen(meta, webhookPayload);
  const withdrawMode = await resolveWithdrawMode(moyen, countryCode, privateKey);
  if (!withdrawMode) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Unable to resolve MoneyFusion withdraw_mode for moyen=${moyen ?? 'unknown'}`,
        requires_manual: true,
      },
    };
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
    return {
      status: 502,
      body: { success: false, error: withdraw.message, requires_manual: true },
    };
  }

  // P0-C: do NOT book ledger until payout.session.completed webhook.
  await supabaseAdmin
    .from('transactions')
    .update({
      metadata: {
        ...(meta || {}),
        moneyfusion_refund: {
          mode: 'payout',
          tokenPay: withdraw.tokenPay,
          amount: refundAmount,
          currency,
          withdraw_mode: withdrawMode,
          countryCode,
          reason: body.reason ?? null,
          payout_status: 'pending',
          initiated_at: new Date().toISOString(),
        },
      },
    })
    .eq('id', body.transactionId);

  return {
    status: 200,
    body: {
      success: true,
      refund_id: withdraw.tokenPay,
      amount: refundAmount,
      currency,
      status: 'processing',
      mode: 'payout',
      message: 'Refund payout initiated — ledger updates on payout.session.completed',
    },
  };
}
