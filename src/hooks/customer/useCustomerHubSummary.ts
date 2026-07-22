import { useQuery } from '@tanstack/react-query';
import { fetchCustomerHubSummary } from '@/lib/customer/fetch-customer-hub-rpc';

export function useCustomerHubSummary(
  userId: string | undefined,
  limit = 5,
  activeOnly = true,
  email?: string | null
) {
  return useQuery({
    queryKey: ['customer-hub-summary', userId, limit, activeOnly, email ?? null],
    queryFn: () => fetchCustomerHubSummary(userId!, limit, activeOnly, email),
    enabled: !!userId,
    staleTime: 60_000,
  });
}
