import { useState, useEffect, useCallback } from 'react';

// Hook pour l'optimisation avancée des images
export const useImageOptimization = () => {
  const [isWebPSupported, setIsWebPSupported] = useState(false);
  const [isAVIFSupported, setIsAVIFSupported] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);

  useEffect(() => {
    // Vérifier le support WebP
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const webpDataURL = canvas.toDataURL('image/webp');
      setIsWebPSupported(webpDataURL.indexOf('data:image/webp') === 0);
      
      // Vérifier le support AVIF (format encore plus optimisé)
      const avifDataURL = canvas.toDataURL('image/avif');
      setIsAVIFSupported(avifDataURL.indexOf('data:image/avif') === 0);
    }

    // Détecter le ratio de pixels de l'appareil
    setDevicePixelRatio(window.devicePixelRatio || 1);

    // Écouter les changements de ratio de pixels
    const mediaQuery = window.matchMedia(`(min-resolution: ${window.devicePixelRatio}dppx)`);
    const handleChange = () => setDevicePixelRatio(window.devicePixelRatio || 1);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Fonction d'optimisation intelligente des URLs d'images
  const getOptimizedImageUrl = useCallback((
    src: string, 
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      context?: 'grid' | 'detail' | 'thumbnail';
      devicePixelRatio?: number;
    } = {}
  ) => {
    const { 
      width, 
      height, 
      quality = 85, 
      format, 
      context = 'grid',
      devicePixelRatio: customDPR = devicePixelRatio
    } = options;
    
    // Si c'est une URL externe, retourner tel quel
    if (src.startsWith('http') && !src.includes('supabase')) {
      return src;
    }

    const params = new URLSearchParams();
    
    // Sélection automatique du format optimal
    let optimalFormat = format;
    if (!optimalFormat) {
      if (isAVIFSupported) {
        optimalFormat = 'avif';
      } else if (isWebPSupported) {
        optimalFormat = 'webp';
      } else {
        optimalFormat = 'jpeg';
      }
    }
    
    params.set('format', optimalFormat);
    
    // Qualité adaptée au contexte
    let optimalQuality = quality;
    if (context === 'detail') {
      optimalQuality = Math.min(95, quality + 10);
    } else if (context === 'thumbnail') {
      optimalQuality = Math.max(70, quality - 15);
    }
    
    params.set('quality', optimalQuality.toString());
    
    // Dimensions optimisées selon le contexte et le DPR
    if (width && height) {
      const scaledWidth = Math.round(width * customDPR);
      const scaledHeight = Math.round(height * customDPR);
      
      params.set('width', scaledWidth.toString());
      params.set('height', scaledHeight.toString());
    }
    
    params.set('resize', 'cover');
    
    // Optimisations supplémentaires pour Supabase
    params.set('optimize', 'true');
    
    return `${src}?${params.toString()}`;
  }, [isWebPSupported, isAVIFSupported, devicePixelRatio]);

  // Fonction pour obtenir les dimensions optimales selon le contexte
  const getOptimalDimensions = useCallback((context: 'grid' | 'detail' | 'thumbnail' = 'grid') => {
    const baseWidth = 1920; // Largeur de base pour le ratio 16:9
    const baseHeight = 1080; // Hauteur de base pour le ratio 16:9
    
    switch (context) {
      case 'detail':
        return {
          width: baseWidth,
          height: baseHeight,
          quality: 90
        };
      case 'thumbnail':
        return {
          width: 150,
          height: 150,
          quality: 75
        };
      case 'grid':
      default:
        return {
          width: baseWidth,
          height: baseHeight,
          quality: 85
        };
    }
  }, []);

  // Fonction pour précharger les images critiques
  const preloadImage = useCallback((src: string, options?: Parameters<typeof getOptimizedImageUrl>[1]) => {
    const img = new Image();
    img.src = getOptimizedImageUrl(src, options);
    return new Promise((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }, [getOptimizedImageUrl]);

  // Fonction pour créer un placeholder blur optimisé
  const createBlurPlaceholder = useCallback((width: number, height: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Créer un gradient subtil
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      return canvas.toDataURL('image/jpeg', 0.1);
    }
    
    return '';
  }, []);

  return {
    isWebPSupported,
    isAVIFSupported,
    devicePixelRatio,
    getOptimizedImageUrl,
    getOptimalDimensions,
    preloadImage,
    createBlurPlaceholder
  };
};

// Hook pour la gestion du lazy loading avancé
export const useLazyLoading = (priority = false) => {
  const [isInView, setIsInView] = useState(priority);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Chargement anticipé
        threshold: 0.1
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const markAsLoaded = useCallback(() => {
    setHasLoaded(true);
  }, []);

  return {
    isInView,
    hasLoaded,
    elementRef,
    markAsLoaded
  };
};

// Hook pour la gestion des performances d'images
export const useImagePerformance = () => {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map());
  const [errorStates, setErrorStates] = useState<Set<string>>(new Set());

  const setImageLoading = useCallback((src: string, loading: boolean) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev);
      if (loading) {
        newMap.set(src, true);
      } else {
        newMap.delete(src);
      }
      return newMap;
    });
  }, []);

  const setImageError = useCallback((src: string, hasError: boolean) => {
    setErrorStates(prev => {
      const newSet = new Set(prev);
      if (hasError) {
        newSet.add(src);
      } else {
        newSet.delete(src);
      }
      return newSet;
    });
  }, []);

  const isImageLoading = useCallback((src: string) => {
    return loadingStates.get(src) || false;
  }, [loadingStates]);

  const hasImageError = useCallback((src: string) => {
    return errorStates.has(src);
  }, [errorStates]);

  return {
    setImageLoading,
    setImageError,
    isImageLoading,
    hasImageError
  };
};
