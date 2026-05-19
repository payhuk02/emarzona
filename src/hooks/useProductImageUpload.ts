/**
 * Hook d'upload catalogue unifié pour les formulaires.
 */

import { useCallback, useState } from 'react';
import {
  uploadCatalogImage,
  uploadCatalogImages,
  type CatalogImagePath,
  type UploadCatalogImageOptions,
} from '@/lib/images/product-image-upload';

export function useProductImageUpload(catalogPath: CatalogImagePath) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadOne = useCallback(
    async (file: File, options?: Omit<UploadCatalogImageOptions, 'onProgress'>) => {
      setUploading(true);
      setProgress(0);
      try {
        const result = await uploadCatalogImage(file, catalogPath, {
          ...options,
          onProgress: setProgress,
        });
        if (!result.success || !result.url) {
          throw result.error ?? new Error('Upload échoué');
        }
        return result.url;
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 600);
      }
    },
    [catalogPath]
  );

  const uploadMany = useCallback(
    async (files: File[], options?: Omit<UploadCatalogImageOptions, 'onProgress'>) => {
      setUploading(true);
      setProgress(0);
      try {
        const { urls, errors } = await uploadCatalogImages(files, catalogPath, {
          ...options,
          onProgress: setProgress,
        });
        if (errors.length > 0 && urls.length === 0) {
          throw errors[0];
        }
        return urls;
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 600);
      }
    },
    [catalogPath]
  );

  return { uploadOne, uploadMany, uploading, progress };
}
