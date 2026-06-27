import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createServiceProductAddon,
  deleteServiceProductAddon,
  fetchServiceProductAddons,
  fetchStoreProductsForServiceAddonPicker,
  type ServiceProductAddonWithProduct,
} from '@/lib/service/service-product-addons';

export const serviceAddonKeys = {
  all: ['service-product-addons'] as const,
  list: (serviceProductId: string) => [...serviceAddonKeys.all, serviceProductId] as const,
  picker: (storeId: string) => [...serviceAddonKeys.all, 'picker', storeId] as const,
};

export function useServiceProductAddons(serviceProductId: string | null | undefined) {
  return useQuery({
    queryKey: serviceAddonKeys.list(serviceProductId ?? ''),
    queryFn: () => fetchServiceProductAddons(serviceProductId!),
    enabled: Boolean(serviceProductId),
  });
}

export function useServiceAddonProductPicker(
  storeId: string | null | undefined,
  excludeProductId?: string
) {
  return useQuery({
    queryKey: [...serviceAddonKeys.picker(storeId ?? ''), excludeProductId ?? ''],
    queryFn: () => fetchStoreProductsForServiceAddonPicker(storeId!, excludeProductId),
    enabled: Boolean(storeId),
  });
}

export function useCreateServiceProductAddon(serviceProductId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createServiceProductAddon,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceAddonKeys.list(serviceProductId) });
    },
  });
}

export function useDeleteServiceProductAddon(serviceProductId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteServiceProductAddon,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: serviceAddonKeys.list(serviceProductId) });
    },
  });
}

export type { ServiceProductAddonWithProduct };
