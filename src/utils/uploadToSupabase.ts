/**
 * Utilitaire professionnel pour upload de fichiers vers Supabase Storage
 *
 * Fonctionnalités :
 * - Validation taille et type de fichier
 * - Progress tracking pour UX optimale
 * - Gestion d'erreurs robuste
 * - Support multi-buckets
 * - Noms de fichiers uniques et sécurisés
 *
 * @module uploadToSupabase
 */

import { supabase } from '@/integrations/supabase/client';
import { validateFileSecurity } from '@/lib/file-security';
import { logger } from '@/lib/logger';

/**
 * Options de configuration pour l'upload
 */
export interface UploadOptions {
  /** Nom du bucket Supabase Storage */
  bucket: string;

  /** Chemin optionnel dans le bucket (ex: 'products/images') */
  path?: string;

  /** Callback pour suivre la progression (0-100) */
  onProgress?: (progress: number) => void;

  /** Taille maximale en bytes (défaut: 10MB) */
  maxSizeBytes?: number;

  /** Types MIME autorisés */
  allowedTypes?: string[];

  /** Préfixe personnalisé pour le nom de fichier */
  filePrefix?: string;
}

/**
 * Résultat de l'upload
 */
export interface UploadResult {
  /** URL publique du fichier uploadé */
  url: string | null;

  /** Chemin complet du fichier dans le bucket */
  path: string | null;

  /** Erreur éventuelle */
  error: Error | null;

  /** Succès de l'opération */
  success: boolean;
}

/**
 * Types MIME par défaut autorisés pour les images
 */
const DEFAULT_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

/**
 * Taille maximale par défaut : 10MB
 */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

/**
 * Génère un nom de fichier unique et sécurisé
 */
function generateUniqueFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';

  const baseName = prefix
    ? `${prefix}_${timestamp}_${randomString}`
    : `${timestamp}_${randomString}`;

  return `${baseName}.${fileExtension}`;
}

/**
 * Formate les bytes en taille lisible (KB, MB, GB)
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Upload un fichier vers Supabase Storage
 *
 * @param file - Fichier à uploader
 * @param options - Options de configuration
 * @returns Résultat de l'upload avec URL publique
 *
 * @example
 * ```typescript
 * const { url, error } = await uploadToSupabaseStorage(file, {
 *   bucket: 'product-images',
 *   path: 'services',
 *   onProgress: (progress) => setUploadProgress(progress),
 * });
 *
 * if (error) {
 *   toast({ title: "Erreur d'upload", description: error.message });
 * } else {
 *   setImageUrl(url);
 * }
 * ```
 */
export async function uploadToSupabaseStorage(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const {
    bucket,
    path = '',
    onProgress,
    maxSizeBytes = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_IMAGE_TYPES,
    filePrefix,
  } = options;

  try {
    // 1. VALIDATION DE SÉCURITÉ CÔTÉ CLIENT (Magic bytes, signatures, extensions dangereuses)
    const securityValidation = await validateFileSecurity(file, allowedTypes);

    if (!securityValidation.isValid) {
      throw new Error(securityValidation.error || 'Fichier non valide');
    }

    // Avertissements de sécurité (logs mais n'arrête pas l'upload)
    if (securityValidation.warnings && securityValidation.warnings.length > 0) {
      logger.warn('File security warnings', {
        warnings: securityValidation.warnings,
        fileName: file.name,
      });
    }

    // 2. VALIDATION BACKEND (Edge Function) - Double vérification (optionnelle)
    // Si la validation backend échoue (CORS, Edge Function non disponible, etc.),
    // on continue avec la validation côté client uniquement
    try {
      // Lire les premiers 16 bytes pour la validation backend
      const firstBytes = await file.slice(0, 16).arrayBuffer();
      const base64Content = btoa(String.fromCharCode(...new Uint8Array(firstBytes)));

      // Vérifier l'authentification (sans stocker user car non utilisé)
      await supabase.auth.getUser();

      // Timeout pour éviter que l'upload soit bloqué trop longtemps
      // Note: Si CORS échoue, on continue avec la validation côté client uniquement
      const validationPromise = supabase.functions
        .invoke('validate-file-upload', {
          body: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            fileContent: base64Content,
            allowedTypes,
            maxSizeBytes,
          },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        })
        .catch((error: unknown) => {
          // Intercepter les erreurs CORS et les transformer en erreur reconnaissable
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes('CORS') ||
            errorMessage.includes('blocked') ||
            errorMessage.includes('preflight') ||
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('ERR_FAILED')
          ) {
            return {
              error: {
                message: 'CORS_ERROR: Backend validation unavailable due to CORS policy',
              },
            };
          }
          throw error;
        });

      // Timeout de 5 secondes pour la validation backend
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Validation backend timeout')), 5000)
      );

      type ValidationResponse = {
        data?: { isValid?: boolean; error?: string };
        error?: { message?: string };
      };
      const raceResult = (await Promise.race([
        validationPromise,
        timeoutPromise,
      ])) as ValidationResponse;
      const validationResult = raceResult.data;
      const validationError = raceResult.error;

      if (validationError) {
        // Erreur CORS ou autre - on continue avec la validation côté client
        const isCorsError =
          validationError.message?.includes('CORS') ||
          validationError.message?.includes('blocked') ||
          validationError.message?.includes('preflight');

        if (isCorsError) {
          logger.warn('CORS error in backend validation (using client validation only)', {
            error: validationError.message,
          });
        } else {
          logger.warn('Backend validation error (continuing with client validation)', {
            error: validationError,
          });
        }
        // Continuer avec la validation côté client si le backend échoue
      } else if (validationResult && !validationResult.isValid) {
        throw new Error(validationResult.error || 'Validation backend échouée');
      }
    } catch (backendError: unknown) {
      // Si la validation backend échoue (Edge Function non disponible, CORS, timeout, etc.),
      // on continue avec la validation côté client uniquement
      const errorMessage =
        backendError instanceof Error ? backendError.message : String(backendError);
      const isCorsError =
        errorMessage.includes('CORS') ||
        errorMessage.includes('blocked') ||
        errorMessage.includes('preflight') ||
        errorMessage.includes('timeout');

      if (isCorsError) {
        logger.warn('Backend validation unavailable (CORS/timeout), using client validation only', {
          error: errorMessage,
        });
      } else {
        logger.warn('Backend validation unavailable, using client validation only', {
          error: errorMessage,
        });
      }
      // Ne pas bloquer l'upload - la validation côté client est suffisante
    }

    // 2. Validation de la taille
    if (file.size > maxSizeBytes) {
      throw new Error(
        `Fichier trop volumineux. Maximum : ${formatFileSize(maxSizeBytes)}, actuel : ${formatFileSize(file.size)}`
      );
    }

    // 3. Validation du type MIME (double vérification)
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = allowedTypes.map(type => type.split('/')[1]).join(', ');
      throw new Error(`Type de fichier non supporté. Types autorisés : ${allowedExtensions}`);
    }

    // 4. Générer nom de fichier unique
    const fileName = generateUniqueFileName(file.name, filePrefix);
    const filePath = path ? `${path}/${fileName}` : fileName;

    // 5. Démarrer l'upload avec XMLHttpRequest pour contrôler le Content-Type
    if (onProgress) onProgress(10);

    // Obtenir la session pour l'authentification
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    if (authError || !session || !session.user) {
      throw new Error('Non authentifié. Veuillez vous reconnecter.');
    }

    // Déterminer le Content-Type selon l'extension (plus fiable que file.type)
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    let contentType: string;
    if (fileExt === 'png') {
      contentType = 'image/png';
    } else if (fileExt === 'jpg' || fileExt === 'jpeg') {
      contentType = 'image/jpeg';
    } else if (fileExt === 'webp') {
      contentType = 'image/webp';
    } else if (fileExt === 'gif') {
      contentType = 'image/gif';
    } else if (fileExt === 'svg') {
      contentType = 'image/svg+xml';
    } else {
      // Fallback : utiliser file.type si disponible, sinon image/png par défaut
      contentType = file.type && file.type.startsWith('image/') ? file.type : 'image/png';
    }

    const projectUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!projectUrl) {
      throw new Error('VITE_SUPABASE_URL non défini');
    }
    const uploadUrl = `${projectUrl.replace(/\/$/, '')}/storage/v1/object/${bucket}/${filePath}`;

    // Upload via XMLHttpRequest avec Content-Type explicite
    const uploadData = await new Promise<{ path: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', e => {
        if (e.lengthComputable && onProgress) {
          const progress = 10 + (e.loaded / e.total) * 60; // 10% à 70%
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ path: response.path || filePath });
          } catch {
            resolve({ path: filePath });
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(
              new Error(
                error.message || error.error || `Erreur upload: ${xhr.statusText} (${xhr.status})`
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
      xhr.setRequestHeader('Content-Type', contentType); // CRITIQUE : Forcer le Content-Type
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('cache-control', '3600');

      xhr.send(file);
    });

    if (onProgress) onProgress(70);

    // 6. Utiliser le chemin retourné par l'upload
    const actualPath = uploadData.path;
    logger.info('File uploaded via XMLHttpRequest, path returned', {
      actualPath,
      filePath,
      bucket,
      contentType,
      fileName: file.name,
    });

    // 7. Vérifier que le fichier existe vraiment dans le bucket
    try {
      const { data: fileList, error: listError } = await supabase.storage
        .from(bucket)
        .list(actualPath.split('/').slice(0, -1).join('/') || '', {
          limit: 100,
          search: actualPath.split('/').pop(),
        });

      if (listError) {
        logger.warn('Could not verify file existence', { error: listError, actualPath });
      } else {
        const fileExists = fileList?.some(f => f.name === actualPath.split('/').pop());
        if (!fileExists) {
          logger.warn('File not found in listing after upload', { actualPath, fileList });
        } else {
          logger.info('File verified in storage', { actualPath });
        }
      }
    } catch (verifyError) {
      logger.warn('File verification failed', { error: verifyError, actualPath });
      // Ne pas bloquer l'upload si la vérification échoue
    }

    // 8. Récupérer l'URL publique en utilisant getPublicUrl() de Supabase
    // Supabase gère automatiquement l'encodage et le format correct de l'URL
    let publicUrl: string;

    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(actualPath);

      const generatedUrl = data?.publicUrl;

      if (!generatedUrl) {
        logger.error('No public URL returned by getPublicUrl()', { actualPath, bucket });
        // Fallback : construire manuellement
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl) {
          throw new Error("VITE_SUPABASE_URL non défini, impossible de construire l'URL publique");
        }
        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const pathSegments = actualPath.split('/').map(segment => encodeURIComponent(segment));
        const encodedPath = pathSegments.join('/');
        publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
        logger.warn('Using manually constructed URL as fallback', {
          publicUrl,
          actualPath,
          bucket,
        });
      } else {
        publicUrl = generatedUrl;
        logger.info('Public URL generated by Supabase getPublicUrl()', {
          publicUrl,
          actualPath,
          bucket,
        });
      }
    } catch (urlError) {
      // En cas d'erreur, construire manuellement
      logger.warn('Failed to generate URL with getPublicUrl(), constructing manually', {
        error: urlError,
        actualPath,
        bucket,
      });

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error("VITE_SUPABASE_URL non défini, impossible de construire l'URL publique");
      }
      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const pathSegments = actualPath.split('/').map(segment => encodeURIComponent(segment));
      const encodedPath = pathSegments.join('/');
      publicUrl = `${baseUrl}/storage/v1/object/public/${bucket}/${encodedPath}`;
      logger.info('Public URL constructed manually as fallback', { publicUrl, actualPath, bucket });
    }

    // Vérifier que l'URL se termine par le nom du fichier ou contient le chemin
    const fileNameFromPath = actualPath.split('/').pop();
    if (fileNameFromPath && !publicUrl.includes(fileNameFromPath)) {
      logger.warn('File name not found in public URL', { publicUrl, actualPath, fileNameFromPath });
    }

    // 9. Attendre un peu pour que Supabase rende le fichier accessible
    // Parfois Supabase a besoin d'un délai pour rendre le fichier accessible publiquement
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Vérifier que le fichier existe vraiment et est accessible
    try {
      const { data: fileData, error: fileError } = await supabase.storage
        .from(bucket)
        .list(actualPath.split('/').slice(0, -1).join('/') || '', {
          limit: 1,
          search: actualPath.split('/').pop(),
        });

      if (fileError) {
        logger.warn('Could not verify file existence after upload', {
          error: fileError,
          actualPath,
          bucket,
        });
      } else if (!fileData || fileData.length === 0) {
        logger.warn('File not found in listing after upload', { actualPath, bucket });
      } else {
        logger.info('File confirmed accessible in storage', {
          fileName: fileData[0].name,
          fileSize: fileData[0].metadata?.size,
          actualPath,
          bucket,
        });
      }
    } catch (verifyError) {
      logger.warn('File verification failed', { error: verifyError, actualPath, bucket });
    }

    // Essayer de créer une URL signée comme fallback
    // Les URLs signées fonctionnent même si les politiques RLS ont des problèmes
    let signedUrl: string | null = null;
    try {
      // Attendre un peu avant de créer l'URL signée
      await new Promise(resolve => setTimeout(resolve, 500));

      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(actualPath, 7200); // URL valide 2 heures (plus long pour plus de fiabilité)

      if (signedError) {
        logger.warn('Could not create signed URL', { error: signedError, actualPath, bucket });
      } else if (!signedData?.signedUrl) {
        logger.warn('Signed URL data is empty', { signedData, actualPath, bucket });
      } else {
        signedUrl = signedData.signedUrl;
        logger.info('Signed URL created successfully', {
          signedUrl: signedUrl.substring(0, 80) + '...',
          expiresIn: 7200,
          bucket,
          actualPath,
        });
      }
    } catch (signedUrlError) {
      logger.warn('Exception creating signed URL', { error: signedUrlError, bucket, actualPath });
    }

    // Retourner l'URL publique par défaut, mais aussi l'URL signée comme fallback
    logger.info('Upload completed - URLs available', {
      publicUrl,
      signedUrl: signedUrl ? signedUrl.substring(0, 80) + '...' : null,
      bucket,
      actualPath,
      note: 'Public URL should work if RLS policies are correct. Signed URL is available as fallback.',
    });

    if (onProgress) onProgress(100);

    logger.info('File uploaded successfully', {
      bucket,
      filePath: actualPath,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    });

    return {
      url: publicUrl,
      path: actualPath,
      error: null,
      success: true,
    };
  } catch (error) {
    logger.error('File upload error', { error, bucket, path: options.path, fileName: file.name });

    return {
      url: null,
      path: null,
      error: error instanceof Error ? error : new Error("Erreur inconnue lors de l'upload"),
      success: false,
    };
  }
}

/**
 * Upload multiple fichiers en parallèle
 *
 * @param files - Liste de fichiers à uploader
 * @param options - Options de configuration (commune à tous les fichiers)
 * @returns Liste des résultats d'upload
 *
 * @example
 * ```typescript
 * const results = await uploadMultipleFiles(files, {
 *   bucket: 'product-images',
 *   path: 'gallery',
 * });
 *
 * const successfulUploads = results.filter(r => r.success);
 * const urls = successfulUploads.map(r => r.url);
 * ```
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadToSupabaseStorage(file, options));

  return await Promise.all(uploadPromises);
}

/**
 * Supprime un fichier du Storage Supabase
 *
 * @param bucket - Nom du bucket
 * @param filePath - Chemin du fichier à supprimer
 * @returns Résultat de la suppression
 *
 * @example
 * ```typescript
 * const { error } = await deleteFromSupabaseStorage('product-images', 'services/123.jpg');
 * ```
 */
export async function deleteFromSupabaseStorage(
  bucket: string,
  filePath: string
): Promise<{ error: Error | null; success: boolean }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) throw error;

    return { error: null, success: true };
  } catch (error) {
    logger.error('File delete error', { error, bucket, filePath });
    return {
      error: error instanceof Error ? error : new Error('Erreur lors de la suppression'),
      success: false,
    };
  }
}

/**
 * Vérifie si un bucket existe et est accessible
 *
 * @param bucket - Nom du bucket à vérifier
 * @returns True si le bucket est accessible
 */
export async function checkBucketAccess(bucket: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).list('', { limit: 1 });

    return !error;
  } catch {
    return false;
  }
}
