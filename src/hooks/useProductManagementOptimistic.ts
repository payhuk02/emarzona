/**
 * useProductManagementOptimistic Hook
 * Date: 28 Janvier 2025
 * 
 * Hook gestion produits avec optimistic updates
 */

import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { invalidateProductCache, prefetchRelatedData, EntityType } from '@/lib/cache-invalidation';
import { EntityAction } from '@/lib/cache-invalidation';
import { useMutationWithRetry } from '@/hooks/useMutationWithRetry';
import type { Product } from './useProducts';

/**
 * Hook pour mettre à jour un produit avec optimistic update
 */
export function useUpdateProductOptimistic(storeId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur de mise à jour',
    mutationFn: async ({
      productId,
      updates,
    }: {
      productId: string;
      updates: Partial<Product>;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId)
        .eq('store_id', storeId)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    },
    onMutate: async ({ productId, updates }) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['products', storeId] });
      await queryClient.cancelQueries({ queryKey: ['product', productId] });

      // Sauvegarder l'état actuel
      const previousProduct = queryClient.getQueryData<Product>(['product', productId]);
      const previousProducts = queryClient.getQueryData<Product[]>(['products', storeId]);

      // Optimistic update pour le produit individuel
      queryClient.setQueryData<Product>(['product', productId], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, ...updates };
      });

      // Optimistic update pour la liste
      queryClient.setQueryData<Product[]>(['products', storeId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((product) =>
          product.id === productId ? { ...product, ...updates } : product
        );
      });

      return { previousProduct, previousProducts };
    },
    onError: (error, variables, context) => {
      // Rollback en cas d'erreur
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', variables.productId], context.previousProduct);
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', storeId], context.previousProducts);
      }

      logger.error('Erreur mise à jour produit', { error, variables });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
    },
    onSuccess: (data, variables) => {
      // Mettre à jour avec les vraies données
      queryClient.setQueryData(['product', variables.productId], data);
      queryClient.setQueryData<Product[]>(['products', storeId], (oldData) => {
        if (!oldData) return [data];
        return oldData.map((product) =>
          product.id === variables.productId ? data : product
        );
      });

      toast({
        title: '✅ Produit mis à jour',
        description: 'Le produit a été mis à jour avec succès',
      });
    },
    onSettled: async (data, error, variables) => {
      // Invalidation intelligente du cache
      if (!error && data) {
        invalidateProductCache(queryClient, variables.productId, EntityAction.UPDATE, storeId);
        // Précharger les données liées
        await prefetchRelatedData(queryClient, EntityType.PRODUCT, variables.productId, { storeId });
      }
    },
  });
}

/**
 * Hook pour supprimer un produit avec optimistic update
 */
export function useDeleteProductOptimistic(storeId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutationWithRetry({
    maxRetries: 3,
    baseDelay: 1000,
    errorToastTitle: 'Erreur de mise à jour',
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('store_id', storeId);

      if (error) throw error;
      return productId;
    },
    onMutate: async (productId) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['products', storeId] });
      await queryClient.cancelQueries({ queryKey: ['product', productId] });

      // Sauvegarder l'état actuel
      const previousProduct = queryClient.getQueryData<Product>(['product', productId]);
      const previousProducts = queryClient.getQueryData<Product[]>(['products', storeId]);

      // Optimistic update : supprimer de la liste
      queryClient.setQueryData<Product[]>(['products', storeId], (oldData) => {
        if (!oldData) return [];
        return oldData.filter((product) => product.id !== productId);
      });

      // Supprimer le produit individuel
      queryClient.setQueryData(['product', productId], undefined);

      return { previousProduct, previousProducts };
    },
    onError: (error, productId, context) => {
      // Rollback en cas d'erreur
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', productId], context.previousProduct);
      }
      if (context?.previousProducts) {
        queryClient.setQueryData(['products', storeId], context.previousProducts);
      }

      logger.error('Erreur suppression produit', { error, productId });
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le produit',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ Produit supprimé',
        description: 'Le produit a été supprimé avec succès',
      });
    },
    onSettled: async (data, error, productId) => {
      // Invalidation intelligente du cache
      if (!error) {
        invalidateProductCache(queryClient, productId, EntityAction.DELETE, storeId);
      }
      // Supprimer le produit individuel du cache
      queryClient.removeQueries({ queryKey: ['product', productId] });
    },
  });
}

