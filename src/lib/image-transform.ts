/**
 * Utilitaire pour optimiser et transformer les images avec Supabase Transform API
 * 
 * Features:
 * - Génération d'URLs optimisées (width, quality, format)
 * - Support srcSet responsive
 * - Conversion WebP automatique
 * - BlurHash placeholders (future)
 */

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png' | 'avif' | 'origin';
  resize?: 'cover' | 'contain' | 'fill';
}

export interface ResponsiveImageSizes {
  mobile: number;    // 300-400px
  tablet: number;    // 600-768px
  desktop: number;   // 900-1200px
  large?: number;    // 1600px+ (optionnel)
}

/**
 * Vérifie si une URL est une URL Supabase Storage
 */
export const isSupabaseStorageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false;
  return url.includes('.supabase.co/storage/v1/object/public/');
};

/**
 * Génère une URL Supabase Storage optimisée avec paramètres de transformation
 * 
 * Supabase Transform API: https://supabase.com/docs/guides/storage/image-transformations
 * 
 * @param imageUrl - URL originale de l'image Supabase
 * @param options - Options de transformation
 * @returns URL transformée avec paramètres
 * 
 * @example
 * const optimizedUrl = getOptimizedImageUrl(
 *   'https://project.supabase.co/storage/v1/object/public/bucket/image.jpg',
 *   { width: 600, quality: 80, format: 'webp' }
 * );
 * // => 'https://project.supabase.co/storage/v1/object/public/bucket/image.jpg?width=600&quality=80&format=webp'
 */
export const getOptimizedImageUrl = (
  imageUrl: string | undefined | null,
  options: ImageTransformOptions = {}
): string | undefined => {
  if (!imageUrl) return undefined;
  
  // Si ce n'est pas une URL Supabase Storage, retourner tel quel
  if (!isSupabaseStorageUrl(imageUrl)) {
    return imageUrl;
  }

  // Construire les paramètres de transformation
  const params = new URLSearchParams();

  if (options.width) {
    params.append('width', options.width.toString());
  }

  if (options.height) {
    params.append('height', options.height.toString());
  }

  if (options.quality) {
    params.append('quality', Math.min(100, Math.max(1, options.quality)).toString());
  }

  if (options.format) {
    params.append('format', options.format);
  }

  if (options.resize) {
    params.append('resize', options.resize);
  }

  const queryString = params.toString();
  
  // Ajouter les paramètres à l'URL
  return queryString ? `${imageUrl}?${queryString}` : imageUrl;
};

/**
 * Génère un srcSet responsive pour une image
 * 
 * @param imageUrl - URL originale de l'image
 * @param sizes - Largeurs pour les différents breakpoints
 * @param options - Options communes de transformation
 * @returns String srcSet pour l'attribut HTML
 * 
 * @example
 * const srcSet = getResponsiveSrcSet(imageUrl, {
 *   mobile: 400,
 *   tablet: 768,
 *   desktop: 1200
 * }, { quality: 80, format: 'webp' });
 * // => "url?width=400&... 400w, url?width=768&... 768w, url?width=1200&... 1200w"
 */
export const getResponsiveSrcSet = (
  imageUrl: string | undefined | null,
  sizes: ResponsiveImageSizes,
  options: Omit<ImageTransformOptions, 'width'> = {}
): string | undefined => {
  if (!imageUrl || !isSupabaseStorageUrl(imageUrl)) {
    return imageUrl || undefined;
  }

  const srcSetParts: string[] = [];

  // Mobile
  if (sizes.mobile) {
    const url = getOptimizedImageUrl(imageUrl, { ...options, width: sizes.mobile });
    if (url) srcSetParts.push(`${url} ${sizes.mobile}w`);
  }

  // Tablet
  if (sizes.tablet) {
    const url = getOptimizedImageUrl(imageUrl, { ...options, width: sizes.tablet });
    if (url) srcSetParts.push(`${url} ${sizes.tablet}w`);
  }

  // Desktop
  if (sizes.desktop) {
    const url = getOptimizedImageUrl(imageUrl, { ...options, width: sizes.desktop });
    if (url) srcSetParts.push(`${url} ${sizes.desktop}w`);
  }

  // Large (optionnel)
  if (sizes.large) {
    const url = getOptimizedImageUrl(imageUrl, { ...options, width: sizes.large });
    if (url) srcSetParts.push(`${url} ${sizes.large}w`);
  }

  return srcSetParts.length > 0 ? srcSetParts.join(', ') : undefined;
};

/**
 * Presets pour différents types d'images
 */
export const IMAGE_PRESETS = {
  /**
   * Logo de boutique (carré, haute qualité)
   */
  storeLogo: {
    sizes: { mobile: 120, tablet: 200, desktop: 300 },
    options: { quality: 90, format: 'webp' as const, resize: 'cover' as const }
  },

  /**
   * Bannière de boutique (paysage, qualité moyenne-haute)
   */
  storeBanner: {
    sizes: { mobile: 600, tablet: 1024, desktop: 1920 },
    options: { quality: 85, format: 'webp' as const, resize: 'cover' as const }
  },

  /**
   * Image produit (carré/vertical, qualité élevée)
   */
  productImage: {
    sizes: { mobile: 400, tablet: 600, desktop: 800, large: 1200 },
    options: { quality: 85, format: 'webp' as const, resize: 'cover' as const }
  },

  /**
   * Thumbnail produit (petit, qualité moyenne)
   */
  productThumbnail: {
    sizes: { mobile: 200, tablet: 300, desktop: 400 },
    options: { quality: 75, format: 'webp' as const, resize: 'cover' as const }
  },

  /**
   * Avatar utilisateur (petit carré)
   */
  avatar: {
    sizes: { mobile: 80, tablet: 120, desktop: 150 },
    options: { quality: 85, format: 'webp' as const, resize: 'cover' as const }
  },

  /**
   * Galerie produit (haute qualité, grandes tailles)
   */
  productGallery: {
    sizes: { mobile: 600, tablet: 900, desktop: 1200, large: 1600 },
    options: { quality: 90, format: 'webp' as const, resize: 'contain' as const }
  }
};

/**
 * Génère les attributs d'image optimisés pour un preset
 * 
 * @param imageUrl - URL originale de l'image
 * @param preset - Nom du preset à utiliser
 * @returns Objet avec src, srcSet, et sizes
 * 
 * @example
 * const imageAttrs = getImageAttributesForPreset(product.image_url, 'productImage');
 * <img {...imageAttrs} alt="Product" loading="lazy" />
 */
export const getImageAttributesForPreset = (
  imageUrl: string | undefined | null,
  presetName: keyof typeof IMAGE_PRESETS
) => {
  if (!imageUrl) {
    return {
      src: undefined,
      srcSet: undefined,
      sizes: undefined
    };
  }

  const preset = IMAGE_PRESETS[presetName];
  
  // Génerer src par défaut (taille desktop)
  const src = getOptimizedImageUrl(imageUrl, {
    ...preset.options,
    width: preset.sizes.desktop
  });

  // Générer srcSet responsive
  const srcSet = getResponsiveSrcSet(imageUrl, preset.sizes, preset.options);

  // Générer l'attribut sizes basé sur les breakpoints
  const sizesArray: string[] = [];
  if (preset.sizes.mobile) sizesArray.push(`(max-width: 640px) ${preset.sizes.mobile}px`);
  if (preset.sizes.tablet) sizesArray.push(`(max-width: 1024px) ${preset.sizes.tablet}px`);
  if (preset.sizes.large) sizesArray.push(`(min-width: 1536px) ${preset.sizes.large}px`);
  sizesArray.push(`${preset.sizes.desktop}px`); // Fallback

  return {
    src,
    srcSet,
    sizes: sizesArray.join(', ')
  };
};

/**
 * Calcule le gain de performance estimé de l'optimisation
 * 
 * Basé sur les statistiques moyennes :
 * - Image originale JPG: ~500KB
 * - Image WebP optimisée (quality 80): ~150KB
 * - Gain moyen: ~70%
 */
export const calculateOptimizationGain = (
  originalSizeKB: number,
  optimizedSizeKB: number
): {
  gainKB: number;
  gainPercent: number;
  loadTimeImprovement: number; // en ms sur connexion 3G moyenne
} => {
  const gainKB = originalSizeKB - optimizedSizeKB;
  const gainPercent = (gainKB / originalSizeKB) * 100;
  
  // Connexion 3G moyenne: ~750 KB/s
  const SPEED_3G_KBPS = 750;
  const loadTimeImprovement = (gainKB / SPEED_3G_KBPS) * 1000;

  return {
    gainKB: Math.round(gainKB),
    gainPercent: Math.round(gainPercent),
    loadTimeImprovement: Math.round(loadTimeImprovement)
  };
};

/**
 * Précharge une image de manière asynchrone
 * Utile pour les images "above the fold"
 */
export const preloadImage = (imageUrl: string, as: 'image' | 'fetch' = 'image'): void => {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = imageUrl;
  document.head.appendChild(link);
};

/**
 * Détecte le support WebP du navigateur
 */
export const supportsWebP = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  // Check via canvas
  if (!document.createElement('canvas').getContext) return false;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const dataURI = canvas.toDataURL('image/webp');
  return dataURI.startsWith('data:image/webp');
};

/**
 * Formate un nombre de KB en format lisible
 */
export const formatFileSize = (sizeInKB: number): string => {
  if (sizeInKB < 1024) {
    return `${Math.round(sizeInKB)} KB`;
  }
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

