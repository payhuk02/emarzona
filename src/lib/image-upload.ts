/**
 * Utilitaire pour gérer l'upload d'images vers Supabase Storage
 * Supporte : compression, validation, gestion des erreurs
 */

import { supabase } from '@/integrations/supabase/client';

export type ImageType = 'store-logo' | 'store-banner' | 'product-image' | 'product-gallery' | 'avatar';

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

const BUCKET_NAME = 'store-images';

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
        .map((f) => f.split('/')[1].toUpperCase())
        .join(', ')}`
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
      ).toFixed(2)}MB)`
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
 * Compresse une image (optionnel, pour optimisation future)
 */
const compressImage = async (file: File): Promise<File> => {
  // TODO: Implémenter la compression avec canvas ou une librairie
  // Pour l'instant, on retourne le fichier tel quel
  return file;
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
  compress = false
}: UploadImageOptions): Promise<UploadImageResult> => {
  try {
    // 1. Validation
    const validation = validateImageFile(file, maxSizeMB, acceptedFormats);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    // 2. Compression (optionnel)
    let fileToUpload = file;
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
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: `Erreur lors de l'upload : ${uploadError.message}`
      };
    }

    // 5. Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl
    };
  } catch (error: any) {
    console.error('Unexpected upload error:', error);
    return {
      success: false,
      error: error.message || 'Une erreur inattendue est survenue'
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
      console.error('Invalid image URL format');
      return false;
    }

    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected delete error:', error);
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
      userId
    });

    if (!uploadResult.success) {
      return uploadResult;
    }

    // 2. Supprimer l'ancienne image (si elle existe)
    if (oldImageUrl) {
      await deleteImage(oldImageUrl);
    }

    return uploadResult;
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erreur lors du remplacement de l\'image'
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
        error: `Erreur lors de la vérification du bucket : ${error.message}`
      };
    }

    const bucketExists = data?.some((bucket) => bucket.name === BUCKET_NAME);

    if (!bucketExists) {
      return {
        exists: false,
        error: `Le bucket "${BUCKET_NAME}" n'existe pas. Veuillez le créer dans Supabase Dashboard.`
      };
    }

    return { exists: true };
  } catch (error: any) {
    return {
      exists: false,
      error: error.message || 'Erreur de connexion au Storage'
    };
  }
};

