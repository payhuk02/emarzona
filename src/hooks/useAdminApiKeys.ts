import { useQuery } from '@tanstack/react-query';
import {
  DEFAULT_ADMIN_API_KEY_PAGE_SIZE,
  fetchAdminApiKeysPage,
} from '@/lib/admin/admin-api-keys-query';

export function useAdminApiKeysList(options: {
  page: number;
  pageSize: number;
  search: string;
  enabled?: boolean;
}) {
  const { page, pageSize, search, enabled = true } = options;

  return useQuery({
    queryKey: ['admin-api-keys', page, pageSize, search],
    queryFn: () => fetchAdminApiKeysPage({ page, pageSize, search }),
    enabled,
    placeholderData: previous => previous,
  });
}

export { DEFAULT_ADMIN_API_KEY_PAGE_SIZE };
