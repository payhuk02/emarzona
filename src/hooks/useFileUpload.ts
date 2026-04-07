/**
 * Hook centralisé pour l'upload de fichiers vers Supabase Storage
 * 
 * La logique métier est dans src/services/fileUploadService.ts.
 * Ce hook gère uniquement l'état React et les toasts.
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { validateFile } from '@/utils/fileValidation';
import {
  uploadSingleFileToStorage,
  uploadFileToStorage,
} from '@/services/fileUploadService';

// Re-export types and standalone function for backward compatibility
export type { UploadConfig, UploadResult } from '@/services/fileUploadService';
export { uploadFileToStorage } from '@/services/fileUploadService';

import type { UploadConfig, UploadResult } from '@/services/fileUploadService';

export interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  uploaded: UploadResult[];
  failed: Array<{ file: File; error: string }>;
}

const INITIAL_STATE: UploadState = {
  uploading: false,
  progress: 0,
  error: null,
  uploaded: [],
  failed: [],
};

export function useFileUpload() {
  const { toast } = useToast();
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const uploadSingleFile = useCallback(
    async (file: File, config: UploadConfig): Promise<UploadResult> => {
      return uploadSingleFileToStorage(file, config);
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: File[], config: UploadConfig): Promise<UploadResult[]> => {
      setState({ ...INITIAL_STATE, uploading: true });

      const results: UploadResult[] = [];
      const failed: Array<{ file: File; error: string }> = [];

      // Validate all files first
      const invalidFiles = new Set<File>();
      for (const file of files) {
        const validation = validateFile(file, { maxSize: config.maxSize });
        if (!validation.valid) {
          invalidFiles.add(file);
          failed.push({ file, error: validation.error || 'Fichier invalide' });
        }
      }

      if (invalidFiles.size > 0) {
        toast({
          title: 'Fichiers invalides',
          description: `${invalidFiles.size} fichier(s) invalide(s)`,
          variant: 'destructive',
        });
      }

      const validFiles = files.filter(f => !invalidFiles.has(f));

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        try {
          const result = await uploadSingleFileToStorage(file, {
            ...config,
            onProgress: fileProgress => {
              const overall = Math.round(((i + fileProgress / 100) / validFiles.length) * 100);
              config.onProgress?.(overall);
              setState(prev => ({ ...prev, progress: overall }));
            },
          });
          results.push(result);
          setState(prev => ({ ...prev, uploaded: [...prev.uploaded, result] }));
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          logger.error('File upload failed', { fileName: file.name, error: msg });
          failed.push({ file, error: msg });
        }
      }

      const finalState: UploadState = {
        uploading: false,
        progress: 100,
        error: failed.length > 0
          ? `${failed.length} fichier(s) n'ont pas pu être uploadés`
          : null,
        uploaded: results,
        failed,
      };
      setState(finalState);

      if (failed.length > 0) {
        const aggregatedError = Object.assign(
          new Error(finalState.error!),
          { failedFiles: failed, successCount: results.length, failedCount: failed.length }
        );
        throw aggregatedError;
      }

      if (results.length > 0) {
        toast({
          title: 'Upload terminé',
          description: `${results.length} fichier(s) uploadé(s) avec succès`,
        });
      }

      return results;
    },
    [toast]
  );

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  return { uploadFiles, uploadSingleFile, state, reset };
}
