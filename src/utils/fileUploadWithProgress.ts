/**
 * File Upload with Real Progress
 * Date: 28 Janvier 2025
 * 
 * Utilitaire pour upload de fichiers avec progression réelle
 * Utilise XMLHttpRequest pour avoir une progression précise
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface UploadProgressOptions {
  bucket: string;
  path?: string;
  onProgress?: (progress: number, loaded: number, total: number) => void;
  onError?: (error: Error) => void;
  maxSizeBytes?: number;
}

export interface UploadProgressResult {
  url: string;
  path: string;
  success: boolean;
  error?: string;
}

/**
 * Upload un fichier avec progression réelle via XMLHttpRequest
 * 
 * Note: Supabase Storage utilise REST API, donc on peut utiliser XHR pour avoir la progression
 */
export async function uploadFileWithProgress(
  file: File,
  options: UploadProgressOptions
): Promise<UploadProgressResult> {
  const {
    bucket,
    path = '',
    onProgress,
    onError,
    maxSizeBytes = 100 * 1024 * 1024, // 100MB par défaut
  } = options;

  return new Promise((resolve, reject) => {
    try {
      // Validation taille
      if (file.size > maxSizeBytes) {
        const error = new Error(
          `Fichier trop volumineux. Maximum : ${formatFileSize(maxSizeBytes)}, actuel : ${formatFileSize(file.size)}`
        );
        onError?.(error);
        reject(error);
        return;
      }

      // Générer nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Obtenir l'URL d'upload depuis Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const error = new Error('Non authentifié');
        onError?.(error);
        reject(error);
        return;
      }

      // Construire l'URL d'upload Supabase Storage
      const projectUrl = supabase.supabaseUrl;
      const uploadUrl = `${projectUrl}/storage/v1/object/${bucket}/${filePath}`;

      // Créer la requête XHR
      const xhr = new XMLHttpRequest();

      // Gérer la progression
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress?.(progress, e.loaded, e.total);
        }
      });

      // Gérer la réponse
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Récupérer l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          resolve({
            url: publicUrl,
            path: filePath,
            success: true,
          });
        } else {
          const error = new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`);
          onError?.(error);
          reject(error);
        }
      });

      // Gérer les erreurs
      xhr.addEventListener('error', () => {
        const error = new Error('Erreur réseau lors de l\'upload');
        onError?.(error);
        reject(error);
      });

      xhr.addEventListener('abort', () => {
        const error = new Error('Upload annulé');
        onError?.(error);
        reject(error);
      });

      // Ouvrir et envoyer la requête
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.setRequestHeader('x-upsert', 'false'); // Ne pas écraser les fichiers existants

      xhr.send(file);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Erreur inattendue');
      logger.error('Erreur upload fichier', { error: err.message, fileName: file.name });
      onError?.(err);
      reject(err);
    }
  });
}

/**
 * Formater la taille de fichier
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Upload multiple fichiers avec progression globale
 */
export async function uploadMultipleFilesWithProgress(
  files: File[],
  options: UploadProgressOptions,
  onFileProgress?: (fileIndex: number, progress: number) => void
): Promise<UploadProgressResult[]> {
  const results: UploadProgressResult[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      const result = await uploadFileWithProgress(file, {
        ...options,
        onProgress: (progress, loaded, total) => {
          // Progression pour ce fichier
          onFileProgress?.(i, progress);
          
          // Progression globale
          const globalProgress = ((i + progress / 100) / totalFiles) * 100;
          options.onProgress?.(globalProgress, loaded, total);
        },
      });
      
      results.push(result);
    } catch (error) {
      results.push({
        url: '',
        path: '',
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  return results;
}

