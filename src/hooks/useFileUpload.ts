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
import { checkStoragePermissions, formatPermissionCheckReport } from '@/utils/checkStoragePermissions';

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
  } catch (error: any) {
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
export async function uploadFileToStorage(
  file: File,
  config: UploadConfig
): Promise<UploadResult> {
  const {
    bucket = 'attachments',
    folder,
    maxRetries = 3,
    retryDelay = 1000,
  } = config;

  // Valider le fichier
  const validation = validateFile(file, {
    maxSize: config.maxSize,
  });

  if (!validation.valid) {
    throw new Error(validation.error || 'Fichier invalide');
  }

  // Compresser l'image si nécessaire (avant validation de taille finale)
  let fileToUpload = file;
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
  const filePath = folder.endsWith('/') 
    ? `${folder}${fileName}` 
    : `${folder}/${fileName}`;

  // Déterminer le Content-Type (utiliser celui du fichier compressé si différent)
  const contentType = validation.detectedMimeType || fileToUpload.type || file.type || 'application/octet-stream';

  // Upload avec retry et progress tracking
  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
        lastError = uploadError;
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
          throw new Error(`Le fichier n'a pas été trouvé dans le bucket après l'upload. Chemin: ${uploadData.path}`);
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
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

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
            throw new Error(`L'URL publique retourne du JSON au lieu du fichier. Chemin: ${uploadData.path}`);
          }
        }
      } catch (fetchError: any) {
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
    } catch (error: any) {
      lastError = error;
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
 *     onProgress: (progress) => console.log(`${progress}%`),
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
    async (
      file: File,
      config: UploadConfig,
      retryCount = 0
    ): Promise<UploadResult> => {
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
        let fileToUpload = file;
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
        const filePath = folder.endsWith('/') 
          ? `${folder}${fileName}` 
          : `${folder}/${fileName}`;

        // Déterminer le Content-Type (utiliser celui du fichier compressé si différent)
        const contentType = validation.detectedMimeType || fileToUpload.type || file.type || 'application/octet-stream';

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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) {
          throw new Error('Vous devez être connecté pour uploader des fichiers. Veuillez vous reconnecter.');
        }

        // VÉRIFICATION PRÉ-UPLOAD : Vérifier que le bucket existe et est public
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
          logger.error('Cannot list buckets', { error: bucketsError });
        } else {
          const attachmentsBucket = buckets?.find(b => b.id === bucket);
          if (attachmentsBucket && !attachmentsBucket.public) {
            logger.warn('Bucket is not public! This will cause upload failures.', {
              bucket: bucket,
              public: attachmentsBucket.public,
            });
            throw new Error(`Le bucket "${bucket}" n'est pas public. Activez "Public bucket" dans Supabase Dashboard > Storage > Buckets.`);
          }
        }

        // Upload vers Supabase Storage
        // APPROCHE MINIMALE : Aucune option pour éviter les conflits
        // Supabase devrait détecter automatiquement le Content-Type depuis le fichier
        let uploadData: { path: string; id?: string; fullPath?: string } | null = null;
        let uploadError: Error | null = null;
        
        const uploadResult = await supabase.storage
          .from(bucket)
          .upload(filePath, fileToUpload);
        
        uploadData = uploadResult.data;
        uploadError = uploadResult.error;
        
        // Si l'upload échoue avec une erreur JSON ou RLS, essayer avec contentType explicite
        if (uploadError && (uploadError.message?.includes('json') || uploadError.message?.includes('RLS'))) {
          logger.warn('First upload attempt failed, retrying with explicit contentType', {
            error: uploadError.message,
            retryWithContentType: true,
          });
          
          // Réessayer avec contentType explicite
          const retryResult = await supabase.storage
            .from(bucket)
            .upload(filePath, fileToUpload, {
              contentType,
            });
          
          if (retryResult.error) {
            // Si ça échoue encore, l'erreur est probablement liée aux RLS
            throw retryResult.error;
          }
          
          // Utiliser les données du retry
          uploadData = retryResult.data;
          uploadError = null;
        }

        // LOGGING DÉTAILLÉ : Vérifier la réponse complète
        logger.info('Upload response details', {
          hasData: !!uploadData,
          hasError: !!uploadError,
          uploadDataType: typeof uploadData,
          uploadDataKeys: uploadData ? Object.keys(uploadData) : [],
          uploadErrorType: typeof uploadError,
          uploadError: uploadError ? {
            message: uploadError.message,
            statusCode: (uploadError as any).statusCode,
            error: (uploadError as any).error,
          } : null,
          uploadDataContent: uploadData ? JSON.stringify(uploadData).substring(0, 200) : null,
        });

        // VÉRIFICATION CRITIQUE : uploadData peut contenir une erreur même si uploadError est null
        if (uploadData && typeof uploadData === 'object' && 'error' in uploadData) {
          const errorInData = (uploadData as any).error;
          logger.error('Error found in uploadData', { errorInData, uploadData });
          throw new Error(`Upload failed: ${errorInData?.message || JSON.stringify(errorInData)}`);
        }

        if (uploadError) {
          // Logger l'erreur détaillée
          logger.error('Upload error details', {
            fileName: file.name,
            filePath,
            error: uploadError.message,
            errorCode: (uploadError as any).statusCode || (uploadError as any).code,
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
          let errorMessage = uploadError.message || 'Erreur lors de l\'upload';
          
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
          
          const detailedError = new Error(errorMessage);
          (detailedError as any).originalError = uploadError;
          (detailedError as any).fileName = file.name;
          (detailedError as any).filePath = filePath;
          
          throw detailedError;
        }

        if (!uploadData?.path) {
          logger.error('Upload returned no path', { uploadData, uploadError });
          throw new Error('Upload returned no path. Vérifiez les politiques RLS du bucket "attachments".');
        }

        // VÉRIFICATION IMMÉDIATE : Vérifier que le fichier existe dans le bucket avec list()
        // Cette vérification permet de détecter si le fichier est enregistré comme JSON
        const folderPath = filePath.split('/').slice(0, -1).join('/') || '';
        const uploadedFileName = filePath.split('/').pop() || fileName;
        
        // Attendre un court délai pour la propagation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: fileList, error: listError } = await supabase.storage
          .from(bucket)
          .list(folderPath, {
            limit: 1000,
            search: uploadedFileName,
          });
        
        if (listError) {
          logger.error('Cannot list file after upload (RLS issue?)', {
            listError,
            folderPath,
            uploadedFileName,
            suggestion: 'Vérifiez les politiques RLS du bucket "attachments"',
          });
        } else {
          const foundFile = fileList?.find(f => f.name === uploadedFileName);
          if (!foundFile) {
            logger.warn('File not found in list after upload', {
              folderPath,
              uploadedFileName,
              filesInFolder: fileList?.map(f => f.name),
            });
          } else {
            // VÉRIFICATION CRITIQUE : Détecter si le fichier est enregistré comme JSON
            const uploadedContentType = foundFile.metadata?.mimetype || foundFile.metadata?.contentType;
            if (uploadedContentType === 'application/json') {
              logger.error('❌ CRITICAL: File uploaded as JSON instead of image!', {
                expected: contentType,
                actual: uploadedContentType,
                fileName: uploadedFileName,
                filePath: uploadData.path,
                suggestion: 'Les politiques RLS bloquent probablement l\'upload. Le fichier JSON est une réponse d\'erreur Supabase.',
              });
              // Supprimer le fichier JSON incorrect du bucket
              try {
                await supabase.storage
                  .from(bucket)
                  .remove([uploadData.path]);
                logger.info('Fichier JSON incorrect supprimé du bucket', { path: uploadData.path });
              } catch (removeError) {
                logger.warn('Impossible de supprimer le fichier JSON incorrect', { path: uploadData.path, error: removeError });
              }
              
              // Vérifier les permissions pour donner des instructions précises
              logger.warn('Vérification des permissions de stockage...');
              const permissionCheck = await checkStoragePermissions();
              const report = formatPermissionCheckReport(permissionCheck);
              logger.error('Rapport de vérification des permissions:\n' + report);
              
              // Créer un message d'erreur détaillé
              let errorMessage = `Le fichier a été uploadé comme JSON au lieu de ${contentType}. Cela indique que les politiques RLS bloquent l'upload.\n\n`;
              errorMessage += 'CORRECTIONS NÉCESSAIRES:\n';
              errorMessage += '1. Vérifiez que le bucket "attachments" est PUBLIC dans Supabase Dashboard\n';
              errorMessage += '2. Exécutez la migration SQL: supabase/migrations/20250201_fix_attachments_final_complete.sql\n';
              errorMessage += '3. Exécutez la migration SQL: supabase/migrations/20250201_fix_attachments_mime_types.sql\n';
              if (permissionCheck.errors.length > 0) {
                errorMessage += '\nErreurs détectées:\n';
                permissionCheck.errors.forEach(err => {
                  errorMessage += `  • ${err}\n`;
                });
              }
              
              throw new Error(errorMessage);
            }
            
            // Vérifier que le Content-Type correspond
            if (uploadedContentType && uploadedContentType !== contentType) {
              logger.warn('Content-Type mismatch', {
                expected: contentType,
                actual: uploadedContentType,
                fileName: uploadedFileName,
              });
            }
            
            logger.info('✅ File verified in bucket after upload', {
              fileName: uploadedFileName,
              contentType: uploadedContentType || contentType,
              size: foundFile.metadata?.size || fileToUpload.size,
            });
          }
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(uploadData.path);

        // VÉRIFICATION PRINCIPALE : Tester l'URL publique (plus fiable que list())
        let fileVerified = false;
        let verificationError: string | null = null;
        
        try {
          const testResponse = await fetch(urlData.publicUrl, { 
            method: 'HEAD',
            cache: 'no-cache',
            headers: {
              'Accept': '*/*',
            },
          });
          
          if (testResponse.ok) {
            const contentType = testResponse.headers.get('content-type') || '';
            
            // Vérifier que ce n'est pas du JSON (erreur Supabase)
            if (contentType === 'application/json' || contentType.includes('application/json')) {
              // Lire le JSON pour voir l'erreur exacte
              try {
                // Faire un GET pour obtenir le JSON complet (HEAD ne retourne pas le body)
                const jsonResponse = await fetch(urlData.publicUrl, { 
                  method: 'GET',
                  cache: 'no-cache',
                });
                const errorData = await jsonResponse.json();
                
                const supabaseError = errorData.message || errorData.error || JSON.stringify(errorData);
                
                verificationError = `Le serveur retourne du JSON au lieu du fichier. Erreur Supabase: ${supabaseError}. SOLUTION: Exécutez la migration SQL "20250201_verify_and_fix_attachments_bucket.sql" dans Supabase Dashboard pour corriger les politiques RLS du bucket "attachments".`;
                
                logger.error('Public URL returns JSON instead of file', {
                  path: uploadData.path,
                  publicUrl: urlData.publicUrl,
                  errorData,
                  suggestion: 'Exécutez la migration: supabase/migrations/20250201_verify_and_fix_attachments_bucket.sql',
                });
              } catch {
                verificationError = 'Le serveur retourne du JSON au lieu du fichier. SOLUTION: Exécutez la migration SQL "20250201_verify_and_fix_attachments_bucket.sql" dans Supabase Dashboard pour corriger les politiques RLS.';
              }
            } else {
              // Le fichier est accessible et a le bon Content-Type
              fileVerified = true;
              if (import.meta.env.DEV) {
                logger.info('✅ File verified via public URL after upload', {
                  path: uploadData.path,
                  publicUrl: urlData.publicUrl,
                  contentType,
                  contentLength: testResponse.headers.get('content-length'),
                });
              }
            }
          } else {
            // Erreur HTTP
            const status = testResponse.status;
            const statusText = testResponse.statusText;
            
            if (status === 403) {
              verificationError = `Permission refusée (403). Vérifiez les politiques RLS du bucket "attachments".`;
            } else if (status === 404) {
              verificationError = `Fichier introuvable (404). Le fichier n'existe pas dans le bucket. Chemin: ${uploadData.path}`;
            } else {
              verificationError = `Erreur HTTP ${status}: ${statusText}`;
            }
            
            logger.error('Public URL not accessible after upload', {
              path: uploadData.path,
              publicUrl: urlData.publicUrl,
              status,
              statusText,
            });
          }
        } catch (fetchError: any) {
          // Erreur réseau (CORS, timeout, etc.)
          verificationError = `Impossible de vérifier l'accès au fichier: ${fetchError.message}`;
          logger.warn('Could not test public URL after upload', {
            path: uploadData.path,
            publicUrl: urlData.publicUrl,
            error: fetchError,
          });
          
          // Si c'est une erreur réseau, on essaie quand même avec list() comme fallback
          try {
            const pathParts = uploadData.path.split('/');
            const folderPath = pathParts.slice(0, -1).join('/') || '';
            const uploadedFileName = pathParts[pathParts.length - 1];
            
            const { data: fileList, error: listError } = await supabase.storage
              .from(bucket)
              .list(folderPath, {
                limit: 1000,
                search: uploadedFileName,
              });
            
            if (!listError && fileList) {
              const fileExists = fileList.some(f => f.name === uploadedFileName);
              if (fileExists) {
                fileVerified = true;
                logger.info('✅ File verified via list() after upload (fallback)', {
                  path: uploadData.path,
                  uploadedFileName,
                });
              } else {
                verificationError = `Le fichier n'a pas été trouvé dans le bucket. Chemin: ${uploadData.path}`;
              }
            }
          } catch (listError: any) {
            // Si list() échoue aussi, on garde l'erreur originale
            logger.warn('Could not verify file existence with list()', {
              path: uploadData.path,
              error: listError,
            });
          }
        }
        
        // Si la vérification a échoué, essayer avec une URL signée comme fallback
        let signedUrl: string | null = null;
        if (!fileVerified) {
          try {
            logger.info('⚠️ Public URL failed, trying signed URL as fallback', {
              path: uploadData.path,
              error: verificationError,
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
          } catch (signedUrlError: any) {
            logger.warn('Could not generate or test signed URL as fallback', {
              path: uploadData.path,
              error: signedUrlError,
            });
          }
        }
        
        // Si même l'URL signée ne fonctionne pas, lancer une erreur avec diagnostic
        if (!fileVerified && verificationError) {
          // Importer le diagnostic dynamiquement pour éviter les dépendances circulaires
          const { diagnoseAttachmentsBucket, formatDiagnosticResult } = await import('@/utils/diagnoseBucketConfig');
          
          let diagnosticInfo = '';
          try {
            const diagnostic = await diagnoseAttachmentsBucket();
            diagnosticInfo = '\n\n' + formatDiagnosticResult(diagnostic);
          } catch (diagError) {
            // Si le diagnostic échoue, on continue avec le message d'erreur de base
            logger.warn('Could not run bucket diagnostic', { error: diagError });
          }
          
          // Déterminer quelle migration utiliser selon le diagnostic
          // Utiliser la migration complète qui crée ET configure le bucket
          const migrationFile = 'supabase/migrations/20250201_create_and_configure_attachments_bucket.sql';
          
          const errorMessage = `Le fichier n'a pas pu être uploadé correctement. ${verificationError}.${diagnosticInfo}\n\n📋 SOLUTION RAPIDE:\n1. Allez dans Supabase Dashboard > SQL Editor\n2. Exécutez la migration: ${migrationFile}\n3. Vérifiez que le bucket "attachments" est PUBLIC\n4. Attendez 2-3 minutes puis réessayez`;
          
          throw new Error(errorMessage);
        }
        
        if (!fileVerified) {
          throw new Error(`Impossible de vérifier que le fichier a été uploadé. Chemin: ${uploadData.path}. SOLUTION: Vérifiez que le bucket "attachments" est PUBLIC dans Supabase Dashboard et exécutez la migration "20250201_verify_and_fix_attachments_bucket.sql".`);
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
          size: fileToUpload.size, // Taille après compression
        };
      } catch (error: any) {
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
    async (
      files: File[],
      config: UploadConfig
    ): Promise<UploadResult[]> => {
      setState({
        uploading: true,
        progress: 0,
        error: null,
        uploaded: [],
        failed: [],
      });

      const results: UploadResult[] = [];
      const failed: Array<{ file: File; error: string }> = [];

      try {
        // Valider tous les fichiers d'abord
        const invalidFiles: File[] = [];
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
        const validFiles = files.filter(
          file => !invalidFiles.includes(file)
        );

        for (let i = 0; i < validFiles.length; i++) {
          const file = validFiles[i];
          
          try {
            const result = await uploadSingleFile(file, {
              ...config,
              onProgress: (fileProgress) => {
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
          } catch (error: any) {
            const errorMessage = error.message || 'Erreur inconnue lors de l\'upload';
            
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
          const aggregatedError = new Error(errorMessage);
          (aggregatedError as any).failedFiles = failed;
          (aggregatedError as any).successCount = results.length;
          (aggregatedError as any).failedCount = failed.length;
          
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
      } catch (error: any) {
        logger.error('Upload batch failed', error);
        
        // Si l'erreur contient des détails sur les fichiers échoués, les utiliser
        const errorMessage = error.message || 'Erreur lors de l\'upload';
        const failedFiles = (error as any).failedFiles || [];
        
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
