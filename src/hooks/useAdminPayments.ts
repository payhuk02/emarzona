import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_ADMIN_PAYMENT_PAGE_SIZE,
  fetchAdminPaymentStats,
  fetchAdminPaymentsPage,
  type AdminPaymentTab,
} from '@/lib/admin/admin-payments-query';

export function useAdminPaymentStats() {
  return useQuery({
    queryKey: ['admin-payments-stats'],
    queryFn: fetchAdminPaymentStats,
    staleTime: 60_000,
  });
}

export function useAdminPaymentsList(options: {
  page: number;
  pageSize: number;
  tab: AdminPaymentTab;
  search: string;
}) {
  const { page, pageSize, tab, search } = options;

  return useQuery({
    queryKey: ['admin-payments', page, pageSize, tab, search],
    queryFn: () => fetchAdminPaymentsPage({ page, pageSize, tab, search }),
    placeholderData: previous => previous,
  });
}

export { DEFAULT_ADMIN_PAYMENT_PAGE_SIZE };
