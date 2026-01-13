/**
 * Service d'upload d'images avec optimisation automatique
 * Intègre l'optimisation SEO et performances dans le processus d'upload
 */

import { supabase } from '@/integrations/supabase/client';
import { optimizeImage, validateImageDimensions, type ImageOptimizationOptions } from '@/lib/image-optimization';
import { logger } from '@/lib/logger';

export interface UploadResult {
  success: boolean;
  url?: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  sizes?: { [key: string]: string };
  metadata?: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
    width: number;
    height: number;
    seoScore: number;
  };
  error?: string;
}

export interface ImageUploadOptions extends ImageOptimizationOptions {
  generateThumbnail?: boolean;
  thumbnailSize?: number;
  folder?: string;
  public?: boolean;
  seo?: {
    altText?: string;
    title?: string;
    description?: string;
  };
}

/**
 * Upload et optimisation d'une image unique
 */
export async function uploadOptimizedImage(
  file: File,
  bucketName: string = 'images',
  options: ImageUploadOptions = {}
): Promise<UploadResult> {
  try {
    const {
      quality = 85,
      format = 'webp',
      generateThumbnail = true,
      thumbnailSize = 300,
      folder = 'uploads',
      public = true,
      seo,
      ...optimizationOptions
    } = options;

    // Validation du fichier
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      throw new Error('L\'image ne doit pas dépasser 10MB');
    }

    // Convertir en buffer pour Sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validation des dimensions
    const metadata = await import('sharp').then(sharp => sharp.default(buffer).metadata());
    const validation = validateImageDimensions(
      metadata.width || 0,
      metadata.height || 0
    );

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Optimiser l'image
    const optimizationResult = await optimizeImage(buffer, {
      quality,
      format,
      ...optimizationOptions
    });

    // Générer le nom du fichier optimisé
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${format}`;
    const filePath = `${folder}/${fileName}`;

    // Upload l'image optimisée
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, optimizationResult.optimized, {
        contentType: `image/${format}`,
        cacheControl: '31536000', // 1 an
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Générer l'URL publique
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    let thumbnailUrl: string | undefined;
    let sizesUrls: { [key: string]: string } | undefined;

    // Générer la miniature si demandé
    if (generateThumbnail && thumbnailSize > 0) {
      const thumbnailBuffer = await import('sharp').then(sharp =>
        sharp.default(buffer)
          .resize(thumbnailSize, thumbnailSize, {
            fit: 'cover',
            position: 'center'
          })
          [format]({ quality: Math.min(quality + 10, 95) })
          .toBuffer()
      );

      const thumbnailPath = `${folder}/thumbnails/${fileName}`;
      await supabase.storage
        .from(bucketName)
        .upload(thumbnailPath, thumbnailBuffer, {
          contentType: `image/${format}`,
          cacheControl: '31536000',
          upsert: false
        });

      const { data: thumbUrl } = supabase.storage
        .from(bucketName)
        .getPublicUrl(thumbnailPath);

      thumbnailUrl = thumbUrl.publicUrl;
    }

    // Générer les tailles responsive si demandé
    if (optimizationOptions.sizes && optimizationOptions.sizes.length > 0) {
      sizesUrls = {};
      for (const [sizeKey, sizeBuffer] of Object.entries(optimizationResult.sizes)) {
        const sizePath = `${folder}/sizes/${sizeKey}/${fileName}`;
        await supabase.storage
          .from(bucketName)
          .upload(sizePath, sizeBuffer, {
            contentType: `image/${format}`,
            cacheControl: '31536000',
            upsert: false
          });

        const { data: sizeUrl } = supabase.storage
          .from(bucketName)
          .getPublicUrl(sizePath);

        sizesUrls[sizeKey] = sizeUrl.publicUrl;
      }
    }

    // Calculer le score SEO
    const seoScore = calculateImageSEOScore(
      file.name,
      seo?.altText,
      optimizationResult.metadata.width,
      optimizationResult.metadata.height
    );

    // Logger les métriques
    logger.info('Image uploadée et optimisée', {
      originalSize: optimizationResult.metadata.originalSize,
      optimizedSize: optimizationResult.metadata.optimizedSize,
      compressionRatio: optimizationResult.metadata.compressionRatio,
      seoScore: seoScore.score,
      format: optimizationResult.metadata.format
    });

    return {
      success: true,
      url: urlData.publicUrl,
      optimizedUrl: urlData.publicUrl,
      thumbnailUrl,
      sizes: sizesUrls,
      metadata: {
        ...optimizationResult.metadata,
        seoScore: seoScore.score
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'upload';

    logger.error('Erreur upload image optimisée', { error });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Upload multiple images avec optimisation
 */
export async function uploadMultipleOptimizedImages(
  files: File[],
  bucketName: string = 'images',
  options: ImageUploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  // Traiter les images en parallèle avec limitation
  const batchSize = 3; // Max 3 uploads simultanés
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const batchPromises = batch.map(file =>
      uploadOptimizedImage(file, bucketName, options)
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Petite pause entre les batches pour éviter la surcharge
    if (i + batchSize < files.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  logger.info('Batch upload terminé', {
    total: files.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  });

  return results;
}

/**
 * Supprimer une image optimisée et ses variantes
 */
export async function deleteOptimizedImage(
  url: string,
  bucketName: string = 'images'
): Promise<boolean> {
  try {
    // Extraire le chemin du fichier depuis l'URL
    const urlParts = url.split('/storage/v1/object/public/');
    if (urlParts.length < 2) {
      throw new Error('URL invalide');
    }

    const filePath = urlParts[1].split('/').slice(1).join('/'); // Supprimer le nom du bucket

    // Supprimer le fichier principal
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    // Supprimer les variantes (thumbnail, tailles)
    const variants = [
      `thumbnails/${filePath.split('/').pop()}`,
      ...['400w', '800w', '1200w', '1600w'].map(size =>
        `sizes/${size}/${filePath.split('/').pop()}`
      )
    ].filter(Boolean);

    // Supprimer les variantes existantes (ignorer les erreurs)
    await supabase.storage
      .from(bucketName)
      .remove(variants.filter(v => v));

    logger.info('Image supprimée avec variantes', { filePath });

    return true;
  } catch (error) {
    logger.error('Erreur suppression image', { error, url });
    return false;
  }
}

/**
 * Calculer le score SEO d'une image (version simplifiée)
 */
function calculateImageSEOScore(
  filename: string,
  alt?: string,
  width?: number,
  height?: number
): { score: number } {
  let score = 100;

  // Pénalités pour nom de fichier générique
  if (filename.includes('image') || filename.includes('img') || filename.includes('temp')) {
    score -= 20;
  }

  // Pénalités pour alt manquant ou trop court
  if (!alt || alt.length < 10) {
    score -= 30;
  }

  // Pénalités pour dimensions insuffisantes
  if (width && width < 400) {
    score -= 10;
  }

  return { score: Math.max(0, score) };
}

/**
 * Hook React pour l'upload d'images optimisées
 */
export function useOptimizedImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (
    file: File,
    bucketName?: string,
    options?: ImageUploadOptions
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // Simulation de progression
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadOptimizedImage(file, bucketName, options);

      clearInterval(progressInterval);
      setProgress(100);

      return result;
    } finally {
      setIsUploading(false);
      setTimeout(() => setProgress(0), 2000); // Reset après 2s
    }
  };

  return {
    uploadImage,
    isUploading,
    progress
  };
}

// Import manquant
import { useState } from 'react';