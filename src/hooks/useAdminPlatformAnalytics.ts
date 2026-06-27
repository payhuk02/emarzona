import { useQuery } from '@tanstack/react-query';
import { fetchPlatformAdminAnalytics } from '@/lib/admin/admin-platform-analytics';

export function useAdminPlatformAnalytics(periodDays = 30) {
  return useQuery({
    queryKey: ['admin-platform-analytics', periodDays],
    queryFn: () => fetchPlatformAdminAnalytics(periodDays),
    staleTime: 60_000,
  });
}
