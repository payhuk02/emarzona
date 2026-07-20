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
  storeId?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  compress?: boolean;
}

interface UploadImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const STORE_ASSETS_BUCKET = 'store-assets';

const STORE_IMAGE_TYPES = new Set<ImageType>([
  'store-logo',
  'store-banner',
  'store-favicon',
  'store-apple-touch-icon',
  'store-watermark',
  'store-placeholder',
]);

const DEFAULT_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const DEFAULT_MAX_SIZE_MB = 5;

export function resolveImageBucket(type: ImageType, storeId?: string): string {
  if (STORE_IMAGE_TYPES.has(type) && storeId) {
    return STORE_ASSETS_BUCKET;
  }
  return PRODUCT_IMAGES_BUCKET;
}

export const validateImageFile = (
  file: File,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_FORMATS
): { valid: boolean; error?: string } => {
  if (!acceptedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Format non supporté. Formats acceptés : ${acceptedFormats
        .map(f => f.split('/')[1].toUpperCase())
        .join(', ')}`,
    };
  }

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

const generateFileName = (
  userId: string,
  type: ImageType,
  originalName: string,
  storeId?: string
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';

  if (STORE_IMAGE_TYPES.has(type) && storeId) {
    return `stores/${storeId}/${type}/${timestamp}_${random}.${extension}`;
  }

  return `${userId}/${type}/${timestamp}_${random}.${extension}`;
};

const compressImage = async (file: File): Promise<File> => {
  if (file.size < 500 * 1024) {
    return file;
  }

  try {
    const imageCompression = (await import('browser-image-compression')).default;

    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: file.type,
    });
    return compressedFile;
  } catch (error) {
    import('@/lib/logger').then(({ logger: log }) => {
      log.warn("Erreur lors de la compression de l'image", { error });
    });
    return file;
  }
};

function parseStorageObjectFromUrl(imageUrl: string): { bucket: string; filePath: string } | null {
  try {
    const url = new URL(imageUrl);
    for (const bucket of [STORE_ASSETS_BUCKET, PRODUCT_IMAGES_BUCKET]) {
      const marker = `/${bucket}/`;
      const idx = url.pathname.indexOf(marker);
      if (idx >= 0) {
        return { bucket, filePath: url.pathname.slice(idx + marker.length) };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export const uploadImage = async ({
  file,
  type,
  userId,
  storeId,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_FORMATS,
  compress = false,
}: UploadImageOptions): Promise<UploadImageResult> => {
  let fileName = '';

  try {
    const validation = validateImageFile(file, maxSizeMB, acceptedFormats);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    let fileToUpload = file;
    if (compress) {
      fileToUpload = await compressImage(file);
    }

    const bucket = resolveImageBucket(type, storeId);
    fileName = generateFileName(userId, type, file.name, storeId);

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Image upload error', {
        error: uploadError,
        fileName,
        type,
        userId,
        storeId,
        bucket,
      });
      return {
        success: false,
        error: `Erreur lors de l'upload : ${uploadError.message}`,
      };
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (caught: unknown) {
    const errorMessage =
      caught instanceof Error ? caught.message : 'Une erreur inattendue est survenue';
    logger.error('Unexpected image upload error', {
      error: caught,
      fileName,
      type,
      userId,
      storeId,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const parsed = parseStorageObjectFromUrl(imageUrl);
    if (!parsed) {
      logger.error('Invalid image URL format', { imageUrl });
      return false;
    }

    const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.filePath]);

    if (error) {
      logger.error('Image delete error', {
        error,
        filePath: parsed.filePath,
        bucket: parsed.bucket,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Unexpected image delete error', { error, imageUrl });
    return false;
  }
};

export const replaceImage = async (
  oldImageUrl: string | null,
  newFile: File,
  type: ImageType,
  userId: string,
  storeId?: string
): Promise<UploadImageResult> => {
  try {
    const uploadResult = await uploadImage({
      file: newFile,
      type,
      userId,
      storeId,
    });

    if (!uploadResult.success) {
      return uploadResult;
    }

    if (oldImageUrl) {
      await deleteImage(oldImageUrl);
    }

    return uploadResult;
  } catch (caught: unknown) {
    const errorMessage =
      caught instanceof Error ? caught.message : "Erreur lors du remplacement de l'image";
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const checkStorageBucket = async (
  bucketName = PRODUCT_IMAGES_BUCKET
): Promise<{ exists: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
      return {
        exists: false,
        error: `Erreur lors de la vérification du bucket : ${error.message}`,
      };
    }

    const bucketExists = data?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      return {
        exists: false,
        error: `Le bucket "${bucketName}" n'existe pas. Veuillez le créer dans Supabase Dashboard.`,
      };
    }

    return { exists: true };
  } catch (caught: unknown) {
    const errorMessage =
      caught instanceof Error ? caught.message : 'Erreur de connexion au Storage';
    return {
      exists: false,
      error: errorMessage,
    };
  }
};
