/**
 * Hook useToastHelpers - Simplifie l'utilisation des toasts
 * Fournit des méthodes helper pour les patterns courants (success, error, info, warning)
 * 
 * @example
 * ```tsx
 * const { showSuccess, showError, showInfo, showWarning } = useToastHelpers();
 * 
 * showSuccess('Opération réussie');
 * showError('Une erreur est survenue');
 * ```
 */

import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';

export interface ToastOptions {
  /**
   * Titre du toast
   */
  title?: string;
  /**
   * Description du toast
   */
  description?: string;
  /**
   * Durée d'affichage en ms
   */
  duration?: number;
  /**
   * Action personnalisée (bouton)
   */
  action?: React.ReactNode;
}

/**
 * Hook pour simplifier l'utilisation des toasts
 */
export function useToastHelpers() {
  const { toast } = useToast();

  /**
   * Affiche un toast de succès
   */
  const showSuccess = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || '✅ Succès',
        description: message || options.description,
        duration: options.duration || 3000,
        variant: 'default',
        action: options.action,
      });
    },
    [toast]
  );

  /**
   * Affiche un toast d'erreur
   */
  const showError = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || '❌ Erreur',
        description: message || options.description,
        duration: options.duration || 5000,
        variant: 'destructive',
        action: options.action,
      });
    },
    [toast]
  );

  /**
   * Affiche un toast d'information
   */
  const showInfo = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || 'ℹ️ Information',
        description: message || options.description,
        duration: options.duration || 4000,
        variant: 'default',
        action: options.action,
      });
    },
    [toast]
  );

  /**
   * Affiche un toast d'avertissement
   */
  const showWarning = useCallback(
    (message: string, options: ToastOptions = {}) => {
      toast({
        title: options.title || '⚠️ Attention',
        description: message || options.description,
        duration: options.duration || 4000,
        variant: 'default',
        action: options.action,
      });
    },
    [toast]
  );

  /**
   * Affiche un toast de chargement
   */
  const showLoading = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const toastId = toast({
        title: options.title || '⏳ Chargement...',
        description: message || options.description,
        duration: Infinity, // Ne pas fermer automatiquement
        variant: 'default',
        action: options.action,
      });

      return toastId;
    },
    [toast]
  );

  /**
   * Affiche un toast de promesse (loading -> success/error)
   */
  const showPromise = useCallback(
    <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: Error) => string);
      }
    ): Promise<T> => {
      const loadingToastId = showLoading(messages.loading);

      return promise
        .then((data) => {
          // Fermer le toast de chargement
          // Note: L'API toast ne permet pas de fermer un toast spécifique facilement
          // On affiche simplement le toast de succès qui remplacera le loading
          const successMessage =
            typeof messages.success === 'function'
              ? messages.success(data)
              : messages.success;
          showSuccess(successMessage);
          return data;
        })
        .catch((error) => {
          const errorMessage =
            typeof messages.error === 'function'
              ? messages.error(error)
              : messages.error;
          showError(errorMessage);
          throw error;
        });
    },
    [showLoading, showSuccess, showError]
  );

  /**
   * Affiche un toast de copie dans le presse-papiers
   */
  const showCopySuccess = useCallback(
    (item: string = 'élément') => {
      showSuccess(`${item} copié dans le presse-papiers`, {
        duration: 2000,
      });
    },
    [showSuccess]
  );

  /**
   * Affiche un toast de sauvegarde
   */
  const showSaveSuccess = useCallback(
    (item: string = 'données') => {
      showSuccess(`${item} sauvegardé avec succès`);
    },
    [showSuccess]
  );

  /**
   * Affiche un toast de suppression
   */
  const showDeleteSuccess = useCallback(
    (item: string = 'élément') => {
      showSuccess(`${item} supprimé avec succès`);
    },
    [showSuccess]
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    showPromise,
    showCopySuccess,
    showSaveSuccess,
    showDeleteSuccess,
    toast, // Exposer aussi le toast original pour les cas avancés
  };
}







