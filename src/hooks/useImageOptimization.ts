/**
 * Hook pour l'optimisation automatique des images
 * Fournit des utilitaires pour charger et optimiser les images dynamiquement
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  lazy?: boolean;
  placeholder?: string;
}

interface OptimizedImageResult {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  loading: boolean;
  error: string | null;
  fallbackSrc: string;
}

/**
 * Hook pour optimiser une image individuelle
 */
export function useImageOptimization(
  src: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const {
    quality = 85,
    format = 'webp',
    width,
    height,
    fit = 'cover',
    lazy = true,
    placeholder
  } = options;

  // Générer l'URL optimisée
  const optimizedSrc = useMemo(() => {
    if (!src) return '';

    try {
      const url = new URL(src, window.location.origin);
      const params = new URLSearchParams();

      if (quality && quality !== 85) params.set('q', quality.toString());
      if (format && format !== 'webp') params.set('f', format);
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      if (fit && fit !== 'cover') params.set('fit', fit);

      url.search = params.toString();
      return url.toString();
    } catch {
      // Si ce n'est pas une URL valide, retourner telle quelle
      return src;
    }
  }, [src, quality, format, width, height, fit]);

  // Générer le srcSet pour les images responsives
  const srcSet = useMemo(() => {
    if (!src || !width) return '';

    const sizes = [320, 640, 768, 1024, 1280];
    const srcSetEntries = sizes
      .filter(size => size <= (width * 2)) // Ne pas dépasser 2x la taille originale
      .map(size => {
        try {
          const url = new URL(src, window.location.origin);
          const params = new URLSearchParams();
          params.set('w', size.toString());
          params.set('q', quality.toString());
          params.set('f', format);
          url.search = params.toString();
          return `${url.toString()} ${size}w`;
        } catch {
          return '';
        }
      })
      .filter(Boolean);

    return srcSetEntries.join(', ');
  }, [src, width, quality, format]);

  // Générer l'attribut sizes
  const sizes = useMemo(() => {
    if (!width) return '';

    // Définition des breakpoints responsive
    const breakpoints = [
      { maxWidth: 640, size: '100vw' },
      { maxWidth: 768, size: '50vw' },
      { maxWidth: 1024, size: '33vw' },
      { maxWidth: 1280, size: '25vw' },
      { maxWidth: Infinity, size: '20vw' }
    ];

    return breakpoints
      .map(bp => bp.maxWidth === Infinity ? bp.size : `(max-width: ${bp.maxWidth}px) ${bp.size}`)
      .join(', ');
  }, [width]);

  // Charger les dimensions de l'image
  useEffect(() => {
    if (!src || !lazy) return;

    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setLoading(false);
      setError(null);
    };

    img.onerror = () => {
      setError('Failed to load image');
      setLoading(false);
      logger.warn('Image failed to load', { src });
    };

    img.src = optimizedSrc || src;
  }, [src, optimizedSrc, lazy]);

  return {
    src: optimizedSrc || src,
    srcSet,
    sizes,
    width: dimensions.width,
    height: dimensions.height,
    loading,
    error,
    fallbackSrc: placeholder || src
  };
}

/**
 * Hook pour optimiser un lot d'images
 */
export function useBatchImageOptimization(
  images: Array<{ src: string; options?: ImageOptimizationOptions }>
) {
  const [results, setResults] = useState<Record<string, OptimizedImageResult>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!images.length) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const newResults: Record<string, OptimizedImageResult> = {};
    const newErrors: Record<string, string> = {};

    const loadPromises = images.map(async ({ src, options }) => {
      try {
        // Simuler l'appel à une API d'optimisation ou utiliser le hook individuel
        const optimizedSrc = `${src}?optimized=true`;
        newResults[src] = {
          src: optimizedSrc,
          srcSet: '',
          sizes: '',
          width: 0,
          height: 0,
          loading: false,
          error: null,
          fallbackSrc: src
        };
      } catch (error) {
        newErrors[src] = error instanceof Error ? error.message : 'Optimization failed';
      }
    });

    Promise.all(loadPromises).then(() => {
      setResults(newResults);
      setErrors(newErrors);
      setLoading(false);
    });
  }, [images]);

  return { results, loading, errors };
}

/**
 * Hook pour précharger des images optimisées
 */
export function useImagePreloader(sources: string[]) {
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const preload = useCallback((src: string) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        setLoaded(prev => new Set(prev).add(src));
        resolve();
      };

      img.onerror = () => {
        setErrors(prev => new Set(prev).add(src));
        reject(new Error(`Failed to preload ${src}`));
      };

      // Utiliser l'URL optimisée
      img.src = `${src}?optimized=true&w=100&h=100&fit=cover`;
    });
  }, []);

  useEffect(() => {
    if (!sources.length) return;

    const preloadPromises = sources.map(src => preload(src));

    Promise.allSettled(preloadPromises).then(results => {
      const failedCount = results.filter(r => r.status === 'rejected').length;
      if (failedCount > 0) {
        logger.warn('Some images failed to preload', { failedCount, total: sources.length });
      }
    });
  }, [sources, preload]);

  return {
    loadedImages: Array.from(loaded),
    failedImages: Array.from(errors),
    isLoaded: (src: string) => loaded.has(src),
    hasError: (src: string) => errors.has(src)
  };
}

/**
 * Hook pour détecter le support des formats d'images modernes
 */
export function useImageFormatSupport() {
  const [supports, setSupports] = useState({
    webp: false,
    avif: false,
    loading: true
  });

  useEffect(() => {
    const checkSupport = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setSupports({ webp: false, avif: false, loading: false });
        return;
      }

      // Vérifier WebP
      const webpSupported = canvas.toDataURL('image/webp').indexOf('image/webp') === 5;

      // Vérifier AVIF (plus complexe)
      let avifSupported = false;
      try {
        const avifImage = new Image();
        await new Promise((resolve, reject) => {
          avifImage.onload = resolve;
          avifImage.onerror = reject;
          avifImage.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
        });
        avifSupported = true;
      } catch {
        avifSupported = false;
      }

      setSupports({
        webp: webpSupported,
        avif: avifSupported,
        loading: false
      });
    };

    checkSupport();
  }, []);

  return supports;
}

/**
 * Utilitaire pour générer des URLs d'images optimisées
 */
export function generateOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!src) return '';

  try {
    const url = new URL(src, window.location.origin);
    const params = new URLSearchParams(url.search);

    // Appliquer les options d'optimisation
    if (options.quality && options.quality !== 85) {
      params.set('q', options.quality.toString());
    }

    if (options.format && options.format !== 'webp') {
      params.set('f', options.format);
    }

    if (options.width) {
      params.set('w', options.width.toString());
    }

    if (options.height) {
      params.set('h', options.height.toString());
    }

    if (options.fit && options.fit !== 'cover') {
      params.set('fit', options.fit);
    }

    url.search = params.toString();
    return url.toString();
  } catch {
    return src;
  }
}