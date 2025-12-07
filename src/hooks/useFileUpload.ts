/**
 * Hook useFileUpload - Gestion simplifiée de l'upload de fichiers
 * Fournit une API simple pour uploader des fichiers avec progression
 * 
 * @example
 * ```tsx
 * const { upload, progress, isUploading, error } = useFileUpload({
 *   onSuccess: (url) => console.log('Uploaded:', url),
 *   onError: (error) => console.error('Error:', error),
 * });
 * 
 * <input type="file" onChange={(e) => upload(e.target.files?.[0])} />
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useToastHelpers } from './useToastHelpers';

export interface FileUploadOptions {
  /**
   * Bucket Supabase
   */
  bucket: string;
  /**
   * Chemin dans le bucket
   */
  path?: string;
  /**
   * Taille maximale (en bytes)
   */
  maxSize?: number;
  /**
   * Types de fichiers acceptés
   */
  accept?: string[];
  /**
   * Callback appelé en cas de succès
   */
  onSuccess?: (url: string) => void;
  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: Error) => void;
  /**
   * Afficher des toasts automatiquement
   * @default true
   */
  showToasts?: boolean;
}

export interface FileUploadState {
  /**
   * Progression de l'upload (0-100)
   */
  progress: number;
  /**
   * Indique si l'upload est en cours
   */
  isUploading: boolean;
  /**
   * Erreur éventuelle
   */
  error: Error | null;
  /**
   * URL du fichier uploadé
   */
  url: string | null;
}

/**
 * Hook pour uploader des fichiers
 */
export function useFileUpload(options: FileUploadOptions) {
  const {
    bucket,
    path = '',
    maxSize = 10 * 1024 * 1024, // 10MB par défaut
    accept,
    onSuccess,
    onError,
    showToasts = true,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    url: null,
  });

  const { showSuccess, showError } = useToastHelpers();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Valider le fichier
  const validateFile = useCallback(
    (file: File): string | null => {
      // Vérifier la taille
      if (file.size > maxSize) {
        return `Le fichier dépasse la taille maximale de ${(maxSize / 1024 / 1024).toFixed(2)} MB`;
      }

      // Vérifier le type
      if (accept && accept.length > 0) {
        const isAccepted = accept.some((type) => {
          if (type.endsWith('/*')) {
            const baseType = type.split('/')[0];
            return file.type.startsWith(baseType + '/');
          }
          return file.type === type;
        });

        if (!isAccepted) {
          return `Type de fichier non supporté. Types acceptés: ${accept.join(', ')}`;
        }
      }

      return null;
    },
    [maxSize, accept]
  );

  // Uploader un fichier
  const upload = useCallback(
    async (file: File | null | undefined): Promise<string | null> => {
      if (!file) {
        return null;
      }

      // Valider le fichier
      const validationError = validateFile(file);
      if (validationError) {
        const error = new Error(validationError);
        setState((prev) => ({ ...prev, error, isUploading: false }));
        if (showToasts) {
          showError(validationError);
        }
        onError?.(error);
        return null;
      }

      // Réinitialiser l'état
      setState({
        progress: 0,
        isUploading: true,
        error: null,
        url: null,
      });

      // Créer un AbortController pour annuler l'upload
      abortControllerRef.current = new AbortController();

      try {
        // Importer Supabase dynamiquement
        const { supabase } = await import('@/integrations/supabase/client');

        // Générer un nom de fichier unique
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = path ? `${path}/${fileName}` : fileName;

        // Simuler la progression (Supabase ne fournit pas de progression réelle)
        const progressInterval = setInterval(() => {
          setState((prev) => {
            if (prev.progress < 90) {
              return { ...prev, progress: prev.progress + 10 };
            }
            return prev;
          });
        }, 200);

        // Uploader le fichier
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            signal: abortControllerRef.current.signal,
          });

        clearInterval(progressInterval);

        if (error) {
          throw error;
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);

        setState({
          progress: 100,
          isUploading: false,
          error: null,
          url: publicUrl,
        });

        if (showToasts) {
          showSuccess('Fichier uploadé avec succès');
        }

        onSuccess?.(publicUrl);

        return publicUrl;
      } catch (error: any) {
        // Vérifier si c'est une annulation
        if (error?.name === 'AbortError') {
          setState((prev) => ({
            ...prev,
            isUploading: false,
            progress: 0,
          }));
          return null;
        }

        const uploadError = error instanceof Error ? error : new Error('Erreur lors de l\'upload');
        setState({
          progress: 0,
          isUploading: false,
          error: uploadError,
          url: null,
        });

        if (showToasts) {
          showError(uploadError.message || 'Erreur lors de l\'upload du fichier');
        }

        onError?.(uploadError);

        return null;
      }
    },
    [bucket, path, validateFile, showToasts, showSuccess, showError, onSuccess, onError]
  );

  // Annuler l'upload
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isUploading: false,
      progress: 0,
    }));
  }, []);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    cancel();
    setState({
      progress: 0,
      isUploading: false,
      error: null,
      url: null,
    });
  }, [cancel]);

  return {
    ...state,
    upload,
    cancel,
    reset,
  };
}

/**
 * Hook pour uploader plusieurs fichiers
 */
export function useMultipleFileUpload(options: FileUploadOptions) {
  const singleUpload = useFileUpload({ ...options, showToasts: false });
  const [uploads, setUploads] = useState<Map<string, FileUploadState>>(new Map());

  const uploadMultiple = useCallback(
    async (files: File[]): Promise<string[]> => {
      const results: string[] = [];

      for (const file of files) {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            progress: 0,
            isUploading: true,
            error: null,
            url: null,
          });
          return next;
        });

        const url = await singleUpload.upload(file);

        setUploads((prev) => {
          const next = new Map(prev);
          next.set(fileId, {
            progress: 100,
            isUploading: false,
            error: null,
            url,
          });
          return next;
        });

        if (url) {
          results.push(url);
        }
      }

      return results;
    },
    [singleUpload]
  );

  return {
    uploadMultiple,
    uploads: Array.from(uploads.values()),
    isUploading: Array.from(uploads.values()).some((u) => u.isUploading),
  };
}

