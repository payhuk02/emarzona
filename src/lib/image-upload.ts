/**
 * Utilitaire pour gérer l'upload d'images vers Supabase Storage
 * Supporte : compression, validation, gestion des erreurs
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export type ImageType =
  | 'store-logo'
  | 'store-banner'
  | 'product-image'
  | 'product-gallery'
  | 'avatar'
  | 'store-favicon'
  | 'store-apple-touch-icon'
  | 'store-watermark'
  | 'store-placeholder';

interface UploadImageOptions {
  file: File;
  type: ImageType;
  userId: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  compress?: boolean;
}

interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

// IMPORTANT :
// - Le bucket `product-images` est déjà utilisé et configuré pour les images produits
//   (voir `src/components/ui/image-upload.ts` et `src/components/products/ImageUpload.tsx`).
// - Pour fiabiliser l'upload des logos/bannières de boutique sans configuration
//   supplémentaire côté Supabase, on réutilise ce même bucket au lieu de `store-images`.
// - Si vous préférez un bucket séparé, créez un bucket public `store-images` dans
//   Supabase Storage et remplacez cette constante par 'store-images'.
const BUCKET_NAME = 'product-images';

// Formats acceptés par défaut
const DEFAULT_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// Taille maximale par défaut : 5MB
const DEFAULT_MAX_SIZE_MB = 5;

/**
 * Valide un fichier image
 */
export const validateImageFile = (
  file: File,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_FORMATS
): { valid: boolean; error?: string } => {
  // Vérifier le format
  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés : ${acceptedFormats
        .map(f => f.split('/')[1].toUpperCase())
        .join(', ')}`,
    };
  }

  // Vérifier la taille
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale : ${maxSizeMB}MB (taille actuelle : ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB)`,
    };
  }

  return { valid: true };
};

/**
 * Génère un nom de fichier unique
 */
const generateFileName = (userId: string, type: ImageType, originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';

  return `${userId}/${type}/${timestamp}_${random}.${extension}`;
};

/**
 * Compresse une image avec browser-image-compression
 * Réduit la taille du fichier pour améliorer les performances
 */
const compressImage = async (file: File): Promise<File> => {
  // Ne pas compresser si le fichier est déjà petit (< 500KB)
  if (file.size < 500 * 1024) {
    return file;
  }

  try {
    // Importer dynamiquement pour réduire le bundle initial
    const imageCompression = (await import('browser-image-compression')).default;
    
    const options = {
      maxSizeMB: 1, // Taille maximale 1MB
      maxWidthOrHeight: 1920, // Largeur/hauteur maximale
      useWebWorker: true, // Utiliser Web Worker pour ne pas bloquer le thread principal
      fileType: file.type, // Conserver le type de fichier original
    };

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    // En cas d'erreur, retourner le fichier original
    // Importer logger dynamiquement pour ne pas bloquer le bundle initial
    import('@/lib/logger').then(({ logger }) => {
      logger.warn('Erreur lors de la compression de l\'image', { error });
    });
    return file;
  }
};

/**
 * Upload une image vers Supabase Storage
 */
export const uploadImage = async ({
  file,
  type,
  userId,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_FORMATS,
  compress = false,
}: UploadImageOptions): Promise<UploadImageResult> => {
  try {
    // 1. Validation
    const validation = validateImageFile(file, maxSizeMB, acceptedFormats);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // 2. Compression (optionnel)
    let  fileToUpload= file;
    if (compress) {
      fileToUpload = await compressImage(file);
    }

    // 3. Générer un nom unique
    const fileName = generateFileName(userId, type, file.name);

    // 4. Upload vers Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Image upload error', { error: uploadError, fileName, type, userId });
      return {
        success: false,
        error: `Erreur lors de l'upload : ${uploadError.message}`,
      };
    }

    // 5. Récupérer l'URL publique
    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch ( _error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
    logger.error('Unexpected image upload error', { error, fileName, type, userId });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Supprime une image de Supabase Storage
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/${BUCKET_NAME}/`);

    if (pathParts.length < 2) {
      logger.error('Invalid image URL format', { imageUrl });
      return false;
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      logger.error('Image delete error', { error, filePath });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Unexpected image delete error', { error, imageUrl });
    return false;
  }
};

/**
 * Remplace une ancienne image par une nouvelle
 */
export const replaceImage = async (
  oldImageUrl: string | null,
  newFile: File,
  type: ImageType,
  userId: string
): Promise<UploadImageResult> => {
  try {
    // 1. Upload la nouvelle image
    const uploadResult = await uploadImage({
      file: newFile,
      type,
      userId,
    });

    if (!uploadResult.success) {
      return uploadResult;
    }

    // 2. Supprimer l'ancienne image (si elle existe)
    if (oldImageUrl) {
      await deleteImage(oldImageUrl);
    }

    return uploadResult;
  } catch ( _error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Erreur lors du remplacement de l'image";
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Vérifie si le bucket existe, sinon guide l'utilisateur
 */
export const checkStorageBucket = async (): Promise<{ exists: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return {
        exists: false,
        error: `Erreur lors de la vérification du bucket : ${error.message}`,
      };
    }

    const bucketExists = data?.some(bucket => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      return {
        exists: false,
        error: `Le bucket "${BUCKET_NAME}" n'existe pas. Veuillez le créer dans Supabase Dashboard.`,
      };
    }

    return { exists: true };
  } catch ( _error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion au Storage';
    return {
      exists: false,
      error: errorMessage,
    };
  }
};






