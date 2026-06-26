import { useQuery } from '@tanstack/react-query';
import {
  AdminTransactionTab,
  DEFAULT_ADMIN_TRANSACTION_PAGE_SIZE,
  fetchAdminTransactionStats,
  fetchAdminTransactionsPage,
} from '@/lib/admin/admin-transactions-reconciliation-query';

export function useAdminTransactionsList(options: {
  page: number;
  pageSize: number;
  tab: AdminTransactionTab;
  search: string;
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  const { page, pageSize, tab, search, enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: ['admin-transactions-reconciliation', page, pageSize, tab, search],
    queryFn: () => fetchAdminTransactionsPage({ page, pageSize, tab, search }),
    enabled,
    placeholderData: previous => previous,
    refetchInterval,
  });
}

export function useAdminTransactionStats(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['admin-transactions-stats'],
    queryFn: fetchAdminTransactionStats,
    enabled: options?.enabled ?? true,
  });
}

export { DEFAULT_ADMIN_TRANSACTION_PAGE_SIZE };
export type { AdminTransactionTab };
