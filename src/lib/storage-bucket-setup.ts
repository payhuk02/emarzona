/**
 * Utility pour créer automatiquement le bucket "products" si nécessaire
 * Cette fonction peut être appelée si la migration SQL n'a pas été exécutée
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Tente de créer le bucket "products" via l'API Supabase Storage
 * Note: Cette méthode nécessite des permissions admin/service_role
 * En production, utilisez plutôt la migration SQL
 */
export async function createProductsBucketIfNeeded(): Promise<{
  success: boolean;
  message: string;
  bucketExists: boolean;
}> {
  try {
    // Vérifier d'abord si le bucket existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      logger.error('Error listing buckets', { error: listError });
      return {
        success: false,
        message: `Erreur lors de la vérification des buckets: ${listError.message}`,
        bucketExists: false,
      };
    }

    const productsBucket = buckets?.find(
      (b) => b.id === 'products' || b.name === 'products'
    );

    if (productsBucket) {
      logger.info('Products bucket already exists', { bucket: productsBucket });
      return {
        success: true,
        message: 'Le bucket "products" existe déjà',
        bucketExists: true,
      };
    }

    // Tenter de créer le bucket (nécessite des permissions élevées)
    // Note: Cette méthode peut ne pas fonctionner avec les clés publiques
    // Dans ce cas, utilisez la migration SQL
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('products', {
      public: true,
      fileSizeLimit: 524288000, // 500 MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'audio/mpeg',
        'audio/mp3',
        'video/mp4',
        'video/webm',
        'application/epub+zip',
        'text/plain',
      ],
    });

    if (createError) {
      logger.error('Error creating bucket', { error: createError });
      return {
        success: false,
        message: `Impossible de créer le bucket automatiquement: ${createError.message}. Veuillez exécuter la migration SQL.`,
        bucketExists: false,
      };
    }

    logger.info('Products bucket created successfully', { bucket: newBucket });
    return {
      success: true,
      message: 'Le bucket "products" a été créé avec succès',
      bucketExists: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Exception in createProductsBucketIfNeeded', { error, errorMessage });
    return {
      success: false,
      message: `Erreur: ${errorMessage}. Veuillez exécuter la migration SQL pour créer le bucket.`,
      bucketExists: false,
    };
  }
}

