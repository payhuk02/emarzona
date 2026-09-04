/**
 * Helpers SEO image — client-safe (pas de Buffer / Sharp / Node).
 */

export function calculateImageSEOScore(
  filename: string,
  alt?: string,
  width?: number,
  height?: number
): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  let score = 100;
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (!filename || filename.includes('image') || filename.includes('img')) {
    score -= 20;
    issues.push('Nom de fichier générique (image.jpg, img.png)');
    recommendations.push('Utiliser un nom descriptif (ex: produit-electronique-bleu.jpg)');
  }

  if (!alt || alt.length < 10) {
    score -= 30;
    issues.push('Texte alternatif manquant ou trop court');
    recommendations.push('Ajouter un texte alternatif descriptif de 10-125 caractères');
  } else if (alt.length > 125) {
    score -= 10;
    issues.push('Texte alternatif trop long');
    recommendations.push('Limiter le texte alternatif à 125 caractères');
  }

  if (!width || !height) {
    score -= 15;
    issues.push("Dimensions d'image non disponibles");
  } else {
    if (width < 400) {
      score -= 10;
      issues.push("Largeur d'image insuffisante pour mobile");
      recommendations.push('Utiliser au moins 400px de largeur');
    }
    if (width > 2000) {
      score -= 5;
      issues.push('Image très large, considérer optimisation');
    }
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}

export function generateImageSEOAttributes(
  filename: string,
  alt: string,
  width?: number,
  height?: number,
  loading: 'lazy' | 'eager' = 'lazy'
) {
  const seoScore = calculateImageSEOScore(filename, alt, width, height);

  return {
    alt,
    loading,
    decoding: 'async' as const,
    width,
    height,
    fetchpriority: loading === 'eager' ? ('high' as const) : ('auto' as const),
    'data-seo-score': seoScore.score,
    'data-seo-issues': seoScore.issues.length,
    className:
      `seo-image seo-score-${Math.floor(seoScore.score / 20) * 20} ${loading === 'lazy' ? 'lazy-loaded' : ''}`.trim(),
  };
}

export function validateImageDimensions(
  width: number,
  height: number,
  minWidth = 100,
  maxWidth = 4000,
  minHeight = 100,
  maxHeight = 4000
): { valid: boolean; error?: string } {
  if (width < minWidth || height < minHeight) {
    return {
      valid: false,
      error: `Image trop petite. Minimum: ${minWidth}x${minHeight}px`,
    };
  }

  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      error: `Image trop grande. Maximum: ${maxWidth}x${maxHeight}px`,
    };
  }

  const ratio = Math.max(width / height, height / width);
  if (ratio > 10) {
    return {
      valid: false,
      error: "Ratio d'aspect trop extrême (max 10:1)",
    };
  }

  return { valid: true };
}
