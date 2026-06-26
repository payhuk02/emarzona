import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_ADMIN_PRODUCT_PAGE_SIZE,
  fetchAdminProductsPage,
} from '@/lib/admin/admin-products-query';

export function useAdminProductsList(options: { page: number; pageSize: number; search: string }) {
  const { page, pageSize, search } = options;

  return useQuery({
    queryKey: ['admin-products', page, pageSize, search],
    queryFn: () => fetchAdminProductsPage({ page, pageSize, search }),
    placeholderData: previous => previous,
  });
}

export { DEFAULT_ADMIN_PRODUCT_PAGE_SIZE };
