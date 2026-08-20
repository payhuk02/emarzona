import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  buildServiceCategoryTree,
  deleteServiceCategoryIfUnused,
  fetchServiceCategories,
  reorderServiceCategories,
  setServiceCategoryActive,
  upsertServiceCategory,
  type ServiceCategoryRow,
} from '@/lib/services/service-categories';

const QUERY_KEY = ['service-categories'] as const;

export function useServiceCategories(options?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: [...QUERY_KEY, { includeInactive: Boolean(options?.includeInactive) }],
    queryFn: () =>
      fetchServiceCategories({
        activeOnly: !options?.includeInactive,
        includeInactive: options?.includeInactive,
      }),
    staleTime: 60_000,
  });
}

export function useServiceCategoryTree(options?: { includeInactive?: boolean }) {
  const query = useServiceCategories(options);
  return {
    ...query,
    tree: buildServiceCategoryTree(query.data ?? []),
  };
}

export function useServiceCategoryParents(options?: { includeInactive?: boolean }) {
  const query = useServiceCategories(options);
  const parents = (query.data ?? []).filter(c => !c.parent_id);
  return { ...query, parents };
}

export function useServiceCategoryChildren(
  parentId: string | null | undefined,
  options?: { includeInactive?: boolean }
) {
  const query = useServiceCategories(options);
  const children = (query.data ?? []).filter(c => c.parent_id === parentId);
  return { ...query, children };
}

export function useUpsertServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertServiceCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useSetServiceCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setServiceCategoryActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteServiceCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteServiceCategoryIfUnused(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useReorderServiceCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; sort_order: number }>) =>
      reorderServiceCategories(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export type { ServiceCategoryRow };
