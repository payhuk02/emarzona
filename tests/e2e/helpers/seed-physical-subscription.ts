import type { SupabaseClient } from '@supabase/supabase-js';

type PhysicalPlanRow = { id: string; trial_days: number | null };

const PHYSICAL_BASIC_PLAN = {
  slug: 'physical_basic',
  name: 'Physique — Basic',
  description: 'Abonnement requis pour vendre des produits physiques.',
  applies_to_product_type: 'physical',
  trial_days: 30,
  monthly_price: 7500,
  yearly_price: 0,
  max_products: 50,
  max_variants_per_product: 3,
  max_warehouses: 0,
  features: ['Produits physiques', 'Essai 30 jours'],
  display_order: 0,
  is_active: true,
  is_public: true,
} as const;

async function resolvePhysicalBasicPlan(admin: SupabaseClient): Promise<PhysicalPlanRow> {
  const { data: plan, error: planError } = await admin
    .from('platform_vendor_plans')
    .select('id, trial_days')
    .eq('slug', PHYSICAL_BASIC_PLAN.slug)
    .eq('is_active', true)
    .maybeSingle();

  if (planError) throw planError;
  if (plan?.id) return plan as PhysicalPlanRow;

  const { data: upserted, error: upsertError } = await admin
    .from('platform_vendor_plans')
    .upsert(PHYSICAL_BASIC_PLAN, { onConflict: 'slug' })
    .select('id, trial_days')
    .single();

  if (upsertError) throw upsertError;
  if (!upserted?.id) {
    throw new Error(
      'platform_vendor_plans.physical_basic not found — run bootstrap patches on E2E Supabase'
    );
  }

  return upserted as PhysicalPlanRow;
}

/**
 * Grants physical product insert access (store_platform_subscriptions trialing/active).
 * Required when E2E seeds physical products on non-physical stores (mixed cart) or service stores.
 */
export async function seedStorePhysicalSubscriptionTrial(
  admin: SupabaseClient,
  storeId: string
): Promise<void> {
  const plan = await resolvePhysicalBasicPlan(admin);

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
