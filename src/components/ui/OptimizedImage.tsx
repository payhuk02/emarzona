/**
 * Composant OptimizedImage avec support WebP, srcset responsive et lazy loading
 * Affiche automatiquement la version WebP si disponible
 * Génère des srcSet responsive pour optimiser le chargement
 * 
 * Usage:
 * <OptimizedImage src="/image.jpg" alt="Description" width={400} height={300} />
 * <OptimizedImage src="/image.jpg" alt="Description" responsive sizes={{ mobile: 400, tablet: 768, desktop: 1200 }} />
 */

import { useState, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl, getResponsiveSrcSet, getImageAttributesForPreset, IMAGE_PRESETS, isSupabaseStorageUrl } from '@/lib/image-transform';
import { logger } from '@/lib/logger';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: string;
  priority?: boolean; // Si true, ne pas lazy load
  responsive?: boolean; // Si true, génère un srcSet responsive
  sizes?: {
    mobile?: number;    // 300-400px
    tablet?: number;    // 600-768px
    desktop?: number;   // 900-1200px
    large?: number;     // 1600px+ (optionnel)
  };
  preset?: keyof typeof IMAGE_PRESETS; // Preset prédéfini (productImage, storeLogo, etc.)
  quality?: number; // Qualité de l'image (1-100)
}

export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className,
  fallback = '/placeholder-image.png',
  priority = false,
  responsive = false,
  sizes,
  preset,
  quality = 90, // Qualité élevée pour netteté professionnelle
  ...props
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true); // Initialiser à true pour éviter tout flash gris
  
  // Détecter si on est sur mobile pour optimiser le chargement
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Utiliser un preset si spécifié
  const imageAttrs = preset 
    ? getImageAttributesForPreset(src, preset)
    : null;

  // Générer les URLs optimisées
  const getOptimizedUrls = () => {
    if (error || !src) {
      return {
        webpSrc: fallback,
        originalSrc: fallback,
        srcSet: undefined,
        sizesAttr: undefined,
      };
    }

    // Si c'est une URL Supabase Storage, utiliser les transformations
    if (isSupabaseStorageUrl(src)) {
      // Si preset est utilisé, utiliser les attributs du preset
      if (imageAttrs) {
        return {
          webpSrc: imageAttrs.src || src,
          originalSrc: src,
          srcSet: imageAttrs.srcSet,
          sizesAttr: imageAttrs.sizes,
        };
      }

      // Si responsive est activé, générer un srcSet
      if (responsive && sizes) {
        const srcSet = getResponsiveSrcSet(src, sizes, { quality, format: 'webp' });
        const sizesAttr = sizes.mobile && sizes.tablet && sizes.desktop
          ? `(max-width: 640px) ${sizes.mobile}px, (max-width: 1024px) ${sizes.tablet}px, ${sizes.desktop}px`
          : undefined;

        // URL WebP par défaut (desktop)
        const webpSrc = getOptimizedImageUrl(src, {
          width: sizes.desktop || width,
          quality,
          format: 'webp',
        }) || src;

        return {
          webpSrc,
          originalSrc: src,
          srcSet,
          sizesAttr,
        };
      }

      // URL WebP simple avec fallback JPG/PNG
      const webpSrc = getOptimizedImageUrl(src, {
        width,
        quality,
        format: 'webp',
      }) || src;

      // Fallback vers format original si WebP non supporté
      const fallbackSrc = getOptimizedImageUrl(src, {
        width,
        quality,
        format: 'origin', // Format original comme fallback
      }) || src;

      return {
        webpSrc,
        originalSrc: fallbackSrc,
        srcSet: undefined,
        sizesAttr: undefined,
      };
    }

    // Pour les URLs non-Supabase, retourner tel quel
    return {
      webpSrc: src,
      originalSrc: src,
      srcSet: undefined,
      sizesAttr: undefined,
    };
  };

  const { webpSrc, originalSrc, srcSet, sizesAttr } = getOptimizedUrls();
  
  // Détecter le support WebP du navigateur
  const [webpSupported, setWebpSupported] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Vérifier le support WebP
    const checkWebPSupport = async () => {
      if (typeof window === 'undefined') return;
      
      // Méthode rapide : vérifier si le navigateur supporte WebP
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          const dataURI = canvas.toDataURL('image/webp');
          setWebpSupported(dataURI.startsWith('data:image/webp'));
        } catch {
          setWebpSupported(false);
        }
      } else {
        setWebpSupported(false);
      }
    };
    
    checkWebPSupport();
  }, []);
  
  // Forcer le chargement immédiat sur mobile si l'image est valide
  useEffect(() => {
    if (isMobile && src && !error) {
      // Précharger l'image sur mobile pour améliorer l'affichage
      const img = new Image();
      const imageUrl = webpSrc || originalSrc || src;
      img.src = imageUrl;
      
      // Gérer le chargement réussi - ne pas changer imageLoaded car déjà à true
      img.onload = () => {
        // Image préchargée avec succès
      };
      
      // Gérer les erreurs de préchargement
      img.onerror = () => {
        logger.warn('[OptimizedImage] Preload failed on mobile', { imageUrl });
      };
    }
  }, [isMobile, src, webpSrc, originalSrc, error]);

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleError = () => {
    logger.error('[OptimizedImage] Failed to load', { src, webpSrc, originalSrc });
    setError(true);
  };
  
  // Pas de timeout - afficher l'image directement

  // Déterminer si on doit utiliser WebP
  const useWebP = !error && isSupabaseStorageUrl(src) && webpSrc !== originalSrc;
  
  // Charger en eager seulement si priorité ou si c'est une image LCP (première image visible)
  // Sur mobile, utiliser lazy loading pour améliorer les performances
  const shouldLoadEager = priority || false; // Ne plus forcer eager sur mobile

  return (
    <picture className={cn('relative w-full h-full bg-transparent', className)}>
      {/* Source WebP avec srcSet si disponible */}
      {useWebP && (
        <source 
          srcSet={srcSet || webpSrc} 
          type="image/webp"
          sizes={sizesAttr || (isMobile ? '100vw' : undefined)}
        />
      )}
      
      {/* Source fallback (JPEG/PNG) avec srcSet si disponible */}
      {srcSet && !useWebP && (
        <source 
          srcSet={srcSet} 
          type="image/jpeg"
          sizes={sizesAttr || (isMobile ? '100vw' : undefined)}
        />
      )}
      
      {/* Image fallback - Optimisée pour mobile avec dimensions fixes pour CLS */}
      <img
        src={error ? fallback : (webpSrc || originalSrc || src || fallback)}
        alt={alt}
        width={width}
        height={height}
        srcSet={srcSet && !useWebP ? srcSet : undefined}
        sizes={sizesAttr || (isMobile ? '100vw' : undefined)}
        loading={shouldLoadEager ? 'eager' : 'lazy'}
        decoding={shouldLoadEager ? 'sync' : 'async'}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'image-sharp', // Classe pour netteté professionnelle
          'opacity-100', // Toujours visible - pas de transition pour éviter flash gris
          'w-full h-auto object-contain',
          'block', // Forcer display block pour éviter les problèmes de layout
          className
        )}
        style={{
          imageRendering: 'crisp-edges',
          // Dimensions fixes pour éviter CLS (Cumulative Layout Shift)
          ...(width && height ? {
            aspectRatio: `${width} / ${height}`,
            maxWidth: '100%',
            height: 'auto',
          } : {}),
          minHeight: isMobile ? '200px' : undefined, // Hauteur minimum sur mobile
          position: 'relative', // S'assurer que l'image reste visible
          zIndex: 1, // S'assurer que l'image est au-dessus
          // Stabilité garantie - pas de transformations
          transform: 'none',
          // Toujours visible
          visibility: 'visible',
          opacity: 1,
          // Optimisation performance
          willChange: 'auto',
          backfaceVisibility: 'visible',
          WebkitBackfaceVisibility: 'visible',
          ...props.style
        }}
        {...props}
      />
      
      {/* Pas de skeleton - afficher l'image directement pour un rendu professionnel */}
    </picture>
  );
};

/**
 * Version avec ratio aspect fixe
 */
interface OptimizedImageWithAspectRatioProps extends OptimizedImageProps {
  aspectRatio?: string; // ex: "16/9", "4/3", "1/1"
}

export const OptimizedImageWithAspectRatio = ({
  aspectRatio = '16/9',
  className,
  ...props
}: OptimizedImageWithAspectRatioProps) => {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        {...props}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};
