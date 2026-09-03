/**
 * Hook useClipboard - Gestion simplifiée du presse-papier
 * Fournit une API simple pour copier du texte avec feedback automatique
 *
 * @example
 * ```tsx
 * const { copy, copied, error } = useClipboard();
 *
 * <Button onClick={() => copy('Text to copy')}>
 *   {copied ? 'Copié !' : 'Copier'}
 * </Button>
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToastHelpers } from './useToastHelpers';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

interface UseClipboardOptions {
  /**
   * Délai avant de réinitialiser l'état "copied" (ms)
   * @default 2000
   */
  resetDelay?: number;
  /**
   * Afficher automatiquement un toast de succès
   * @default true
   */
  showSuccessToast?: boolean;
  /**
   * Message de succès personnalisé
   */
  successMessage?: string;
  /**
   * Afficher automatiquement un toast d'erreur
   * @default true
   */
  showErrorToast?: boolean;
  /**
   * Message d'erreur personnalisé
   */
  errorMessage?: string;
}

/**
 * Hook pour gérer le presse-papier
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    resetDelay = 2000,
    showSuccessToast = true,
    successMessage,
    showErrorToast = true,
    errorMessage,
  } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { showCopySuccess, showError } = useToastHelpers();

  // Fonction pour copier dans le presse-papier
  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      // Réinitialiser l'état d'erreur
      setError(null);

      try {
        // Essayer d'utiliser l'API Clipboard moderne
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          // Fallback pour les navigateurs plus anciens
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            const successful = document.execCommand('copy');
            if (!successful) {
              throw new Error('execCommand copy failed');
            }
          } finally {
            document.body.removeChild(textArea);
          }
        }

        // Marquer comme copié
        setCopied(true);

        // Afficher un toast de succès
        if (showSuccessToast) {
          const message = successMessage || 'Copié dans le presse-papier';
          showCopySuccess(message);
        }

        // Réinitialiser après le délai
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, resetDelay);

        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(error);

        // Afficher un toast d'erreur
        if (showErrorToast) {
          const message = errorMessage || 'Impossible de copier dans le presse-papier';
          showError(message);
        }

        return false;
      }
    },
    [
      resetDelay,
      showSuccessToast,
      successMessage,
      showErrorToast,
      errorMessage,
      showCopySuccess,
      showError,
    ]
  );

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Fonction pour réinitialiser l'état
  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  return {
    copy,
    copied,
    error,
    reset,
  };
}

/**
 * Hook spécialisé pour copier une URL
 */
export function useCopyUrl(url?: string) {
  const { copy, copied, error } = useClipboard({
    successMessage: 'URL copiée dans le presse-papier',
  });

  const copyUrl = useCallback(
    (urlToCopy?: string) => {
      const urlToUse = urlToCopy || url;
      if (!urlToUse) {
        // ✅ PHASE 2: Remplacer console.warn par logger
        logger.warn('No URL provided to copy');
        return false;
      }
      return copy(urlToUse);
    },
    [copy, url]
  );

  return {
    copyUrl,
    copied,
    error,
  };
}
