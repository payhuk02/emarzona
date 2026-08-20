import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_STORE_COMMERCE_PAGE_SIZE,
  fetchStoreCommerceCustomersPage,
  fetchStoreCommerceOrdersPage,
  fetchStoreCommerceOverview,
  fetchStoreCommerceTransactionsPage,
  refreshStoreEarnings,
  type StoreCommerceCustomerTab,
  type StoreCommerceOrderTab,
  type StoreCommerceTransactionTab,
} from '@/lib/admin/admin-store-commerce-query';

export function useStoreCommerceOverview(storeId: string | null) {
  return useQuery({
    queryKey: ['admin-store-commerce-overview', storeId],
    queryFn: () => fetchStoreCommerceOverview(storeId!),
    enabled: Boolean(storeId),
    staleTime: 30_000,
  });
}

export function useStoreCommerceCustomers(options: {
  storeId: string | null;
  page: number;
  pageSize: number;
  tab: StoreCommerceCustomerTab;
  search: string;
}) {
  const { storeId, page, pageSize, tab, search } = options;

  return useQuery({
    queryKey: ['admin-store-commerce-customers', storeId, page, pageSize, tab, search],
    queryFn: () =>
      fetchStoreCommerceCustomersPage({ storeId: storeId!, page, pageSize, tab, search }),
    enabled: Boolean(storeId),
    placeholderData: previous => previous,
  });
}

export function useStoreCommerceOrders(options: {
  storeId: string | null;
  page: number;
  pageSize: number;
  tab: StoreCommerceOrderTab;
  search: string;
}) {
  const { storeId, page, pageSize, tab, search } = options;

  return useQuery({
    queryKey: ['admin-store-commerce-orders', storeId, page, pageSize, tab, search],
    queryFn: () => fetchStoreCommerceOrdersPage({ storeId: storeId!, page, pageSize, tab, search }),
    enabled: Boolean(storeId),
    placeholderData: previous => previous,
  });
}

export function useStoreCommerceTransactions(options: {
  storeId: string | null;
  page: number;
  pageSize: number;
  tab: StoreCommerceTransactionTab;
  search: string;
}) {
  const { storeId, page, pageSize, tab, search } = options;

  return useQuery({
    queryKey: ['admin-store-commerce-transactions', storeId, page, pageSize, tab, search],
    queryFn: () =>
      fetchStoreCommerceTransactionsPage({ storeId: storeId!, page, pageSize, tab, search }),
    enabled: Boolean(storeId),
    placeholderData: previous => previous,
  });
}

export function useRefreshStoreEarnings(storeId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => refreshStoreEarnings(storeId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-store-commerce-overview', storeId] });
    },
  });
}

export { DEFAULT_STORE_COMMERCE_PAGE_SIZE };
