/**
 * Admin-gated MoneyFusion payout for store_withdrawals (seller mobile money).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { assertPlatformAdmin, createSupabaseUserClient } from './supabase-admin.ts';
import {
  inferCountryCodeFromPhone,
  initiateMoneyFusionWithdraw,
  resolveWithdrawMode,
} from './moneyfusion-payout.ts';

export interface StoreWithdrawalPayoutBody {
  withdrawalId: string;
}

function normalizeCountryCode(raw: unknown, phone: string): string {
  if (typeof raw === 'string' && raw.trim()) {
    return raw.trim().toLowerCase();
  }
  return inferCountryCodeFromPhone(phone);
}

export async function handleMoneyFusionStoreWithdrawalPayout(
  supabaseAdmin: SupabaseClient,
  authHeader: string | null,
  body: StoreWithdrawalPayoutBody
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (!body.withdrawalId) {
    return { status: 400, body: { success: false, error: 'withdrawalId is required' } };
  }

  const supabaseUser = createSupabaseUserClient(authHeader);
  const { userId: adminId } = await assertPlatformAdmin(supabaseUser);

  const { data: withdrawal, error: wErr } = await supabaseAdmin
    .from('store_withdrawals')
    .select(
      'id, store_id, amount, currency, payment_method, payment_details, status, transaction_reference'
    )
    .eq('id', body.withdrawalId)
    .single();

  if (wErr || !withdrawal) {
    return { status: 404, body: { success: false, error: 'Withdrawal not found' } };
  }

  if (!['pending', 'processing'].includes(String(withdrawal.status))) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Cannot payout withdrawal with status: ${withdrawal.status}`,
      },
    };
  }

  if (withdrawal.payment_method !== 'mobile_money') {
    return {
      status: 400,
      body: {
        success: false,
        error: 'MoneyFusion payout only supports mobile_money withdrawals',
        requires_manual: true,
      },
    };
  }

  if (withdrawal.transaction_reference) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Payout already initiated for this withdrawal',
        refund_id: withdrawal.transaction_reference,
        status: 'processing',
      },
    };
  }

  const details =
    withdrawal.payment_details && typeof withdrawal.payment_details === 'object'
      ? (withdrawal.payment_details as Record<string, unknown>)
      : {};
  const phone = typeof details.phone === 'string' ? details.phone : '';
  if (phone.replace(/\D/g, '').length < 8) {
    return {
      status: 400,
      body: {
        success: false,
        error: 'Withdrawal payment_details.phone missing or invalid',
        requires_manual: true,
      },
    };
  }

  const privateKey = (Deno.env.get('MONEYFUSION_PRIVATE_KEY') || '').trim();
  if (!privateKey) {
    return {
      status: 501,
      body: {
        success: false,
        error: 'MONEYFUSION_PRIVATE_KEY not configured',
        requires_manual: true,
      },
    };
  }

  const countryCode = normalizeCountryCode(details.country, phone);
  const operator = typeof details.operator === 'string' ? details.operator : null;
  const withdrawMode = await resolveWithdrawMode(operator, countryCode, privateKey);
  if (!withdrawMode) {
    return {
      status: 400,
      body: {
        success: false,
        error: `Unable to resolve withdraw_mode for operator=${operator ?? 'unknown'} country=${countryCode}`,
        requires_manual: true,
      },
    };
  }

  const { data: earnings } = await supabaseAdmin
    .from('store_earnings')
    .select('available_balance')
    .eq('store_id', withdrawal.store_id)
    .maybeSingle();

  // available_balance already excludes processing/completed.
  // Also reserve other pending so concurrent approvals cannot over-draw.
  if (withdrawal.status === 'pending') {
    const { data: otherPending } = await supabaseAdmin
      .from('store_withdrawals')
      .select('amount')
      .eq('store_id', withdrawal.store_id)
      .eq('status', 'pending')
      .neq('id', withdrawal.id);

    const otherPendingSum = (otherPending || []).reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );
    const availableAfterPending =
      Number(earnings?.available_balance ?? 0) - otherPendingSum;

    if (Number(withdrawal.amount) > availableAfterPending + 0.01) {
      return {
        status: 400,
        body: {
          success: false,
          error: `Insufficient store balance after other pending (${availableAfterPending}) for withdrawal ${withdrawal.amount}`,
        },
      };
    }
  }

  const now = new Date().toISOString();

  // Claim row first so concurrent admins cannot double-pay.
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('store_withdrawals')
    .update({
      status: 'processing',
      approved_at: now,
      approved_by: adminId,
      updated_at: now,
    })
    .eq('id', withdrawal.id)
    .eq('status', withdrawal.status)
    .is('transaction_reference', null)
    .select('id')
    .maybeSingle();

  if (claimErr) {
    return { status: 500, body: { success: false, error: claimErr.message } };
  }
  if (!claimed) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Withdrawal already claimed or payout already initiated',
      },
    };
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const webhookUrl = `${supabaseUrl}/functions/v1/moneyfusion-webhook`;

  const withdraw = await initiateMoneyFusionWithdraw({
    privateKey,
    countryCode,
    phone,
    amount: Number(withdrawal.amount),
    withdrawMode,
    webhookUrl,
  });

  if (!withdraw.ok) {
    const isIpBlock = /ip.*autoris|non autoris/i.test(withdraw.message);
    // IP whitelist errors are config issues — keep row pending so admin can retry
    // after fixing MoneyFusion, instead of burning the request as "failed".
    if (isIpBlock) {
      await supabaseAdmin
        .from('store_withdrawals')
        .update({
          status: 'pending',
          approved_at: null,
          approved_by: null,
          failure_reason: withdraw.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id);

      return {
        status: 422,
        body: {
          success: false,
          error: withdraw.message,
          code: 'moneyfusion_ip_not_authorized',
          requires_manual: true,
          retryable: true,
        },
      };
    }

    await supabaseAdmin
      .from('store_withdrawals')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: withdraw.message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawal.id);

    return {
      status: 422,
      body: { success: false, error: withdraw.message, requires_manual: true },
    };
  }

  // Persist tokenPay immediately after initiate (narrow webhook race window).
  const { error: tokenErr } = await supabaseAdmin
    .from('store_withdrawals')
    .update({
      transaction_reference: withdraw.tokenPay,
      payment_details: {
        ...details,
        moneyfusion_payout: {
          tokenPay: withdraw.tokenPay,
          withdraw_mode: withdrawMode,
          countryCode,
          payout_status: 'pending',
          initiated_at: new Date().toISOString(),
          initiated_by: adminId,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', withdrawal.id);

  if (tokenErr) {
    return {
      status: 500,
      body: {
        success: false,
        error: `Payout initiated but failed to persist tokenPay: ${tokenErr.message}`,
        tokenPay: withdraw.tokenPay,
        requires_manual: true,
      },
    };
  }

  return {
    status: 200,
    body: {
      success: true,
      withdrawal_id: withdrawal.id,
      tokenPay: withdraw.tokenPay,
      amount: Number(withdrawal.amount),
      currency: String(withdrawal.currency || 'XOF').toUpperCase(),
      status: 'processing',
      mode: 'moneyfusion_payout',
    },
  };
}
