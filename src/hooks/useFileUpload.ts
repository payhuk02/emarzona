/**
 * Hook centralisé pour l'upload de fichiers vers Supabase Storage
 * Date: 1 Février 2025
 *
 * Centralise toute la logique d'upload avec retry, progress tracking, et gestion d'erreurs
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { validateFile } from '@/utils/fileValidation';
import imageCompression from 'browser-image-compression';
import { detectMediaType } from '@/utils/media-detection';
import {
  checkStoragePermissions,
  formatPermissionCheckReport,
} from '@/utils/checkStoragePermissions';

/**
 * Compresse une image si nécessaire
 */
async function compressImageIfNeeded(
  file: File,
  options: { maxSizeMB?: number; maxWidthOrHeight?: number } = {}
): Promise<File> {
  const mediaType = detectMediaType(file.name, file.type);

  // Ne compresser que les images
  if (mediaType !== 'image') {
    return file;
  }

  const {
    maxSizeMB = 1, // 1MB par défaut
    maxWidthOrHeight = 1920, // Max 1920px
  } = options;

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type,
    });

    if (import.meta.env.DEV) {
      const originalSize = (file.size / 1024 / 1024).toFixed(2);
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2);
      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);

      logger.info('Image compressed', {
        fileName: file.name,
        originalSize: `${originalSize}MB`,
        compressedSize: `${compressedSize}MB`,
        reduction: `${reduction}%`,
      });
    }

    return compressedFile;
  } catch ( _error: unknown) {
    // Si la compression échoue, retourner le fichier original
    logger.warn('Image compression failed, using original', {
      fileName: file.name,
      error: error.message,
    });
    return file;
  }
}

/**
 * Fonction utilitaire pour uploader un fichier (peut être utilisée sans hook)
 */
export async function uploadFileToStorage(file: File, config: UploadConfig): Promise<UploadResult> {
  const { bucket = 'attachments', folder, maxRetries = 3, retryDelay = 1000 } = config;

  // Valider le fichier
  const validation = validateFile(file, {
    maxSize: config.maxSize,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'Fichier invalide');
  }

  // Compresser l'image si nécessaire (avant validation de taille finale)
  let  fileToUpload= file;
  if (config.compressImages !== false) {
    fileToUpload = await compressImageIfNeeded(file, {
      maxSizeMB: 1, // Compresser à max 1MB
      maxWidthOrHeight: 1920,
    });
  }

  // Générer le nom de fichier unique
  const fileExt = file.name.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const fileName = `${timestamp}-${random}.${fileExt}`;
  const filePath = folder.endsWith('/') ? `${folder}${fileName}` : `${folder}/${fileName}`;

  // Déterminer le Content-Type (utiliser celui du fichier compressé si différent)
  const contentType =
    validation.detectedMimeType || fileToUpload.type || file.type || 'application/octet-stream';

  // Upload avec retry et progress tracking
  let  lastError: Error | null = null;
  for (let  attempt= 0; attempt <= maxRetries; attempt++) {
    try {
      // Mettre à jour la progression avant upload
      if (config.onProgress && attempt === 0) {
        config.onProgress(50);
      }

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          contentType,
          upsert: false,
          metadata: {
            originalName: file.name,
            originalSize: file.size.toString(),
            compressedSize: fileToUpload.size.toString(),
            uploadedAt: new Date().toISOString(),
          },
        });

      if (uploadError) {
        lastError = uploadError instanceof Error ? uploadError : new Error(String(uploadError));
        if (attempt < maxRetries) {
          // Attendre avant de réessayer (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          continue;
        }
        throw uploadError;
      }

      if (!uploadData?.path) {
        throw new Error('Upload returned no path');
      }

      // VÉRIFICATION CRITIQUE : S'assurer que le fichier existe vraiment dans le bucket
      // Attendre un court délai pour que Supabase finalise l'upload
      await new Promise(resolve => setTimeout(resolve, 200));

      // Vérifier l'existence du fichier avec list()
      const pathParts = uploadData.path.split('/');
      const folderPath = pathParts.slice(0, -1).join('/') || '';
      const uploadedFileName = pathParts[pathParts.length - 1];

      const { data: fileList, error: listError } = await supabase.storage
        .from(bucket)
        .list(folderPath, {
          limit: 1000,
          search: uploadedFileName,
        });

      if (listError) {
        logger.warn('Could not verify file existence after upload', {
          path: uploadData.path,
          error: listError,
        });
        // Ne pas bloquer, mais logger l'avertissement
      } else {
        const fileExists = fileList?.some(f => f.name === uploadedFileName);
        if (!fileExists) {
          logger.error('File not found in bucket after upload', {
            path: uploadData.path,
            folderPath,
            uploadedFileName,
            fileList,
          });
          throw new Error(
            `Le fichier n'a pas été trouvé dans le bucket après l'upload. Chemin: ${uploadData.path}`
          );
        } else {
          if (import.meta.env.DEV) {
            logger.info('✅ File verified in bucket after upload', {
              path: uploadData.path,
              uploadedFileName,
            });
          }
        }
      }

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

      // Vérifier que l'URL publique fonctionne (HEAD request)
      try {
        const testResponse = await fetch(urlData.publicUrl, {
          method: 'HEAD',
          cache: 'no-cache',
        });

        if (!testResponse.ok) {
          logger.warn('Public URL not accessible after upload', {
            path: uploadData.path,
            publicUrl: urlData.publicUrl,
            status: testResponse.status,
          });
        } else {
          const contentType = testResponse.headers.get('content-type') || '';
          if (contentType === 'application/json') {
            logger.error('Public URL returns JSON instead of file', {
              path: uploadData.path,
              publicUrl: urlData.publicUrl,
            });
            throw new Error(
              `L'URL publique retourne du JSON au lieu du fichier. Chemin: ${uploadData.path}`
            );
          }
        }
      } catch ( _fetchError: unknown) {
        // Ne pas bloquer si c'est une erreur réseau (CORS, etc.)
        logger.warn('Could not test public URL after upload', {
          path: uploadData.path,
          publicUrl: urlData.publicUrl,
          error: fetchError,
        });
      }

      // Mettre à jour la progression finale
      if (config.onProgress) {
        config.onProgress(100);
      }

      return {
        path: uploadData.path,
        publicUrl: urlData.publicUrl,
        fileName: file.name, // Garder le nom original
        mimeType: contentType,
        size: fileToUpload.size, // Taille après compression
      };
    } catch ( _error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

/**
 * Configuration de l'upload
 */
export interface UploadConfig {
  /** Nom du bucket Supabase (défaut: 'attachments') */
  bucket?: string;
  /** Dossier de destination dans le bucket */
  folder: string;
  /** Taille maximale en bytes (défaut: 10MB) */
  maxSize?: number;
  /** Nombre de tentatives en cas d'échec (défaut: 3) */
  maxRetries?: number;
  /** Délai entre les tentatives en ms (défaut: 1000) */
  retryDelay?: number;
  /** Callback pour le suivi de progression */
  onProgress?: (progress: number) => void;
  /** Compresser les images avant upload (défaut: true) */
  compressImages?: boolean;
  /** Options de compression pour les images */
  compressionOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  };
}

/**
 * Résultat d'un upload
 */
export interface UploadResult {
  /** Chemin dans le bucket */
  path: string;
  /** URL publique du fichier */
  publicUrl: string;
  /** URL signée comme fallback si l'URL publique ne fonctionne pas */
  signedUrl?: string | null;
  /** Nom du fichier original */
  fileName: string;
  /** Type MIME du fichier */
  mimeType: string;
  /** Taille du fichier en bytes */
  size: number;
}

/**
 * État de l'upload
 */
export interface UploadState {
  /** Upload en cours */
  uploading: boolean;
  /** Progression (0-100) */
  progress: number;
  /** Erreur éventuelle */
  error: string | null;
  /** Fichiers uploadés avec succès */
  uploaded: UploadResult[];
  /** Fichiers en échec */
  failed: Array<{ file: File; error: string }>;
}

/**
 * Hook pour l'upload de fichiers
 *
 * @example
 * const { uploadFiles, state } = useFileUpload();
 *
 * const handleUpload = async () => {
 *   const results = await uploadFiles(selectedFiles, {
 *     folder: 'messages/order-123',
 *   });
 * };
 */
export function useFileUpload() {
  const { toast } = useToast();
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    uploaded: [],
    failed: [],
  });

  /**
   * Génère un nom de fichier unique
   */
  const generateFileName = useCallback((originalName: string): string => {
    const fileExt = originalName.split('.').pop() || '';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${random}.${fileExt}`;
  }, []);

  /**
   * Upload un fichier avec retry
   */
  const uploadSingleFile = useCallback(
    async (file: File, config: UploadConfig, retryCount = 0): Promise<UploadResult> => {
      const {
        bucket = 'attachments',
        folder,
        maxRetries = 3,
        retryDelay = 1000,
        onProgress,
      } = config;

      try {
        // Valider le fichier
        const validation = validateFile(file, {
          maxSize: config.maxSize,
        });

        if (!validation.valid) {
          throw new Error(validation.error || 'Fichier invalide');
        }

        // Compresser l'image si nécessaire
        let  fileToUpload= file;
        if (config.compressImages !== false) {
          const compressionOpts = config.compressionOptions || {};
          fileToUpload = await compressImageIfNeeded(file, {
            maxSizeMB: compressionOpts.maxSizeMB || 1,
            maxWidthOrHeight: compressionOpts.maxWidthOrHeight || 1920,
          });

          // Mettre à jour la progression après compression
          if (onProgress) {
            onProgress(20);
          }
        }

        // Générer le nom de fichier et le chemin
        const fileName = generateFileName(file.name);
        const filePath = folder.endsWith('/') ? `${folder}${fileName}` : `${folder}/${fileName}`;

        // Déterminer le Content-Type (utiliser celui du fichier compressé si différent)
        const contentType =
          validation.detectedMimeType ||
          fileToUpload.type ||
          file.type ||
          'application/octet-stream';

        // Mettre à jour la progression avant upload
        if (onProgress) {
          onProgress(30);
        }

        // VÉRIFICATION PRÉ-UPLOAD : S'assurer que fileToUpload est valide
        const isFile = fileToUpload instanceof File;
        const isBlob = fileToUpload instanceof Blob;
        if (!isFile && !isBlob) {
          throw new Error(`fileToUpload must be a File or Blob, got ${typeof fileToUpload}`);
        }

        if (fileToUpload.size === 0) {
          throw new Error('File is empty (0 bytes)');
        }

        // Logger les détails avant upload
        if (import.meta.env.DEV) {
          logger.info('Pre-upload verification', {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            fileToUploadType: fileToUpload.type,
            fileToUploadSize: fileToUpload.size,
            contentType,
            filePath,
            isFile: fileToUpload instanceof File,
            isBlob: fileToUpload instanceof Blob,
          });
        }

        // VÉRIFICATION PRÉ-UPLOAD : S'assurer que l'utilisateur est authentifié
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (!user || authError) {
          throw new Error(
            'Vous devez être connecté pour uploader des fichiers. Veuillez vous reconnecter.'
          );
        }

        // VÉRIFICATION PRÉ-UPLOAD : Vérifier que le bucket existe et est public (non-bloquant)
        // Note: On ne bloque pas l'upload si le bucket n'est pas trouvé, car il peut exister
        // mais ne pas être visible immédiatement (propagation Supabase)
        try {
          const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
          if (bucketsError) {
            logger.warn('Cannot list buckets (non-blocking)', { error: bucketsError });
          } else if (buckets) {
            const attachmentsBucket = buckets.find(b => b.id === bucket);
            if (attachmentsBucket) {
              if (!attachmentsBucket.public) {
                logger.warn('Bucket is not public! This may cause upload failures.', {
                  bucket: bucket,
                  public: attachmentsBucket.public,
                });
                // Ne pas bloquer, essayer quand même l'upload
              } else {
                logger.info('Bucket verified', { bucket, public: true });
              }
            } else {
              logger.warn(
                `Bucket "${bucket}" not found in list (may be propagation delay). Attempting upload anyway...`
              );
              // Ne pas bloquer, essayer quand même l'upload
            }
          }
        } catch (checkError) {
          logger.warn('Bucket check failed (non-blocking)', { error: checkError });
          // Ne pas bloquer, essayer quand même l'upload
        }

        // Upload vers Supabase Storage
        // CRITIQUE : Toujours passer contentType pour éviter les erreurs MIME type
        let  uploadData: { path: string; id?: string; fullPath?: string } | null = null;
        let  uploadError: Error | null = null;

        // CRITIQUE : S'assurer que fileToUpload est bien un File ou Blob, pas un FormData
        // Si c'est un FormData, extraire le fichier
        let  fileToUploadFinal: File | Blob = fileToUpload;

        // Vérifier que ce n'est pas un FormData (ce qui causerait le problème multipart)
        if (fileToUpload instanceof FormData) {
          logger.error('❌ CRITICAL: fileToUpload is FormData instead of File/Blob!', {
            fileName: file.name,
            fileType: typeof fileToUpload,
          });
          throw new Error(
            'Le fichier ne peut pas être uploadé en tant que FormData. Utilisez un File ou Blob.'
          );
        }

        // S'assurer que le fichier a le bon type MIME
        if (fileToUploadFinal instanceof File && fileToUploadFinal.type !== contentType) {
          // Créer un nouveau File avec le bon type MIME
          fileToUploadFinal = new File([fileToUploadFinal], fileToUploadFinal.name, {
            type: contentType,
            lastModified: fileToUploadFinal.lastModified,
          });
          logger.info('File MIME type corrected', {
            originalType: fileToUploadFinal.type,
            newType: contentType,
          });
        } else if (fileToUploadFinal instanceof Blob && fileToUploadFinal.type !== contentType) {
          // Créer un nouveau Blob avec le bon type MIME
          fileToUploadFinal = new Blob([fileToUploadFinal], { type: contentType });
          logger.info('Blob MIME type corrected', {
            originalType: fileToUploadFinal.type,
            newType: contentType,
          });
        }

        // UPLOAD VIA XMLHttpRequest (comme pour les images de produits) pour forcer le Content-Type
        // Cette approche évite que Supabase interprète mal le type de fichier
        // L'utilisateur est déjà vérifié plus haut, on récupère juste la session pour le token
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError || !session || !session.user) {
          throw new Error('Non authentifié. Veuillez vous reconnecter.');
        }

        const projectUrl = supabase.supabaseUrl;
        const uploadUrl = `${projectUrl}/storage/v1/object/${bucket}/${filePath}`;

        // Upload via XMLHttpRequest avec Content-Type explicite (comme uploadToSupabaseStorage)
        const uploadResult = await new Promise<{ path: string; error: Error | null }>(
          (resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', e => {
              if (e.lengthComputable && onProgress) {
                const progress = 40 + (e.loaded / e.total) * 30; // 40% à 70%
                onProgress(progress);
              }
            });

            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve({ path: response.path || filePath, error: null });
                } catch {
                  resolve({ path: filePath, error: null });
                }
              } else {
                try {
                  const error = JSON.parse(xhr.responseText);
                  reject(
                    new Error(
                      error.message ||
                        error.error ||
                        `Erreur upload: ${xhr.statusText} (${xhr.status})`
                    )
                  );
                } catch {
                  reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
                }
              }
            });

            xhr.addEventListener('error', () => {
              reject(new Error("Erreur réseau lors de l'upload"));
            });

            xhr.addEventListener('abort', () => {
              reject(new Error('Upload annulé'));
            });

            xhr.open('POST', uploadUrl);
            xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
            xhr.setRequestHeader('Content-Type', contentType); // CRITIQUE : Forcer le Content-Type dans les headers HTTP
            xhr.setRequestHeader('x-upsert', 'false');
            xhr.setRequestHeader('cache-control', '3600');

            xhr.send(fileToUploadFinal);
          }
        );

        uploadData = { path: uploadResult.path };
        uploadError = uploadResult.error;

        // VÉRIFICATION CRITIQUE : uploadData peut contenir une erreur même si uploadError est null
        // Cela arrive quand Supabase retourne une réponse JSON d'erreur au lieu du fichier
        if (uploadData && typeof uploadData === 'object') {
          // Vérifier si uploadData contient une erreur (réponse JSON d'erreur Supabase)
          if ('error' in uploadData || 'message' in uploadData) {
            const uploadDataWithError = uploadData as { error?: unknown; message?: unknown };
            const errorInData = uploadDataWithError.error || uploadDataWithError.message;
            if (errorInData) {
              logger.error('Error found in uploadData (JSON response from Supabase)', {
                errorInData,
                uploadData,
                suggestion: "Les politiques RLS bloquent probablement l'upload",
              });
              uploadError = new Error(
                errorInData.message || errorInData || 'Upload failed: RLS policy blocked'
              );
              uploadData = null;
            }
          }
        }

        // Si l'upload échoue, vérifier le type d'erreur
        if (uploadError) {
          const errorMessage = uploadError.message || '';

          // Si l'erreur mentionne RLS ou policy, c'est un problème de permissions
          if (
            errorMessage.includes('row-level security') ||
            errorMessage.includes('RLS') ||
            errorMessage.includes('policy') ||
            errorMessage.includes('permission')
          ) {
            logger.error('RLS policy blocking upload', {
              error: uploadError.message,
              bucket,
              filePath,
              suggestion:
                'Vérifiez les politiques RLS du bucket "attachments" dans Supabase Dashboard',
            });
            throw new Error(
              `Permission refusée : Les politiques RLS bloquent l'upload. Vérifiez que le bucket "attachments" a les bonnes permissions dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies.`
            );
          }

          // Si l'erreur mentionne JSON, c'est probablement une réponse d'erreur Supabase
          if (errorMessage.includes('json') || errorMessage.includes('JSON')) {
            logger.error('JSON error response from Supabase', {
              error: uploadError.message,
              suggestion: "Les politiques RLS bloquent probablement l'upload",
            });
            throw new Error(
              `Les politiques RLS bloquent l'upload. Le serveur retourne une erreur JSON. Vérifiez les politiques RLS du bucket "attachments".`
            );
          }

          // Autre erreur, la propager
          throw uploadError;
        }

        // LOGGING DÉTAILLÉ : Vérifier la réponse complète
        logger.info('Upload response details', {
          hasData: !!uploadData,
          hasError: !!uploadError,
          uploadDataType: typeof uploadData,
          uploadDataKeys: uploadData ? Object.keys(uploadData) : [],
          uploadErrorType: typeof uploadError,
          uploadError: uploadError
            ? {
                message: uploadError.message,
                statusCode: (uploadError as { statusCode?: number }).statusCode,
                error: (uploadError as { error?: unknown }).error,
              }
            : null,
          uploadDataContent: uploadData ? JSON.stringify(uploadData).substring(0, 200) : null,
        });

        // VÉRIFICATION CRITIQUE : uploadData peut contenir une erreur même si uploadError est null
        if (uploadData && typeof uploadData === 'object' && 'error' in uploadData) {
          const errorInData = (uploadData as { error?: unknown }).error;
          logger.error('Error found in uploadData', { errorInData, uploadData });
          throw new Error(`Upload failed: ${errorInData?.message || JSON.stringify(errorInData)}`);
        }

        if (uploadError) {
          // Logger l'erreur détaillée
          logger.error('Upload error details', {
            fileName: file.name,
            filePath,
            error: uploadError.message,
            errorCode:
              (uploadError as { statusCode?: number; code?: string }).statusCode ||
              (uploadError as { statusCode?: number; code?: string }).code,
            errorDetails: uploadError,
            retryCount,
            maxRetries,
          });

          // Retry si on n'a pas atteint le maximum
          if (retryCount < maxRetries) {
            logger.warn(`Upload failed, retrying (${retryCount + 1}/${maxRetries})`, {
              fileName: file.name,
              error: uploadError.message,
            });

            // Attendre avant de réessayer (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));

            return uploadSingleFile(file, config, retryCount + 1);
          }

          // Créer un message d'erreur plus détaillé
          let  errorMessage= uploadError.message || "Erreur lors de l'upload";

          // Améliorer le message selon le type d'erreur
          if (uploadError.message?.includes('new row violates row-level security')) {
            errorMessage = `Permission refusée : Les politiques RLS bloquent l'upload. Vérifiez que vous êtes connecté et que le bucket "attachments" a les bonnes permissions.`;
          } else if (uploadError.message?.includes('The resource already exists')) {
            errorMessage = `Le fichier existe déjà. Veuillez renommer le fichier ou supprimer l'ancien.`;
          } else if (uploadError.message?.includes('File size exceeds')) {
            errorMessage = `Fichier trop volumineux. Taille maximale : 10MB.`;
          } else if (uploadError.message?.includes('Invalid file type')) {
            errorMessage = `Type de fichier non autorisé. Types acceptés : images, vidéos, PDF, documents.`;
          }

          const detailedError = new Error(errorMessage) as Error & {
            originalError?: unknown;
            fileName?: string;
            filePath?: string;
          };
          detailedError.originalError = uploadError;
          detailedError.fileName = file.name;
          detailedError.filePath = filePath;

          throw detailedError;
        }

        if (!uploadData?.path) {
          logger.error('Upload returned no path', { uploadData, uploadError });
          throw new Error(
            'Upload returned no path. Vérifiez les politiques RLS du bucket "attachments".'
          );
        }

        // Attendre un délai plus long pour que Supabase finalise l'upload et propage les changements RLS
        // Les politiques RLS peuvent prendre quelques secondes pour se propager
        await new Promise(resolve => setTimeout(resolve, 2000));

        // VÉRIFICATION PRIMAIRE : Vérifier avec list() pour les métadonnées AVANT de tester l'URL
        // Cela permet de vérifier que le fichier est bien stocké avec le bon Content-Type
        const folderPath = filePath.split('/').slice(0, -1).join('/') || '';
        const uploadedFileName = filePath.split('/').pop() || fileName;

        // Retry la vérification list() jusqu'à 3 fois avec délai si nécessaire
        let  fileList= null;
        let  listError= null;
        let  foundFile= null;

        for (let  listRetry= 0; listRetry < 3; listRetry++) {
          const listResult = await supabase.storage.from(bucket).list(folderPath, {
            limit: 1000,
            search: uploadedFileName,
          });

          fileList = listResult.data;
          listError = listResult.error;

          if (!listError && fileList) {
            foundFile = fileList.find(f => f.name === uploadedFileName);
            if (foundFile) {
              break; // Fichier trouvé, sortir de la boucle
            }
          }

          // Si le fichier n'est pas trouvé, attendre un peu plus et réessayer
          if (listRetry < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        let  fileIsJson= false;
        let  actualContentType: string | null = null;

        if (listError) {
          logger.error('Cannot list file after upload (RLS issue?)', {
            listError,
            folderPath,
            uploadedFileName,
            suggestion: 'Vérifiez les politiques RLS du bucket "attachments"',
          });
          // Si on ne peut pas lister, c'est probablement un problème RLS
          // Lancer une erreur explicite
          throw new Error(
            `Les politiques RLS bloquent l'accès au fichier uploadé. Erreur: ${listError.message}. Vérifiez que la politique SELECT est pour PUBLIC dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies.`
          );
        } else {
          foundFile = fileList?.find(f => f.name === uploadedFileName);
          if (!foundFile) {
            logger.warn('File not found in list after upload', {
              folderPath,
              uploadedFileName,
              filesInFolder: fileList?.map(f => f.name),
            });
            // Si le fichier n'est pas trouvé, c'est probablement un problème RLS
            throw new Error(
              `Le fichier uploadé n'est pas accessible. Cela indique que les politiques RLS bloquent l'accès. Vérifiez que la politique SELECT est pour PUBLIC dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies.`
            );
          } else {
            // VÉRIFICATION CRITIQUE : Détecter si le fichier est enregistré comme JSON
            const uploadedContentType =
              foundFile.metadata?.mimetype ||
              foundFile.metadata?.contentType ||
              foundFile.metadata?.['content-type'];

            logger.info('File metadata from list()', {
              fileName: uploadedFileName,
              metadata: foundFile.metadata,
              contentType: uploadedContentType,
              size: foundFile.metadata?.size,
            });

            // Si les métadonnées indiquent JSON, c'est une erreur CRITIQUE
            // Supabase a stocké une réponse d'erreur JSON au lieu du fichier
            if (uploadedContentType === 'application/json') {
              fileIsJson = true;
              actualContentType = 'application/json';
              logger.error('❌ CRITICAL: File metadata shows JSON content type!', {
                expected: contentType,
                actual: uploadedContentType,
                fileName: uploadedFileName,
                filePath: uploadData.path,
                metadata: foundFile.metadata,
              });

              // Supprimer immédiatement le fichier JSON incorrect
              try {
                await supabase.storage.from(bucket).remove([uploadData.path]);
                logger.info('Fichier JSON incorrect supprimé du bucket', { path: uploadData.path });
              } catch (removeError) {
                logger.warn('Impossible de supprimer le fichier JSON incorrect', {
                  path: uploadData.path,
                  error: removeError,
                });
              }

              // Lancer une erreur explicite avec instructions
              // Cette erreur ne doit PAS déclencher de retry car c'est un problème de configuration RLS
              const errorMessage =
                `Le fichier a été uploadé comme JSON au lieu de ${contentType}. Cela indique que les politiques RLS bloquent l'upload.\n\n` +
                `CORRECTIONS NÉCESSAIRES:\n` +
                `1. Allez dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies\n` +
                `2. Vérifiez que la politique INSERT est pour "authenticated" (pas "public")\n` +
                `3. Vérifiez que la politique SELECT est pour "public" (pas "authenticated")\n` +
                `4. Exécutez la migration SQL: supabase/migrations/20250201_diagnose_and_fix_rls_attachments.sql\n` +
                `5. Attendez 2-3 minutes puis réessayez`;

              // Créer une erreur spéciale qui empêche le retry
              const rlsError = new Error(errorMessage) as Error & {
                isRLSError?: boolean;
                skipRetry?: boolean;
              };
              rlsError.isRLSError = true;
              rlsError.skipRetry = true;
              throw rlsError;
            } else if (uploadedContentType && uploadedContentType !== contentType) {
              logger.warn('Content-Type mismatch in metadata', {
                expected: contentType,
                actual: uploadedContentType,
                fileName: uploadedFileName,
              });
              // Ne pas traiter comme erreur si c'est proche (ex: image/jpeg vs image/jpg)
              if (!uploadedContentType.startsWith(contentType.split('/')[0])) {
                fileIsJson = true;
                actualContentType = uploadedContentType;
                // Même traitement que pour JSON
                try {
                  await supabase.storage.from(bucket).remove([uploadData.path]);
                  logger.info('Fichier avec mauvais Content-Type supprimé du bucket', {
                    path: uploadData.path,
                  });
                } catch (removeError) {
                  logger.warn('Impossible de supprimer le fichier', {
                    path: uploadData.path,
                    error: removeError,
                  });
                }
                throw new Error(
                  `Le fichier a été uploadé avec le mauvais Content-Type: ${uploadedContentType} au lieu de ${contentType}. Cela indique un problème avec les politiques RLS.`
                );
              }
            } else {
              logger.info('✅ File metadata verified', {
                fileName: uploadedFileName,
                contentType: uploadedContentType || contentType,
                size: foundFile.metadata?.size || fileToUploadFinal.size,
              });
            }
          }
        }

        // Obtenir l'URL publique pour la vérification finale
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);

        // VÉRIFICATION SECONDAIRE : Tester l'URL publique seulement si les métadonnées sont OK
        if (!fileIsJson) {
          try {
            const testResponse = await fetch(urlData.publicUrl, {
              method: 'HEAD',
              cache: 'no-cache',
            });

            actualContentType = testResponse.headers.get('content-type');

            if (
              actualContentType === 'application/json' ||
              actualContentType?.includes('application/json')
            ) {
              fileIsJson = true;

              // Lire le JSON pour voir l'erreur exacte
              let  jsonError= 'Erreur inconnue';
              let  rawErrorContent= '';
              try {
                const jsonResponse = await fetch(urlData.publicUrl, {
                  method: 'GET',
                  cache: 'no-cache',
                });

                // Lire d'abord le texte brut pour voir ce que Supabase retourne vraiment
                rawErrorContent = await jsonResponse.text();

                // Essayer de parser le JSON seulement si c'est valide
                try {
                  const errorData = JSON.parse(rawErrorContent);
                  jsonError =
                    errorData.message ||
                    errorData.error ||
                    errorData.code ||
                    JSON.stringify(errorData);
                  logger.error('❌ CRITICAL: File URL returns JSON instead of image!', {
                    expected: contentType,
                    actual: actualContentType,
                    fileName: file.name,
                    filePath: uploadData.path,
                    publicUrl: urlData.publicUrl,
                    supabaseError: jsonError,
                    fullErrorData: errorData,
                    rawContent: rawErrorContent.substring(0, 500), // Limiter à 500 caractères
                    suggestion:
                      "Les politiques RLS bloquent l'accès au fichier. Supabase retourne une erreur JSON.",
                  });
                } catch (jsonParseError) {
                  // Si ce n'est pas du JSON valide, utiliser le texte brut
                  jsonError = rawErrorContent.substring(0, 200) || 'Réponse non-JSON de Supabase';
                  logger.error('❌ CRITICAL: File URL returns non-JSON content instead of image!', {
                    expected: contentType,
                    actual: actualContentType,
                    fileName: file.name,
                    filePath: uploadData.path,
                    publicUrl: urlData.publicUrl,
                    supabaseError: jsonError,
                    rawContent: rawErrorContent.substring(0, 500),
                    jsonParseError:
                      jsonParseError instanceof Error
                        ? jsonParseError.message
                        : String(jsonParseError),
                    suggestion:
                      "Les politiques RLS bloquent l'accès au fichier. Supabase retourne une réponse d'erreur.",
                  });
                }
              } catch (jsonReadError) {
                logger.error('❌ CRITICAL: File URL returns JSON instead of image!', {
                  expected: contentType,
                  actual: actualContentType,
                  fileName: file.name,
                  filePath: uploadData.path,
                  publicUrl: urlData.publicUrl,
                  jsonReadError:
                    jsonReadError instanceof Error ? jsonReadError.message : String(jsonReadError),
                  suggestion:
                    "Les politiques RLS bloquent l'accès au fichier. Supabase retourne une erreur JSON.",
                });
              }
            } else if (testResponse.status !== 200) {
              logger.error('File URL returns non-200 status', {
                status: testResponse.status,
                statusText: testResponse.statusText,
                contentType: actualContentType,
                filePath: uploadData.path,
              });
              fileIsJson = true; // Traiter comme erreur
            } else {
              logger.info('✅ File URL accessible', {
                contentType: actualContentType,
                status: testResponse.status,
              });
            }
          } catch (fetchError) {
            logger.error('Cannot fetch file URL', {
              error: fetchError,
              filePath: uploadData.path,
              publicUrl: urlData.publicUrl,
            });
            // Continuer même si l'URL publique ne fonctionne pas
          }
        }

        // Si fileIsJson est true, le fichier a été uploadé comme JSON - c'est une erreur critique
        if (fileIsJson) {
          // Vérifier si les métadonnées sont correctes (le fichier est bien uploadé)
          const uploadedContentType =
            foundFile?.metadata?.mimetype ||
            foundFile?.metadata?.contentType ||
            foundFile?.metadata?.['content-type'];

          // Si les métadonnées sont correctes mais l'URL publique ne fonctionne pas,
          // c'est un problème RLS, pas un problème d'upload - ne pas supprimer le fichier
          if (
            foundFile &&
            uploadedContentType &&
            uploadedContentType !== 'application/json' &&
            uploadedContentType === contentType
          ) {
            logger.warn('⚠️ File uploaded correctly but public URL blocked by RLS', {
              expected: contentType,
              metadataContentType: uploadedContentType,
              urlContentType: actualContentType,
              fileName: uploadedFileName,
              filePath: uploadData.path,
              publicUrl: urlData.publicUrl,
              suggestion:
                "Le fichier est bien uploadé mais les RLS bloquent l'accès public. Utilisez un signed URL ou corrigez les RLS.",
            });
            // Ne pas supprimer le fichier - il est correctement uploadé
            // L'erreur est seulement sur l'accès public
            fileIsJson = false; // Réinitialiser pour continuer
          } else {
            // Les métadonnées indiquent aussi JSON - c'est un vrai problème d'upload
            // Supprimer le fichier JSON incorrect du bucket
            try {
              await supabase.storage.from(bucket).remove([uploadData.path]);
              logger.info('Fichier JSON incorrect supprimé du bucket', { path: uploadData.path });
            } catch (removeError) {
              logger.warn('Impossible de supprimer le fichier JSON incorrect', {
                path: uploadData.path,
                error: removeError,
              });
            }

            // Lancer une erreur détaillée
            const { checkStoragePermissions, formatPermissionCheckReport } =
              await import('@/utils/checkStoragePermissions');
            const permissionCheck = await checkStoragePermissions();
            const report = formatPermissionCheckReport(permissionCheck);

            let  errorMessage= `Le fichier a été uploadé comme JSON au lieu de ${contentType}.\n`;
            errorMessage += "Cela indique que les politiques RLS bloquent l'accès au fichier.\n\n";
            errorMessage += 'CORRECTIONS NÉCESSAIRES:\n';
            errorMessage +=
              '1. Exécutez la migration SQL: supabase/migrations/20250201_verify_rls_policies_exact.sql\n';
            errorMessage +=
              '2. Vérifiez que la politique SELECT est pour PUBLIC (pas authenticated)\n';
            errorMessage +=
              '3. Exécutez la migration SQL: supabase/migrations/20250201_diagnose_and_fix_rls_attachments.sql\n';
            errorMessage +=
              '4. Vérifiez dans Supabase Dashboard > Storage > Buckets > "attachments" > Policies\n';

            throw new Error(errorMessage);
          }
        }

        // Initialiser fileVerified et verificationError basés sur fileIsJson
        let  fileVerified= !fileIsJson;
        const  verificationError: string | null = fileIsJson
          ? 'Le fichier a été uploadé comme JSON au lieu du type attendu'
          : null;

        // Si fileIsJson est false mais que l'URL publique n'a pas été vérifiée, on vérifie avec une URL signée comme fallback
        let  signedUrl: string | null = null;
        if (!fileVerified && !verificationError) {
          // Si on arrive ici, c'est que fileIsJson est true mais les métadonnées sont correctes
          // On essaie une URL signée comme fallback
          try {
            logger.info('⚠️ Public URL failed, trying signed URL as fallback', {
              path: uploadData.path,
            });

            const { data: signedData, error: signedError } = await supabase.storage
              .from(bucket)
              .createSignedUrl(uploadData.path, 3600); // Valide 1 heure

            if (!signedError && signedData?.signedUrl) {
              // Tester l'URL signée
              const signedTestResponse = await fetch(signedData.signedUrl, {
                method: 'HEAD',
                cache: 'no-cache',
              });

              if (signedTestResponse.ok) {
                const signedContentType = signedTestResponse.headers.get('content-type') || '';
                if (!signedContentType.includes('application/json')) {
                  signedUrl = signedData.signedUrl;
                  fileVerified = true; // Marquer comme vérifié avec l'URL signée
                  logger.info('✅ Signed URL works as fallback', {
                    path: uploadData.path,
                    expiresIn: 3600,
                  });
                } else {
                  logger.error('❌ Signed URL also returns JSON', {
                    path: uploadData.path,
                  });
                }
              }
            }
          } catch ( _signedUrlError: unknown) {
            logger.warn('Could not generate or test signed URL as fallback', {
              path: uploadData.path,
              error: signedUrlError,
            });
          }
        }

        // Si même l'URL signée ne fonctionne pas, lancer une erreur avec diagnostic
        if (!fileVerified && verificationError) {
          // Importer le diagnostic dynamiquement pour éviter les dépendances circulaires
          const { diagnoseAttachmentsBucket, formatDiagnosticResult } =
            await import('@/utils/diagnoseBucketConfig');

          let  diagnosticInfo= '';
          try {
            const diagnostic = await diagnoseAttachmentsBucket();
            diagnosticInfo = '\n\n' + formatDiagnosticResult(diagnostic);
          } catch (diagError) {
            // Si le diagnostic échoue, on continue avec le message d'erreur de base
            logger.warn('Could not run bucket diagnostic', { error: diagError });
          }

          // Déterminer quelle migration utiliser selon le diagnostic
          // Utiliser la migration complète qui crée ET configure le bucket
          const migrationFile =
            'supabase/migrations/20250201_create_and_configure_attachments_bucket.sql';

          const errorMessage = `Le fichier n'a pas pu être uploadé correctement. ${verificationError}.${diagnosticInfo}\n\n📋 SOLUTION RAPIDE:\n1. Allez dans Supabase Dashboard > SQL Editor\n2. Exécutez la migration: ${migrationFile}\n3. Vérifiez que le bucket "attachments" est PUBLIC\n4. Attendez 2-3 minutes puis réessayez`;

          throw new Error(errorMessage);
        }

        if (!fileVerified) {
          throw new Error(
            `Impossible de vérifier que le fichier a été uploadé. Chemin: ${uploadData.path}. SOLUTION: Vérifiez que le bucket "attachments" est PUBLIC dans Supabase Dashboard et exécutez la migration "20250201_verify_and_fix_attachments_bucket.sql".`
          );
        }

        // Mettre à jour la progression
        onProgress?.(100);

        // Mettre à jour la progression finale
        if (onProgress) {
          onProgress(100);
        }

        return {
          path: uploadData.path,
          publicUrl: urlData.publicUrl,
          signedUrl: signedUrl || null, // URL signée comme fallback
          fileName: file.name, // Garder le nom original
          mimeType: contentType,
          size: fileToUploadFinal.size, // Taille après compression
        };
      } catch ( _error: unknown) {
        // Si c'est une erreur RLS (fichier uploadé comme JSON), ne pas retry
        const err = error as { isRLSError?: boolean; skipRetry?: boolean };
        if (err?.isRLSError || err?.skipRetry) {
          throw error;
        }

        // Si on a épuisé les tentatives, lancer l'erreur
        if (retryCount >= maxRetries) {
          throw error;
        }

        // Sinon, réessayer
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return uploadSingleFile(file, config, retryCount + 1);
      }
    },
    [generateFileName]
  );

  /**
   * Upload plusieurs fichiers
   */
  const uploadFiles = useCallback(
    async (files: File[], config: UploadConfig): Promise<UploadResult[]> => {
      setState({
        uploading: true,
        progress: 0,
        error: null,
        uploaded: [],
        failed: [],
      });

      const  results: UploadResult[] = [];
      const  failed: Array<{ file: File; error: string }> = [];

      try {
        // Valider tous les fichiers d'abord
        const  invalidFiles: File[] = [];
        for (const file of files) {
          const validation = validateFile(file, {
            maxSize: config.maxSize,
          });

          if (!validation.valid) {
            invalidFiles.push(file);
            failed.push({
              file,
              error: validation.error || 'Fichier invalide',
            });
          }
        }

        // Afficher les erreurs de validation
        if (invalidFiles.length > 0) {
          toast({
            title: 'Fichiers invalides',
            description: `${invalidFiles.length} fichier(s) invalide(s)`,
            variant: 'destructive',
          });
        }

        // Uploader les fichiers valides
        const validFiles = files.filter(file => !invalidFiles.includes(file));

        for (let  i= 0; i < validFiles.length; i++) {
          const file = validFiles[i];

          try {
            const result = await uploadSingleFile(file, {
              ...config,
              onProgress: fileProgress => {
                // Calculer la progression globale
                const overallProgress = Math.round(
                  ((i + fileProgress / 100) / validFiles.length) * 100
                );
                config.onProgress?.(overallProgress);
                setState(prev => ({ ...prev, progress: overallProgress }));
              },
            });

            results.push(result);
            setState(prev => ({
              ...prev,
              uploaded: [...prev.uploaded, result],
            }));
          } catch ( _error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            const errorMessage = err.message || "Erreur inconnue lors de l'upload";

            logger.error('File upload failed', {
              fileName: file.name,
              error: errorMessage,
              originalError: error,
            });

            failed.push({
              file,
              error: errorMessage,
            });

            // Ne pas afficher de toast ici, on les affichera tous à la fin
          }
        }

        // Si des fichiers ont échoué, lancer une erreur avec les détails
        if (failed.length > 0) {
          const failedFilesList = failed.map(f => `• ${f.file.name}: ${f.error}`).join('\n');
          const errorMessage = `${failed.length} fichier(s) n'ont pas pu être uploadés:\n${failedFilesList}`;

          logger.error('Some files failed to upload', {
            failedCount: failed.length,
            totalFiles: files.length,
            successCount: results.length,
            failedFiles: failed.map(f => ({ name: f.file.name, error: f.error })),
          });

          // Mettre à jour l'état avec les fichiers échoués
          setState(prev => ({
            ...prev,
            failed,
            uploading: false,
            error: errorMessage,
          }));

          // Lancer une erreur avec les détails (sera capturée par le catch ci-dessous)
          const aggregatedError = new Error(errorMessage) as Error & {
            failedFiles?: Array<{ fileName: string; error: string }>;
            successCount?: number;
            failedCount?: number;
          };
          aggregatedError.failedFiles = failed;
          aggregatedError.successCount = results.length;
          aggregatedError.failedCount = failed.length;

          throw aggregatedError;
        }

        // Afficher un résumé seulement si tous les fichiers ont réussi
        if (results.length > 0 && failed.length === 0) {
          toast({
            title: 'Upload terminé',
            description: `${results.length} fichier(s) uploadé(s) avec succès`,
          });
        }

        // Mettre à jour l'état final
        setState(prev => ({
          ...prev,
          uploading: false,
          uploaded: results,
          failed: failed,
        }));

        return results;
      } catch ( _error: unknown) {
        logger.error('Upload batch failed', error);

        // Si l'erreur contient des détails sur les fichiers échoués, les utiliser
        const errorMessage = error.message || "Erreur lors de l'upload";
        const failedFiles =
          (error as { failedFiles?: Array<{ fileName: string; error: string }> }).failedFiles || [];

        setState(prev => ({
          ...prev,
          error: errorMessage,
          failed: failedFiles,
          uploading: false,
        }));

        // Ne pas afficher de toast ici, il sera affiché dans VendorMessaging avec plus de détails
        // toast({
        //   title: 'Erreur',
        //   description: errorMessage,
        //   variant: 'destructive',
        // });

        // Relancer l'erreur pour qu'elle soit capturée dans VendorMessaging
        throw error;
      } finally {
        setState(prev => ({
          ...prev,
          uploading: false,
        }));
      }
    },
    [uploadSingleFile, toast]
  );

  /**
   * Réinitialiser l'état
   */
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      uploaded: [],
      failed: [],
    });
  }, []);

  return {
    uploadFiles,
    uploadSingleFile,
    state,
    reset,
  };
}






