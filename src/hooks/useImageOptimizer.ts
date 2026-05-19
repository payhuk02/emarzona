/**
 * Hook utilitaire pour upload d'image optimisé (catalogue ou legacy).
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, blobToFile, type CompressOptions } from '@/lib/images/compress';
import {
  uploadCatalogImage,
  studioFolderToCatalogPath,
  CATALOG_IMAGE_BUCKET,
  type CatalogImagePath,
} from '@/lib/images/product-image-upload';
import { logger } from '@/lib/logger';

interface UseImageOptimizerOptions {
  /** Chemin catalogue dans product-images (recommandé). */
  catalogPath?: CatalogImagePath;
  /** @deprecated Préférer catalogPath. Dossier Studio → mappé en catalogPath. */
  folder?: string;
  /** @deprecated Toujours product-images si catalogPath/folder est défini. */
  bucket?: string;
  compress?: CompressOptions;
  /** Si true, ne pas forcer 1536×1024 (défaut: false quand catalogPath est utilisé). */
  skipCatalogNormalize?: boolean;
}

interface OptimizedUploadResult {
  publicUrl: string;
  path: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

export function useImageOptimizer(opts: UseImageOptimizerOptions = {}) {
  const {
    catalogPath: catalogPathProp,
    folder,
    bucket = CATALOG_IMAGE_BUCKET,
    compress,
    skipCatalogNormalize = false,
  } = opts;

  const catalogPath = catalogPathProp ?? (folder ? studioFolderToCatalogPath(folder) : undefined);

  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadOptimized = useCallback(
    async (file: File): Promise<OptimizedUploadResult> => {
      setIsUploading(true);
      setProgress(10);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Vous devez être connecté pour téléverser une image.');

        const { blob, width, height } = await compressImage(file, compress);
        setProgress(40);
        const optimizedFile = blobToFile(blob, file.name);

        if (catalogPath) {
          const result = await uploadCatalogImage(optimizedFile, catalogPath, {
            normalizeToCatalogFormat: !skipCatalogNormalize,
            onProgress: p => setProgress(40 + (p / 100) * 55),
          });
          if (!result.success || !result.url) {
            throw result.error ?? new Error('Upload échoué');
          }
          setProgress(100);
          return {
            publicUrl: result.url,
            path: result.path ?? '',
            originalSize: file.size,
            optimizedSize: blob.size,
            width,
            height,
          };
        }

        const subFolder = folder ? `${folder.replace(/^\/|\/$/g, '')}/` : '';
        const path = `${user.id}/${subFolder}${crypto.randomUUID()}-${optimizedFile.name}`;

        const { error: upErr } = await supabase.storage.from(bucket).upload(path, optimizedFile, {
          contentType: optimizedFile.type,
          cacheControl: '31536000',
          upsert: false,
        });
        if (upErr) throw upErr;
        setProgress(85);

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setProgress(100);

        return {
          publicUrl: data.publicUrl,
          path,
          originalSize: file.size,
          optimizedSize: blob.size,
          width,
          height,
        };
      } catch (error) {
        logger.error('useImageOptimizer.uploadOptimized error', { error });
        throw error;
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 800);
      }
    },
    [bucket, catalogPath, compress, folder, skipCatalogNormalize]
  );

  return { uploadOptimized, isUploading, progress };
}
