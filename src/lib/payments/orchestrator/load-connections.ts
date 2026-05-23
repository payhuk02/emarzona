/**
 * Charge les connexions paiement actives d'une boutique
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { StorePaymentConnection } from '@/types/store-payment-connection';

const CONNECTION_FIELDS =
  'id, store_id, provider, connection_mode, external_account_id, external_account_status, capabilities, default_currency, livemode, onboarding_completed_at, last_synced_at, metadata';

export async function loadStorePaymentConnections(
  storeId: string
): Promise<StorePaymentConnection[]> {
  const { data, error } = await supabase
    .from('store_payment_connections' as never)
    .select(CONNECTION_FIELDS)
    .eq('store_id', storeId);

  if (error) {
    logger.warn('loadStorePaymentConnections failed, using empty list', {
      storeId,
      error: error.message,
    });
    return [];
  }

  return (data ?? []) as unknown as StorePaymentConnection[];
}

export async function loadStoreForcePlatformPayments(storeId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('stores')
    .select('force_platform_payments' as never)
    .eq('id', storeId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  const row = data as { force_platform_payments?: boolean | null };
  return Boolean(row.force_platform_payments);
}
