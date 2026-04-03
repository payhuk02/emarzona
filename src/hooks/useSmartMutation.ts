/**
 * Hook useSmartMutation - Wrapper intelligent pour les mutations React Query
 * Combine les meilleures pratiques : error handling, optimistic updates, toast notifications
 * 
 * @example
 * ```tsx
 * const { mutate, isLoading } = useSmartMutation({
 *   mutationFn: (data) => createProduct(data),
 *   onSuccess: () => {
 *     queryClient.invalidateQueries(['products']);
 *   },
 *   successMessage: 'Produit créé avec succès',
 * });
 * ```
 */

import { useMutation, UseMutationOptions, UseMutationResult, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from './useErrorHandler';
import { useToastHelpers } from './useToastHelpers';

export interface SmartMutationOptions<TData, TError = Error, TVariables = void, TContext = unknown>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /**
   * Fonction de mutation
   */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /**
   * Afficher un toast de succès automatiquement
   * @default true
   */
  showSuccessToast?: boolean;
  /**
   * Message de succès personnalisé
   */
  successMessage?: string;
  /**
   * Afficher un toast d'erreur automatiquement
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * Message d'erreur personnalisé
   */
  errorMessage?: string;
  /**
   * Clés de requêtes à invalider après succès
   */
  invalidateQueries?: QueryKey[];
  /**
   * Activer les optimistic updates
   * @default false
   */
  optimisticUpdate?: {
    /**
     * Clé de requête à mettre à jour de manière optimiste
     */
    queryKey: QueryKey;
    /**
     * Fonction pour mettre à jour les données de manière optimiste
     */
    updater: (oldData: unknown, variables: TVariables) => unknown;
    /**
     * Fonction pour restaurer les données en cas d'erreur
     */
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
  };
}

/**
 * Hook intelligent pour les mutations React Query
 */
export function useSmartMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: SmartMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    mutationFn,
    showSuccessToast = true,
    successMessage,
    showErrorToast = true,
    errorMessage,
    invalidateQueries,
    optimisticUpdate,
    onSuccess,
    onError,
    onSettled,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler({ silent: !showErrorToast });
  const { showSuccess, showError } = useToastHelpers();

  const mutation = useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...mutationOptions,
    onMutate: async (variables) => {
      // Optimistic update
      if (optimisticUpdate) {
        // Annuler les requêtes en cours pour éviter les conflits
        await queryClient.cancelQueries({ queryKey: optimisticUpdate.queryKey });

        // Sauvegarder les données actuelles pour rollback
        const previousData = queryClient.getQueryData(optimisticUpdate.queryKey);

        // Mettre à jour de manière optimiste
        queryClient.setQueryData(
          optimisticUpdate.queryKey,
          (old: unknown) => optimisticUpdate.updater(old, variables)
        );

        // Retourner le contexte pour rollback
        return { previousData } as TContext;
      }

      // Appeler le callback personnalisé si fourni
      return mutationOptions.onMutate?.(variables) as TContext | undefined;
    },
    onSuccess: (data, variables, context) => {
      // Invalider les requêtes si spécifiées
      if (invalidateQueries) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      // Afficher un toast de succès
      if (showSuccessToast) {
        const message = successMessage || 'Opération réussie';
        showSuccess(message);
      }

      // Appeler le callback personnalisé
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update si nécessaire
      if (optimisticUpdate && context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(optimisticUpdate.queryKey, context.previousData);
        optimisticUpdate.onError?.(error, variables, context);
      }

      // Gérer l'erreur avec le système d'erreur
      const normalized = handleError(error, {
        mutationFn: mutationFn.name || 'unknown',
        variables,
      });

      // Afficher un toast d'erreur
      if (showErrorToast) {
        const message = errorMessage || normalized.userMessage || 'Une erreur est survenue';
        showError(message);
      }

      // Appeler le callback personnalisé
      onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Appeler le callback personnalisé
      onSettled?.(data, error, variables, context);
      mutationOptions.onSettled?.(data, error, variables, context);
    },
  });

  return mutation;
}

/**
 * Hook spécialisé pour les créations
 */
export function useSmartCreateMutation<TData = unknown, TVariables = void>(
  options: Omit<SmartMutationOptions<TData, Error, TVariables>, 'successMessage'> & {
    successMessage?: string;
    entityName?: string;
  }
) {
  const { entityName = 'élément', successMessage, ...rest } = options;

  return useSmartMutation<TData, Error, TVariables>({
    ...rest,
    successMessage: successMessage || `${entityName} créé avec succès`,
  });
}

/**
 * Hook spécialisé pour les mises à jour
 */
export function useSmartUpdateMutation<TData = unknown, TVariables = void>(
  options: Omit<SmartMutationOptions<TData, Error, TVariables>, 'successMessage'> & {
    successMessage?: string;
    entityName?: string;
  }
) {
  const { entityName = 'élément', successMessage, ...rest } = options;

  return useSmartMutation<TData, Error, TVariables>({
    ...rest,
    successMessage: successMessage || `${entityName} mis à jour avec succès`,
  });
}

/**
 * Hook spécialisé pour les suppressions
 */
export function useSmartDeleteMutation<TData = unknown, TVariables = void>(
  options: Omit<SmartMutationOptions<TData, Error, TVariables>, 'successMessage'> & {
    successMessage?: string;
    entityName?: string;
  }
) {
  const { entityName = 'élément', successMessage, ...rest } = options;

  return useSmartMutation<TData, Error, TVariables>({
    ...rest,
    successMessage: successMessage || `${entityName} supprimé avec succès`,
  });
}







