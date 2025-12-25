/**
 * Composant AccessibleImage - Garantit toujours un attribut alt
 * Wrapper autour de img qui force la présence d'un alt pour l'accessibilité
 * 
 * @example
 * ```tsx
 * <AccessibleImage 
 *   src="/logo.png" 
 *   alt="Logo Emarzona" 
 *   className="h-8 w-8"
 * />
 * ```
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface AccessibleImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * URL de l'image
   */
  src: string;
  /**
   * Texte alternatif (requis pour accessibilité)
   * Si non fourni, un alt par défaut sera utilisé
   */
  alt?: string;
  /**
   * Indique si l'image est décorative (alt vide)
   * @default false
   */
  decorative?: boolean;
  /**
   * Classe CSS additionnelle
   */
  className?: string;
}

/**
 * Composant AccessibleImage
 * Garantit toujours un attribut alt pour l'accessibilité WCAG
 */
export const AccessibleImage = React.forwardRef<HTMLImageElement, AccessibleImageProps>(
  ({ src, alt, decorative = false, className, ...props }, ref) => {
    // Déterminer l'alt final
    const finalAlt = React.useMemo(() => {
      if (decorative) {
        return ''; // Alt vide pour images décoratives (WCAG 2.1)
      }
      
      if (alt !== undefined && alt !== null && alt.trim() !== '') {
        return alt;
      }
      
      // Générer un alt par défaut basé sur le nom du fichier ou le contexte
      const fileName = src.split('/').pop()?.split('.')[0] || 'image';
      return `Image: ${fileName}`;
    }, [alt, decorative, src]);

    return (
      <img
        ref={ref}
        src={src}
        alt={finalAlt}
        className={cn('block', className)}
        {...props}
      />
    );
  }
);

AccessibleImage.displayName = 'AccessibleImage';

/**
 * Hook pour générer un alt descriptif basé sur le contexte
 */
export function useImageAlt(
  context: string,
  index?: number,
  total?: number
): string {
  return React.useMemo(() => {
    if (index !== undefined && total !== undefined && total > 1) {
      return `${context} - Image ${index + 1} sur ${total}`;
    }
    return context;
  }, [context, index, total]);
}

