import { useQuery } from '@tanstack/react-query';
import { fetchCustomerHubSummary } from '@/lib/customer/fetch-customer-hub-rpc';

export function useCustomerHubSummary(userId: string | undefined, limit = 5, activeOnly = true) {
  return useQuery({
    queryKey: ['customer-hub-summary', userId, limit, activeOnly],
    queryFn: () => fetchCustomerHubSummary(userId!, limit, activeOnly),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
