import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  createCrossTypeBundle,
  deleteCrossTypeBundle,
  fetchCrossTypeBundleWithItems,
  fetchStoreProductsForBundlePicker,
  listCrossTypeBundles,
  setCrossTypeBundleActive,
  type CrossTypeBundleRow,
} from '@/lib/bundles/cross-type-bundle-store';
import type { CrossTypeBundleLine } from '@/lib/checkout/cross-type-bundle';

export function useCrossTypeBundles(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ['cross-type-bundles', storeId],
    queryFn: () => listCrossTypeBundles(storeId!),
    enabled: Boolean(storeId),
  });
}

export function useCrossTypeBundleDetail(bundleId: string | null | undefined) {
  return useQuery({
    queryKey: ['cross-type-bundle', bundleId],
    queryFn: () => fetchCrossTypeBundleWithItems(bundleId!),
    enabled: Boolean(bundleId),
  });
}

export function useStoreProductsForBundlePicker(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ['bundle-picker-products', storeId],
    queryFn: () => fetchStoreProductsForBundlePicker(storeId!),
    enabled: Boolean(storeId),
  });
}

export function useCreateCrossTypeBundle() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: createCrossTypeBundle,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cross-type-bundles', variables.storeId] });
      toast({ title: 'Pack cross-type créé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteCrossTypeBundle(storeId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: deleteCrossTypeBundle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-type-bundles', storeId] });
      toast({ title: 'Pack supprimé' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export function useToggleCrossTypeBundleActive(storeId: string | null | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bundleId, isActive }: { bundleId: string; isActive: boolean }) =>
      setCrossTypeBundleActive(bundleId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-type-bundles', storeId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });
}

export type { CrossTypeBundleRow, CrossTypeBundleLine };
