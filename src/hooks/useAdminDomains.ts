import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_ADMIN_DOMAIN_PAGE_SIZE,
  fetchAdminDomainStats,
  fetchAdminDomainsPage,
} from '@/lib/admin/admin-domains-query';

export function useAdminDomainsList(options: {
  page: number;
  pageSize: number;
  search: string;
  enabled?: boolean;
}) {
  const { page, pageSize, search, enabled = true } = options;

  return useQuery({
    queryKey: ['admin-domains', page, pageSize, search],
    queryFn: () => fetchAdminDomainsPage({ page, pageSize, search }),
    enabled,
    placeholderData: previous => previous,
  });
}

export function useAdminDomainStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-domains-stats'],
    queryFn: fetchAdminDomainStats,
    enabled: options?.enabled ?? true,
  });
}

export { DEFAULT_ADMIN_DOMAIN_PAGE_SIZE };
