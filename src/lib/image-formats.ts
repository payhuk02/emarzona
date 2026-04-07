/**
 * Utilitaires pour la gestion des formats d'images modernes (WebP, AVIF)
 * Améliore les performances en utilisant des formats optimisés avec fallback
 */

/**
 * Génère un srcset avec support WebP/AVIF et fallback
 * @param baseSrc - URL de base de l'image
 * @param breakpoints - Largeurs en pixels pour responsive images
 * @param quality - Qualité de compression (1-100)
 * @returns Objet avec srcset pour différents formats
 */
export function generateResponsiveSrcSet(
  baseSrc: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280, 1600],
  quality: number = 85,
  isLowBandwidth: boolean = false // Nouveau paramètre
): {
  webp: string;
  avif: string;
  fallback: string;
} {
  const adjustedQuality = isLowBandwidth ? Math.max(quality - 20, 40) : quality; // Réduire la qualité en cas de faible bande passante

  const generateSrcSetForFormat = (format: 'webp' | 'avif' | 'jpg'): string => {
    return breakpoints
      .map(bp => {
        const extension = format === 'jpg' ? 'jpg' : format;
        // Dans un vrai système, ceci pointerait vers des images pré-générées
        const src = `${baseSrc}?w=${bp}&q=${adjustedQuality}&format=${extension}`;
        return `${src} ${bp}w`;
      })
      .join(', ');
  };

  return {
    webp: generateSrcSetForFormat('webp'),
    avif: generateSrcSetForFormat('avif'),
    fallback: generateSrcSetForFormat('jpg'),
  };
}

/**
 * Vérifie si le navigateur supporte AVIF
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src =
      'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Vérifie si le navigateur supporte WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Détecte le meilleur format d'image supporté par le navigateur
 * Retourne 'avif' > 'webp' > 'jpg' selon le support
 */
export async function getBestImageFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  if (await supportsAVIF()) {
    return 'avif';
  }
  if (await supportsWebP()) {
    return 'webp';
  }
  return 'jpg';
}
