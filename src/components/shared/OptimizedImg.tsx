/**
 * Composant Image optimisé avec lazy loading par défaut
 * Utilise ce composant au lieu de <img> natif
 */

import { ImgHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Priorité de chargement (eager pour les images above-the-fold)
   */
  priority?: boolean;
  
  /**
   * Décodage asynchrone pour améliorer les performances
   */
  decoding?: 'sync' | 'async' | 'auto';
}

/**
 * Composant Image optimisé
 * 
 * @example
 * ```tsx
 * <OptimizedImg 
 *   src="/image.jpg" 
 *   alt="Description"
 *   priority={false} // lazy par défaut
 * />
 * ```
 */
export const OptimizedImg = forwardRef<HTMLImageElement, OptimizedImgProps>(
  ({ priority = false, decoding = 'async', className, ...props }, ref) => {
    return (
      <img
        ref={ref}
        loading={priority ? 'eager' : 'lazy'}
        decoding={decoding}
        className={cn('object-cover', className)}
        {...props}
      />
    );
  }
);

OptimizedImg.displayName = 'OptimizedImg';

