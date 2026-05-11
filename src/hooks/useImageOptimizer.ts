/**
 * Hook utilitaire pour gérer un upload d'image optimisé :
 * - compression côté client (WebP)
 * - upload Supabase dans le bucket choisi
 * - retourne l'URL publique
 */

import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { compressImage, blobToFile, type CompressOptions } from '@/lib/images/compress';
import { logger } from '@/lib/logger';

interface UseImageOptimizerOptions {
  bucket?: string;
  folder?: string; // sous-dossier (généralement userId)
  compress?: CompressOptions;
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
  const { bucket = 'service-images', folder, compress } = opts;
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

        // 1. Compression
        const { blob, width, height } = await compressImage(file, compress);
        setProgress(50);

        // 2. Préparation du chemin (auth.uid()/folder/uuid.webp)
        const optimizedFile = blobToFile(blob, file.name);
        const subFolder = folder ? `${folder.replace(/^\/|\/$/g, '')}/` : '';
        const path = `${user.id}/${subFolder}${crypto.randomUUID()}-${optimizedFile.name}`;

        // 3. Upload
        const { error: upErr } = await supabase.storage
          .from(bucket)
          .upload(path, optimizedFile, {
            contentType: optimizedFile.type,
            cacheControl: '31536000',
            upsert: false,
          });
        if (upErr) throw upErr;
        setProgress(85);

        // 4. URL publique
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
    [bucket, folder, compress],
  );

  return { uploadOptimized, isUploading, progress };
}
