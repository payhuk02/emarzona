/**
 * Service d'optimisation d'images pour SEO et performances
 * Utilise Sharp.js pour compression automatique et génération de tailles multiples
 */

import sharp from 'sharp';

export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  progressive?: boolean;
  sizes?: number[]; // Largeurs en pixels pour responsive images
  maxWidth?: number;
  maxHeight?: number;
}

export interface OptimizedImageResult {
  original: Buffer;
  optimized: Buffer;
  sizes: { [key: string]: Buffer };
  metadata: {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    format: string;
    width: number;
    height: number;
  };
}

/**
 * Optimise une image avec compression et tailles multiples
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    quality = 85,
    format = 'webp',
    progressive = true,
    sizes = [400, 800, 1200, 1600],
    maxWidth = 2000,
    maxHeight = 2000
  } = options;

  try {
    // Analyse de l'image originale
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalSize = inputBuffer.length;

    // Configuration Sharp selon le format
    let sharpInstance = sharp(inputBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });

    // Appliquer les options selon le format
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive,
          mozjpeg: true
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          progressive,
          compressionLevel: 6
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 4 // Meilleur équilibre qualité/compression
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          effort: 4
        });
        break;
    }

    // Générer l'image optimisée principale
    const optimizedBuffer = await sharpInstance.toBuffer();
    const optimizedMetadata = await sharp(optimizedBuffer).metadata();

    // Générer les différentes tailles
    const sizeBuffers: { [key: string]: Buffer } = {};

    for (const size of sizes) {
      if (originalMetadata.width && originalMetadata.width > size) {
        const resizedBuffer = await sharp(inputBuffer)
          .resize(size, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          [format]({
            quality: Math.min(quality + 5, 95), // Qualité légèrement supérieure pour les petites tailles
            ...(format === 'jpeg' && { progressive }),
            ...(format === 'webp' && { effort: 4 }),
            ...(format === 'avif' && { effort: 4 })
          })
          .toBuffer();

        sizeBuffers[`${size}w`] = resizedBuffer;
      }
    }

    return {
      original: inputBuffer,
      optimized: optimizedBuffer,
      sizes: sizeBuffers,
      metadata: {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: ((originalSize - optimizedBuffer.length) / originalSize) * 100,
        format: optimizedMetadata.format || format,
        width: optimizedMetadata.width || 0,
        height: optimizedMetadata.height || 0
      }
    };

  } catch (error) {
    console.error('Erreur lors de l\'optimisation d\'image:', error);
    throw new Error(`Impossible d'optimiser l'image: ${error.message}`);
  }
}

/**
 * Génère un srcset pour images responsive
 */
export function generateSrcSet(sizes: { [key: string]: Buffer }): string {
  return Object.entries(sizes)
    .map(([size, buffer]) => `/api/images/${size}.webp ${size}`)
    .join(', ');
}

/**
 * Détecte le meilleur format d'image supporté
 */
export function getOptimalImageFormat(acceptHeader?: string): 'webp' | 'avif' | 'jpeg' {
  if (!acceptHeader) return 'webp';

  if (acceptHeader.includes('image/avif')) return 'avif';
  if (acceptHeader.includes('image/webp')) return 'webp';

  return 'jpeg';
}

/**
 * Valide les dimensions d'une image
 */
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
      error: `Image trop petite. Minimum: ${minWidth}x${minHeight}px`
    };
  }

  if (width > maxWidth || height > maxHeight) {
    return {
      valid: false,
      error: `Image trop grande. Maximum: ${maxWidth}x${maxHeight}px`
    };
  }

  // Vérifier le ratio d'aspect (pas trop extrême)
  const ratio = Math.max(width / height, height / width);
  if (ratio > 10) {
    return {
      valid: false,
      error: 'Ratio d\'aspect trop extrême (max 10:1)'
    };
  }

  return { valid: true };
}

/**
 * Calcule le score SEO d'une image
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

  // Vérifier le nom du fichier
  if (!filename || filename.includes('image') || filename.includes('img')) {
    score -= 20;
    issues.push('Nom de fichier générique (image.jpg, img.png)');
    recommendations.push('Utiliser un nom descriptif (ex: produit-electronique-bleu.jpg)');
  }

  // Vérifier l'alt text
  if (!alt || alt.length < 10) {
    score -= 30;
    issues.push('Texte alternatif manquant ou trop court');
    recommendations.push('Ajouter un texte alternatif descriptif de 10-125 caractères');
  } else if (alt.length > 125) {
    score -= 10;
    issues.push('Texte alternatif trop long');
    recommendations.push('Limiter le texte alternatif à 125 caractères');
  }

  // Vérifier les dimensions
  if (!width || !height) {
    score -= 15;
    issues.push('Dimensions d\'image non disponibles');
  } else {
    if (width < 400) {
      score -= 10;
      issues.push('Largeur d\'image insuffisante pour mobile');
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
    recommendations
  };
}

/**
 * Génère des attributs HTML optimisés pour SEO
 */
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
    // Attributs pour Core Web Vitals
    fetchpriority: loading === 'eager' ? 'high' as const : 'auto' as const,
    // Métadonnées SEO
    'data-seo-score': seoScore.score,
    'data-seo-issues': seoScore.issues.length,
    // Classes CSS pour optimisation
    className: `seo-image seo-score-${Math.floor(seoScore.score / 20) * 20} ${loading === 'lazy' ? 'lazy-loaded' : ''}`.trim()
  };
}