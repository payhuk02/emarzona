import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Grants physical product insert access (store_platform_subscriptions trialing/active).
 * Required when E2E seeds physical products on non-physical stores (mixed cart) or service stores.
 */
export async function seedStorePhysicalSubscriptionTrial(
  admin: SupabaseClient,
  storeId: string
): Promise<void> {
  const { data: plan, error: planError } = await admin
    .from('platform_vendor_plans')
    .select('id, trial_days')
    .eq('slug', 'physical_basic')
    .eq('is_active', true)
    .maybeSingle();

  if (planError) throw planError;
  if (!plan?.id) {
    throw new Error(
      'platform_vendor_plans.physical_basic not found — run bootstrap on E2E Supabase'
    );
  }

  const trialDays =
    typeof plan.trial_days === 'number' && plan.trial_days > 0 ? plan.trial_days : 30;
  const now = new Date();
  const trialEnds = new Date(now);
  trialEnds.setDate(trialEnds.getDate() + trialDays);
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + 30);

  const { error: upsertError } = await admin.from('store_platform_subscriptions').upsert(
    {
      store_id: storeId,
      plan_id: plan.id,
      status: 'trialing',
      billing_cycle: 'monthly',
      mrr_amount: 0,
      trial_ends_at: trialEnds.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    },
    { onConflict: 'store_id' }
  );

  if (upsertError) throw upsertError;
}
