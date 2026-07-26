import { useQuery } from '@tanstack/react-query';
import { fetchPlatformVisitorAnalytics } from '@/lib/admin/admin-platform-visitors';

export function useAdminPlatformVisitors(periodDays = 30) {
  return useQuery({
    queryKey: ['admin-platform-visitors', periodDays],
    queryFn: () => fetchPlatformVisitorAnalytics(periodDays),
    staleTime: 60_000,
  });
}
