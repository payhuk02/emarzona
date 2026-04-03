/**
 * Hook useDragAndDrop - Gestion simplifiée du drag and drop
 * Fournit une API simple pour gérer le drag and drop de fichiers
 *
 * @example
 * ```tsx
 * const { isDragging, dragProps, dropProps } = useDragAndDrop({
 *   onDrop: (files) => handleFiles(files),
 *   accept: 'image/*',
 * });
 * ```
 */

import { useState, useCallback, DragEvent } from 'react';
// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

export interface UseDragAndDropOptions {
  /**
   * Callback appelé quand des fichiers sont déposés
   */
  onDrop: (files: File[]) => void;
  /**
   * Types de fichiers acceptés (ex: 'image/*', '.pdf')
   */
  accept?: string | string[];
  /**
   * Taille maximale par fichier (en bytes)
   */
  maxSize?: number;
  /**
   * Nombre maximum de fichiers
   */
  maxFiles?: number;
  /**
   * Activer/désactiver le drag and drop
   * @default true
   */
  enabled?: boolean;
  /**
   * Callback appelé quand le drag entre dans la zone
   */
  onDragEnter?: () => void;
  /**
   * Callback appelé quand le drag sort de la zone
   */
  onDragLeave?: () => void;
}

export interface UseDragAndDropReturn {
  /**
   * Indique si un fichier est en train d'être dragué sur la zone
   */
  isDragging: boolean;
  /**
   * Props à attacher à l'élément draggable
   */
  dragProps: {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
  };
  /**
   * Props à attacher à la zone de drop
   */
  dropProps: {
    onDragOver: (e: DragEvent) => void;
    onDragEnter: (e: DragEvent) => void;
    onDragLeave: (e: DragEvent) => void;
    onDrop: (e: DragEvent) => void;
  };
  /**
   * Réinitialiser l'état
   */
  reset: () => void;
}

/**
 * Vérifie si un fichier correspond aux types acceptés
 */
function isFileAccepted(file: File, accept?: string | string[]): boolean {
  if (!accept) return true;

  const acceptArray = Array.isArray(accept) ? accept : [accept];

  return acceptArray.some(pattern => {
    if (pattern.startsWith('.')) {
      // Extension de fichier
      return file.name.toLowerCase().endsWith(pattern.toLowerCase());
    } else if (pattern.includes('/*')) {
      // Type MIME avec wildcard (ex: 'image/*')
      const baseType = pattern.split('/')[0];
      return file.type.startsWith(baseType + '/');
    } else {
      // Type MIME exact
      return file.type === pattern;
    }
  });
}

/**
 * Hook pour gérer le drag and drop de fichiers
 */
export function useDragAndDrop(options: UseDragAndDropOptions): UseDragAndDropReturn {
  const {
    onDrop,
    accept,
    maxSize,
    maxFiles,
    enabled = true,
    onDragEnter: onDragEnterCallback,
    onDragLeave: onDragLeaveCallback,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  // const dragCounterRef = useState(0)[0]; // Pour gérer les drag enter/leave imbriqués - non utilisé actuellement

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [enabled]
  );

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Vérifier si c'est un fichier
      if (e.dataTransfer.types.includes('Files')) {
        setIsDragging(true);
        onDragEnterCallback?.();
      }
    },
    [enabled, onDragEnterCallback]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Ne pas désactiver si on est toujours dans un élément enfant
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        setIsDragging(false);
        onDragLeaveCallback?.();
      }
    },
    [enabled, onDragLeaveCallback]
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      if (!enabled) return;
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);

      if (files.length === 0) return;

      // Validation
      const  validFiles: File[] = [];

      for (const file of files) {
        // Vérifier le type
        if (accept && !isFileAccepted(file, accept)) {
          // ✅ PHASE 2: Remplacer console.warn par logger
          logger.warn(`File ${file.name} is not in accepted formats`, {
            fileName: file.name,
            accept,
          });
          continue;
        }

        // Vérifier la taille
        if (maxSize && file.size > maxSize) {
          // ✅ PHASE 2: Remplacer console.warn par logger
          logger.warn(`File ${file.name} exceeds max size of ${maxSize} bytes`, {
            fileName: file.name,
            fileSize: file.size,
            maxSize,
          });
          continue;
        }

        validFiles.push(file);
      }

      // Vérifier le nombre maximum
      if (maxFiles && validFiles.length > maxFiles) {
        // ✅ PHASE 2: Remplacer console.warn par logger
        logger.warn(`Too many files. Maximum is ${maxFiles}`, {
          fileCount: validFiles.length,
          maxFiles,
        });
        validFiles.splice(maxFiles);
      }

      if (validFiles.length > 0) {
        onDrop(validFiles);
      }
    },
    [enabled, onDrop, accept, maxSize, maxFiles]
  );

  const handleDragStart = useCallback(
    (e: DragEvent) => {
      if (!enabled) return;
      // Permettre le drag d'éléments (pas seulement de fichiers)
      e.dataTransfer.effectAllowed = 'move';
    },
    [enabled]
  );

  const reset = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    isDragging,
    dragProps: {
      draggable: enabled,
      onDragStart: handleDragStart,
    },
    dropProps: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    reset,
  };
}






