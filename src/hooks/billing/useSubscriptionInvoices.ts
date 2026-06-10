import { useQuery } from '@tanstack/react-query';
import {
  fetchSubscriptionInvoices,
  type SubscriptionInvoiceRow,
} from '@/lib/billing/subscription-renewal';

export function useSubscriptionInvoices(storeId?: string | null) {
  return useQuery<SubscriptionInvoiceRow[]>({
    queryKey: ['subscription-invoices', storeId],
    queryFn: () => fetchSubscriptionInvoices(storeId!),
    enabled: Boolean(storeId),
  });
}
