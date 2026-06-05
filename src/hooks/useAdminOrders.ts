import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_ADMIN_ORDER_PAGE_SIZE,
  fetchAdminOrderStats,
  fetchAdminOrdersPage,
  type AdminOrderTab,
} from '@/lib/admin/admin-orders-query';

export function useAdminOrderStats() {
  return useQuery({
    queryKey: ['admin-orders-stats'],
    queryFn: fetchAdminOrderStats,
    staleTime: 60_000,
  });
}

export function useAdminOrdersList(options: {
  page: number;
  pageSize: number;
  tab: AdminOrderTab;
  search: string;
}) {
  const { page, pageSize, tab, search } = options;

  return useQuery({
    queryKey: ['admin-orders', page, pageSize, tab, search],
    queryFn: () => fetchAdminOrdersPage({ page, pageSize, tab, search }),
    placeholderData: previous => previous,
  });
}

export { DEFAULT_ADMIN_ORDER_PAGE_SIZE };
