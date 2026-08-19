import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMoneyFusionOrphanPayments,
  fetchPaymentRepairActivity,
  ignoreMoneyFusionOrphan,
  resolveMoneyFusionOrphan,
} from '@/lib/admin/admin-moneyfusion-orphans';
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

export function useMoneyFusionOrphans(status: 'open' | 'all' = 'open') {
  return useQuery({
    queryKey: ['admin-moneyfusion-orphans', status],
    queryFn: () => fetchMoneyFusionOrphanPayments(status),
  });
}

export function usePaymentRepairActivity() {
  return useQuery({
    queryKey: ['admin-payment-repair-activity'],
    queryFn: fetchPaymentRepairActivity,
  });
}

export function useResolveMoneyFusionOrphan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resolveMoneyFusionOrphan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moneyfusion-orphans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-payment-repair-activity'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions-reconciliation'] });
    },
  });
}

export function useIgnoreMoneyFusionOrphan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ignoreMoneyFusionOrphan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moneyfusion-orphans'] });
    },
  });
}

export { DEFAULT_ADMIN_TRANSACTION_PAGE_SIZE };
export type { AdminTransactionTab };
