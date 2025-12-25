/**
 * Optimistic Updates Utilities
 * Date: 28 Janvier 2025
 * 
 * Utilitaires pour gérer les optimistic updates avec React Query
 * Permet d'améliorer l'UX en mettant à jour l'UI immédiatement
 */

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

/**
 * Options pour optimistic update
 */
export interface OptimisticUpdateOptions<TData, TVariables> {
  queryKey: unknown[];
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  rollbackFn?: (oldData: TData | undefined, variables: TVariables) => TData;
}

/**
 * Applique un optimistic update
 */
export function applyOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  options: OptimisticUpdateOptions<TData, TVariables>,
  variables: TVariables
): TData | undefined {
  const { queryKey, updateFn } = options;

  // Sauvegarder l'état actuel pour rollback
  const previousData = queryClient.getQueryData<TData>(queryKey);

  // Appliquer l'update optimiste
  queryClient.setQueryData<TData>(queryKey, (oldData) => {
    return updateFn(oldData, variables);
  });

  logger.debug('Optimistic update appliqué', { queryKey, variables });

  return previousData;
}

/**
 * Rollback un optimistic update
 */
export function rollbackOptimisticUpdate<TData, TVariables>(
  queryClient: QueryClient,
  options: OptimisticUpdateOptions<TData, TVariables>,
  variables: TVariables,
  previousData: TData | undefined
): void {
  const { queryKey, rollbackFn } = options;

  if (rollbackFn) {
    // Utiliser la fonction de rollback personnalisée
    queryClient.setQueryData<TData>(queryKey, (oldData) => {
      return rollbackFn(oldData, variables);
    });
  } else {
    // Restaurer l'état précédent
    queryClient.setQueryData<TData>(queryKey, previousData);
  }

  logger.debug('Optimistic update rollback', { queryKey, variables });
}

/**
 * Helper pour créer un optimistic update pour une liste
 */
export function createListOptimisticUpdate<TItem, TVariables>(
  queryKey: unknown[],
  createItem: (variables: TVariables) => TItem,
  findItem?: (item: TItem, variables: TVariables) => boolean,
  updateItem?: (item: TItem, variables: TVariables) => TItem,
  deleteItem?: (item: TItem, variables: TVariables) => boolean
) {
  return {
    // Ajouter un item
    add: (oldData: TItem[] | undefined, variables: TVariables): TItem[] => {
      const newItem = createItem(variables);
      return oldData ? [newItem, ...oldData] : [newItem];
    },

    // Mettre à jour un item
    update: (oldData: TItem[] | undefined, variables: TVariables): TItem[] => {
      if (!oldData || !findItem || !updateItem) return oldData || [];
      return oldData.map((item) =>
        findItem(item, variables) ? updateItem(item, variables) : item
      );
    },

    // Supprimer un item
    remove: (oldData: TItem[] | undefined, variables: TVariables): TItem[] => {
      if (!oldData || !findItem || !deleteItem) return oldData || [];
      return oldData.filter((item) => !deleteItem(item, variables));
    },
  };
}

/**
 * Helper pour créer un optimistic update pour un objet unique
 */
export function createObjectOptimisticUpdate<TData, TVariables>(
  queryKey: unknown[],
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData
) {
  return {
    update: (oldData: TData | undefined, variables: TVariables): TData => {
      return updateFn(oldData, variables);
    },
  };
}

/**
 * Pattern pour mutations avec optimistic updates
 */
export interface OptimisticMutationConfig<TData, TVariables, TError = Error> {
  queryKey: unknown[];
  onMutate?: (variables: TVariables) => Promise<TData | undefined> | TData | undefined;
  onError?: (error: TError, variables: TVariables, context: TData | undefined) => void;
  onSuccess?: (data: unknown, variables: TVariables, context: TData | undefined) => void;
  onSettled?: (data: unknown, error: TError | null, variables: TVariables, context: TData | undefined) => void;
}

/**
 * Créer une configuration pour mutation avec optimistic update
 */
export function createOptimisticMutationConfig<TData, TVariables, TError = Error>(
  config: OptimisticMutationConfig<TData, TVariables, TError>
) {
  return {
    onMutate: async (variables: TVariables) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await config.onMutate?.(variables);
    },
    onError: (error: TError, variables: TVariables, context: TData | undefined) => {
      config.onError?.(error, variables, context);
    },
    onSuccess: (data: unknown, variables: TVariables, context: TData | undefined) => {
      config.onSuccess?.(data, variables, context);
    },
    onSettled: (
      data: unknown,
      error: TError | null,
      variables: TVariables,
      context: TData | undefined
    ) => {
      config.onSettled?.(data, error, variables, context);
    },
  };
}

