import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

export interface PhysicalVendorPlan {
  id: string;
  slug: string;
  monthly_price: number | string | null;
  currency?: string | null;
  trial_days?: number | null;
  applies_to_product_type: string;
}

export interface BillingMandateCustomer {
  email: string;
  name?: string | null;
  phone?: string | null;
  country?: string | null;
}

export function billingCustomerFromTransaction(transaction: {
  customer_email?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  metadata?: Record<string, unknown> | null;
}): BillingMandateCustomer | null {
  const email = transaction.customer_email?.trim();
  if (!email) return null;

  const meta = transaction.metadata ?? {};
  const country =
    (typeof meta.customerCountry === 'string' && meta.customerCountry) ||
    (typeof meta.customer_country === 'string' && meta.customer_country) ||
    null;

  return {
    email,
    name: transaction.customer_name ?? null,
    phone: transaction.customer_phone ?? null,
    country,
  };
}

export interface ActivatePhysicalSubscriptionInput {
  storeId: string;
  plan: PhysicalVendorPlan;
  transactionId: string;
  monerooTransactionId?: string | null;
  billingCustomer?: BillingMandateCustomer | null;
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
      auto_renew_enabled: true,
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

  if (input.billingCustomer?.email) {
    const { error: mandateError } = await supabase.rpc('save_subscription_billing_mandate', {
      p_subscription_id: data.id,
      p_store_id: input.storeId,
      p_customer_email: input.billingCustomer.email,
      p_customer_name: input.billingCustomer.name ?? null,
      p_customer_phone: input.billingCustomer.phone ?? null,
      p_customer_country: input.billingCustomer.country ?? null,
      p_moneroo_payment_id: input.monerooTransactionId ?? null,
      p_auto_renew_enabled: true,
    });

    if (mandateError) {
      console.warn('Failed to save billing mandate after activation:', mandateError.message);
    }
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
  billingCustomer?: BillingMandateCustomer | null;
  storeId?: string | null;
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

  const subscriptionId = String(data);

  if (input.billingCustomer?.email && input.storeId) {
    const { error: mandateError } = await supabase.rpc('save_subscription_billing_mandate', {
      p_subscription_id: subscriptionId,
      p_store_id: input.storeId,
      p_customer_email: input.billingCustomer.email,
      p_customer_name: input.billingCustomer.name ?? null,
      p_customer_phone: input.billingCustomer.phone ?? null,
      p_customer_country: input.billingCustomer.country ?? null,
      p_moneroo_payment_id: input.monerooTransactionId ?? null,
      p_auto_renew_enabled: true,
    });

    if (mandateError) {
      console.warn('Failed to update billing mandate after renewal:', mandateError.message);
    }
  }

  return { subscriptionId };
}

export interface ApplyPlanChangeInput {
  invoiceId: string;
  transactionId: string;
  monerooTransactionId?: string | null;
}

export async function applyPhysicalPlanChangeFromWebhook(
  supabase: SupabaseClient,
  input: ApplyPlanChangeInput
): Promise<{ subscriptionId: string }> {
  const { data, error } = await supabase.rpc('mark_subscription_plan_change_invoice_paid', {
    p_invoice_id: input.invoiceId,
    p_transaction_id: input.transactionId,
    p_external_transaction_id: input.monerooTransactionId ?? null,
  });

  if (error) {
    throw new Error(`plan_change_failed: ${error.message} (invoice=${input.invoiceId})`);
  }

  return { subscriptionId: String(data) };
}
