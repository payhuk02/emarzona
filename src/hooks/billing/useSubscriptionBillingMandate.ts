import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionBillingMandate = {
  auto_renew_enabled: boolean;
  customer_email: string;
  last_successful_at: string | null;
};

export type PendingAutoRenewCheckout = {
  checkout_url: string | null;
  invoice_id: string | null;
};

export function useSubscriptionBillingMandate(storeId?: string | null) {
  return useQuery({
    queryKey: ['subscription-billing-mandate', storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<{
      mandate: SubscriptionBillingMandate | null;
      pendingCheckout: PendingAutoRenewCheckout | null;
    }> => {
      if (!storeId) return { mandate: null, pendingCheckout: null };

      const { data: mandate, error: mandateError } = await supabase
        .from('subscription_billing_mandates' as never)
        .select('auto_renew_enabled, customer_email, last_successful_at')
        .eq('store_id', storeId)
        .maybeSingle();

      if (mandateError) throw mandateError;

      const { data: pendingInvoice, error: invoiceError } = await supabase
        .from('subscription_invoices' as never)
        .select('id, metadata')
        .eq('store_id', storeId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (invoiceError) throw invoiceError;

      const invoiceMeta = (
        pendingInvoice as { id: string; metadata?: Record<string, unknown> } | null
      )?.metadata;

      return {
        mandate: mandate as SubscriptionBillingMandate | null,
        pendingCheckout: pendingInvoice
          ? {
              checkout_url: (invoiceMeta?.auto_renew_checkout_url as string | undefined) ?? null,
              invoice_id: (pendingInvoice as { id: string }).id,
            }
          : null,
      };
    },
  });
}
