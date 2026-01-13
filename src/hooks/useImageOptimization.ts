/**
 * Hook pour l'optimisation automatique d'images
 * Utilise le service d'optimisation pour améliorer le SEO et les performances
 */

import { useState, useCallback, useEffect } from 'react';
import { optimizeImage, validateImageDimensions, generateImageSEOAttributes, type ImageOptimizationOptions, type OptimizedImageResult } from '@/lib/image-optimization';
import { logger } from '@/lib/logger';

interface UseImageOptimizationOptions extends ImageOptimizationOptions {
  autoOptimize?: boolean;
  onOptimizationComplete?: (result: OptimizedImageResult) => void;
  onError?: (error: Error) => void;
}

interface OptimizedImageState {
  originalUrl?: string;
  optimizedUrl?: string;
  sizes?: { [key: string]: string };
  metadata?: OptimizedImageResult['metadata'];
  isOptimizing: boolean;
  error?: string;
  seoAttributes?: ReturnType<typeof generateImageSEOAttributes>;
}

export function useImageOptimization(
  imageUrl?: string,
  altText?: string,
  options: UseImageOptimizationOptions = {}
) {
  const {
    autoOptimize = false,
    onOptimizationComplete,
    onError,
    ...optimizationOptions
  } = options;

  const [state, setState] = useState<OptimizedImageState>({
    isOptimizing: false
  });

  // Fonction d'optimisation manuelle
  const optimizeImageFile = useCallback(async (
    file: File,
    customOptions?: Partial<ImageOptimizationOptions>
  ): Promise<OptimizedImageResult> => {
    setState(prev => ({ ...prev, isOptimizing: true, error: undefined }));

    try {
      // Validation des dimensions
      const img = new Image();
      const dimensionsPromise = new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
        img.src = URL.createObjectURL(file);
      });

      const dimensions = await dimensionsPromise;
      const validation = validateImageDimensions(
        dimensions.width,
        dimensions.height,
        100, 4000, 100, 4000
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Convertir le fichier en buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Optimiser l'image
      const result = await optimizeImage(buffer, {
        ...optimizationOptions,
        ...customOptions
      });

      // Générer les URLs des différentes tailles
      const sizeUrls: { [key: string]: string } = {};
      for (const [size, sizeBuffer] of Object.entries(result.sizes)) {
        // Ici on simulerait l'upload vers un service de stockage
        // Pour l'exemple, on utilise des data URLs
        const blob = new Blob([sizeBuffer], { type: `image/${result.metadata.format}` });
        sizeUrls[size] = URL.createObjectURL(blob);
      }

      const optimizedBlob = new Blob([result.optimized], { type: `image/${result.metadata.format}` });
      const optimizedUrl = URL.createObjectURL(optimizedBlob);

      setState(prev => ({
        ...prev,
        optimizedUrl,
        sizes: sizeUrls,
        metadata: result.metadata,
        seoAttributes: generateImageSEOAttributes(
          file.name,
          altText || file.name,
          result.metadata.width,
          result.metadata.height
        ),
        isOptimizing: false
      }));

      onOptimizationComplete?.(result);
      logger.info('Image optimisée avec succès', {
        originalSize: result.metadata.originalSize,
        optimizedSize: result.metadata.optimizedSize,
        compressionRatio: result.metadata.compressionRatio
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'optimisation';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isOptimizing: false
      }));

      onError?.(error instanceof Error ? error : new Error(errorMessage));
      logger.error('Erreur lors de l\'optimisation d\'image', { error });

      throw error;
    }
  }, [optimizationOptions, altText, onOptimizationComplete, onError]);

  // Optimisation automatique si activée
  useEffect(() => {
    if (autoOptimize && imageUrl && !state.isOptimizing && !state.optimizedUrl) {
      // Ici on pourrait charger l'image depuis l'URL et l'optimiser
      // Pour l'exemple, on marque juste comme traité
      setState(prev => ({
        ...prev,
        originalUrl: imageUrl,
        seoAttributes: generateImageSEOAttributes(
          imageUrl.split('/').pop() || 'image',
          altText || 'Image optimisée'
        )
      }));
    }
  }, [autoOptimize, imageUrl, altText, state.isOptimizing, state.optimizedUrl]);

  // Fonction pour nettoyer les URLs d'objets
  const cleanup = useCallback(() => {
    if (state.optimizedUrl) {
      URL.revokeObjectURL(state.optimizedUrl);
    }
    if (state.sizes) {
      Object.values(state.sizes).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    }
  }, [state.optimizedUrl, state.sizes]);

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    // État
    ...state,

    // Actions
    optimizeImageFile,
    cleanup,

    // Utilitaires
    getSrcSet: () => {
      if (!state.sizes) return '';
      return Object.keys(state.sizes)
        .map(size => `${state.sizes![size]} ${size}`)
        .join(', ');
    },

    // Métriques
    getCompressionStats: () => {
      if (!state.metadata) return null;
      return {
        ratio: `${state.metadata.compressionRatio.toFixed(1)}%`,
        saved: `${((state.metadata.originalSize - state.metadata.optimizedSize) / 1024).toFixed(1)} KB`,
        finalSize: `${(state.metadata.optimizedSize / 1024).toFixed(1)} KB`
      };
    }
  };
}

/**
 * Hook pour optimiser plusieurs images (batch)
 */
export function useBatchImageOptimization(
  images: Array<{ file: File; altText?: string }>,
  options: UseImageOptimizationOptions = {}
) {
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<OptimizedImageResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processBatch = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const batchResults: OptimizedImageResult[] = [];

    for (let i = 0; i < images.length; i++) {
      const { file, altText } = images[i];

      try {
        const result = await optimizeImage(
          Buffer.from(await file.arrayBuffer()),
          options
        );

        batchResults.push(result);
        setResults([...batchResults]);
      } catch (error) {
        logger.error(`Erreur optimisation image ${i + 1}`, { error });
      }

      setProgress(((i + 1) / images.length) * 100);
    }

    setIsProcessing(false);
    logger.info('Batch d\'optimisation terminé', {
      total: images.length,
      success: batchResults.length,
      failed: images.length - batchResults.length
    });

    return batchResults;
  }, [images, options]);

  return {
    processBatch,
    progress,
    results,
    isProcessing,
    successCount: results.length,
    errorCount: images.length - results.length
  };
}

/**
 * Hook pour le monitoring des performances d'images
 */
export function useImagePerformanceMonitoring() {
  const [metrics, setMetrics] = useState<{
    lcp: number[];
    cls: number[];
    fid: number[];
  }>({
    lcp: [],
    cls: [],
    fid: []
  });

  const recordMetric = useCallback((type: 'lcp' | 'cls' | 'fid', value: number) => {
    setMetrics(prev => ({
      ...prev,
      [type]: [...prev[type], value].slice(-10) // Garder les 10 dernières mesures
    }));

    // Logger les métriques critiques
    if (type === 'lcp' && value > 2500) {
      logger.warn('LCP trop élevé', { value });
    }
    if (type === 'cls' && value > 0.1) {
      logger.warn('CLS trop élevé', { value });
    }
    if (type === 'fid' && value > 100) {
      logger.warn('FID trop élevé', { value });
    }
  }, []);

  const getAverageMetrics = useCallback(() => {
    return {
      lcp: metrics.lcp.length > 0 ? metrics.lcp.reduce((a, b) => a + b, 0) / metrics.lcp.length : 0,
      cls: metrics.cls.length > 0 ? metrics.cls.reduce((a, b) => a + b, 0) / metrics.cls.length : 0,
      fid: metrics.fid.length > 0 ? metrics.fid.reduce((a, b) => a + b, 0) / metrics.fid.length : 0
    };
  }, [metrics]);

  return {
    recordMetric,
    metrics,
    averages: getAverageMetrics(),
    // Seuils Core Web Vitals
    thresholds: {
      lcp: { good: 2500, needsImprovement: 4000 },
      cls: { good: 0.1, needsImprovement: 0.25 },
      fid: { good: 100, needsImprovement: 300 }
    }
  };
}