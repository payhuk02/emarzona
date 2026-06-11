import { supabase } from '@/integrations/supabase/client';

export async function setSubscriptionAutoRenew(storeId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.rpc('set_subscription_auto_renew' as never, {
    p_store_id: storeId,
    p_enabled: enabled,
  });

  if (error) {
    throw new Error(error.message);
  }
}
