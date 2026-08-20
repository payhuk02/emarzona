/**
 * Admin-gated MoneyFusion payout for store_withdrawals (seller mobile money).
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';
import { assertPlatformAdmin, createSupabaseUserClient } from './supabase-admin.ts';
import {
  inferCountryCodeFromPhone,
  initiateMoneyFusionWithdraw,
  resolveWithdrawMode,
  MONEYFUSION_WITHDRAW_MIN_AMOUNT,
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

  const amount = Number(withdrawal.amount);
  if (!Number.isFinite(amount) || amount < MONEYFUSION_WITHDRAW_MIN_AMOUNT) {
    return {
      status: 422,
      body: {
        success: false,
        error: `Montant minimum MoneyFusion : ${MONEYFUSION_WITHDRAW_MIN_AMOUNT} ${String(withdrawal.currency || 'XOF').toUpperCase()} (reçu : ${amount})`,
        code: 'moneyfusion_min_amount',
        requires_manual: true,
        retryable: false,
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

  const existingMf =
    details.moneyfusion_payout && typeof details.moneyfusion_payout === 'object'
      ? (details.moneyfusion_payout as Record<string, unknown>)
      : null;
  const existingToken =
    typeof existingMf?.tokenPay === 'string' ? existingMf.tokenPay.trim() : '';
  if (existingToken) {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Payout already initiated (tokenPay present in payment_details)',
        tokenPay: existingToken,
        status: withdrawal.status,
      },
    };
  }
  if (existingMf?.payout_status === 'initiating') {
    return {
      status: 409,
      body: {
        success: false,
        error: 'Payout initiation already in progress for this withdrawal',
        status: withdrawal.status,
      },
    };
  }

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

  // Refresh + re-check available_balance for THIS store only (never cross-store).
  await supabaseAdmin.rpc('update_store_earnings', { p_store_id: withdrawal.store_id });

  const { data: earnings } = await supabaseAdmin
    .from('store_earnings')
    .select('available_balance, withdrawals_blocked, withdrawals_blocked_reason')
    .eq('store_id', withdrawal.store_id)
    .maybeSingle();

  if (earnings?.withdrawals_blocked) {
    return {
      status: 403,
      body: {
        success: false,
        error: `Retraits bloqués pour cette boutique: ${earnings.withdrawals_blocked_reason || ''}`,
      },
    };
  }

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
          error: `Solde insuffisant pour la boutique ${withdrawal.store_id}. Disponible après autres pending: ${availableAfterPending} (demande: ${withdrawal.amount})`,
          store_id: withdrawal.store_id,
          available_after_pending: availableAfterPending,
          requested: Number(withdrawal.amount),
        },
      };
    }
  }

  const now = new Date().toISOString();
  const claimPlaceholder = `mf-claim:${withdrawal.id}`;

  // Claim row first so concurrent admins cannot double-pay.
  // Placeholder transaction_reference blocks retries until tokenPay is persisted (or rolled back).
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('store_withdrawals')
    .update({
      status: 'processing',
      approved_at: now,
      approved_by: adminId,
      transaction_reference: claimPlaceholder,
      payment_details: {
        ...details,
        moneyfusion_payout: {
          ...(existingMf || {}),
          payout_status: 'initiating',
          claim_placeholder: claimPlaceholder,
          initiated_at: now,
          initiated_by: adminId,
        },
      },
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
    const isRetryableMode =
      /momentanément indisponible|momentanement indisponible|réessayer plus tard|reesayer plus tard|solde|minimum/i.test(
        withdraw.message
      );
    // Config / transient MF errors — keep row pending so admin can retry.
    if (isIpBlock || isRetryableMode) {
      await supabaseAdmin
        .from('store_withdrawals')
        .update({
          status: 'pending',
          approved_at: null,
          approved_by: null,
          transaction_reference: null,
          failure_reason: withdraw.message,
          payment_details: {
            ...details,
            moneyfusion_payout: {
              payout_status: 'failed_retryable',
              last_error: withdraw.message,
              failed_at: new Date().toISOString(),
            },
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id)
        .eq('transaction_reference', claimPlaceholder);

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
        transaction_reference: null,
        payment_details: {
          ...details,
          moneyfusion_payout: {
            payout_status: 'failed',
            last_error: withdraw.message,
            failed_at: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', withdrawal.id)
      .eq('transaction_reference', claimPlaceholder);

    return {
      status: 422,
      body: { success: false, error: withdraw.message, requires_manual: true },
    };
  }

  // Persist real tokenPay (replaces claim placeholder).
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
    .eq('id', withdrawal.id)
    .eq('transaction_reference', claimPlaceholder);

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
      store_id: withdrawal.store_id,
      tokenPay: withdraw.tokenPay,
      amount: Number(withdrawal.amount),
      currency: String(withdrawal.currency || 'XOF').toUpperCase(),
      status: 'processing',
      mode: 'moneyfusion_payout',
      platform_withdrawal_fee: 0,
      note: 'No platform fee on withdrawal; sales commission already deducted in available_balance',
    },
  };
}
