import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionPaymentAttemptRow = {
  id: string;
  status: string;
  provider: string;
  external_transaction_id: string | null;
  failure_reason: string | null;
  attempted_at: string;
  invoice_id: string;
};

export function useSubscriptionPaymentAttempts(storeId?: string | null) {
  return useQuery({
    queryKey: ['subscription-payment-attempts', storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<SubscriptionPaymentAttemptRow[]> => {
      if (!storeId) return [];

      const { data: invoices, error: invoiceError } = await supabase
        .from('subscription_invoices' as never)
        .select('id')
        .eq('store_id', storeId);

      if (invoiceError) throw invoiceError;

      const invoiceIds = ((invoices ?? []) as { id: string }[]).map(i => i.id);
      if (invoiceIds.length === 0) return [];

      const { data, error } = await supabase
        .from('subscription_payment_attempts' as never)
        .select(
          'id, status, provider, external_transaction_id, failure_reason, attempted_at, invoice_id'
        )
        .in('invoice_id', invoiceIds)
        .order('attempted_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      return (data ?? []) as SubscriptionPaymentAttemptRow[];
    },
  });
}
