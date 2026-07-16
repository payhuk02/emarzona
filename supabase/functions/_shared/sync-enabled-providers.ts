import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.58.0';

/** Met à jour stores.enabled_payment_providers depuis les connexions actives */
export async function syncStoreEnabledPaymentProviders(
  supabase: SupabaseClient,
  storeId: string
): Promise<void> {
  const { data: connections } = await supabase
    .from('store_payment_connections')
    .select('provider, external_account_status')
    .eq('store_id', storeId)
    .eq('external_account_status', 'active');

  const providers = (connections ?? []).map(c => c.provider);
  if (!providers.includes('geniuspay_platform')) {
    providers.push('geniuspay_platform');
  }

  await supabase.from('stores').update({ enabled_payment_providers: providers }).eq('id', storeId);
}
