import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

export interface PhysicalVendorPlan {
  id: string;
  slug: string;
  monthly_price: number | string | null;
  currency?: string | null;
  trial_days?: number | null;
  applies_to_product_type: string;
}

export interface ActivatePhysicalSubscriptionInput {
  storeId: string;
  plan: PhysicalVendorPlan;
  transactionId: string;
  monerooTransactionId?: string | null;
}

export interface ActivatePhysicalSubscriptionResult {
  subscriptionId: string;
  created: boolean;
}

/**
 * C5 — Active ou met à jour l'abonnement vendeur physique après paiement Moneroo.
 * Upsert sur store_id (évite l'échec silencieux si la row n'existe pas encore).
 */
export async function activatePhysicalSubscriptionFromWebhook(
  supabase: SupabaseClient,
  input: ActivatePhysicalSubscriptionInput
): Promise<ActivatePhysicalSubscriptionResult> {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const payload = {
    store_id: input.storeId,
    plan_id: input.plan.id,
    status: 'active',
    billing_cycle: 'monthly',
    mrr_amount: Number(input.plan.monthly_price ?? 0),
    current_period_start: now.toISOString(),
    current_period_end: periodEnd.toISOString(),
    trial_ends_at: null,
    payment_provider: 'moneroo_platform',
    external_subscription_id: input.monerooTransactionId ?? null,
    metadata: {
      last_transaction_id: input.transactionId,
      last_moneroo_transaction_id: input.monerooTransactionId ?? null,
      activated_via: 'moneroo_webhook',
      activated_at: now.toISOString(),
    },
    updated_at: now.toISOString(),
  };

  const { data: existing } = await supabase
    .from('store_platform_subscriptions')
    .select('id')
    .eq('store_id', input.storeId)
    .maybeSingle();

  const { data, error } = await supabase
    .from('store_platform_subscriptions')
    .upsert(payload, { onConflict: 'store_id' })
    .select('id')
    .single();

  if (error || !data?.id) {
    throw new Error(
      `physical_subscription_upsert_failed: ${error?.message ?? 'no row returned'} (store=${input.storeId})`
    );
  }

  return {
    subscriptionId: data.id,
    created: !existing?.id,
  };
}

export interface ApplySubscriptionRenewalInput {
  invoiceId: string;
  transactionId: string;
  monerooTransactionId?: string | null;
}

/**
 * Marks a renewal invoice paid and extends the subscription period.
 */
export async function applyPhysicalSubscriptionRenewalFromWebhook(
  supabase: SupabaseClient,
  input: ApplySubscriptionRenewalInput
): Promise<{ subscriptionId: string }> {
  const { data, error } = await supabase.rpc('mark_subscription_invoice_paid', {
    p_invoice_id: input.invoiceId,
    p_transaction_id: input.transactionId,
    p_external_transaction_id: input.monerooTransactionId ?? null,
  });

  if (error) {
    throw new Error(`subscription_renewal_failed: ${error.message} (invoice=${input.invoiceId})`);
  }

  return { subscriptionId: String(data) };
}
