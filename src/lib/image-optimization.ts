/**
 * Service d'optimisation d'images pour SEO et performances
 * Utilise Sharp.js pour compression automatique et génération de tailles multiples (côté serveur uniquement)
 */

import { logger } from '@/lib/logger';

// Type pour Sharp (importé dynamiquement)
type SharpInstance = {
  metadata: () => Promise<{ width?: number; height?: number; format?: string }>;
  resize: (width: number | null, height: number | null, options: unknown) => SharpInstance;
  jpeg: (options: unknown) => SharpInstance;
  png: (options: unknown) => SharpInstance;
  webp: (options: unknown) => SharpInstance;
  avif: (options: unknown) => SharpInstance;
  toBuffer: () => Promise<Buffer>;
};

// Sharp est importé de manière asynchrone pour éviter les erreurs côté client
let sharp: SharpInstance | null = null;
const isServer = typeof window === 'undefined';

if (isServer) {
  try {
    // Import dynamique de sharp seulement côté serveur
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    sharp = require('sharp') as SharpInstance;
  } catch (error) {
    logger.warn('Sharp library not available, image optimization will be limited', { error });
  }
}

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
    maxHeight = 2000,
  } = options;

  // Vérifier si on est côté serveur et si sharp est disponible
  if (!isServer || !sharp) {
    logger.warn('Image optimization is only available on the server side');
    // Retourner une version mock pour le développement côté client
    return {
      original: inputBuffer,
      optimized: inputBuffer,
      sizes: {},
      metadata: {
        originalSize: inputBuffer.length,
        optimizedSize: inputBuffer.length,
        compressionRatio: 0,
        format: 'original',
        width: 0,
        height: 0,
      },
    };
  }

  try {
    // Analyse de l'image originale
    const originalMetadata = await sharp(inputBuffer).metadata();
    const originalSize = inputBuffer.length;

    // Configuration Sharp selon le format
    let sharpInstance = sharp(inputBuffer).resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // Appliquer les options selon le format
    switch (format) {
      case 'jpeg':
        sharpInstance = sharpInstance.jpeg({
          quality,
          progressive,
          mozjpeg: true,
        });
        break;
      case 'png':
        sharpInstance = sharpInstance.png({
          quality,
          progressive,
          compressionLevel: 6,
        });
        break;
      case 'webp':
        sharpInstance = sharpInstance.webp({
          quality,
          effort: 4, // Meilleur équilibre qualité/compression
        });
        break;
      case 'avif':
        sharpInstance = sharpInstance.avif({
          quality,
          effort: 4,
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
        const resized = sharp(inputBuffer).resize(size, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        const formatOptions = {
          quality: Math.min(quality + 5, 95),
          ...(format === 'jpeg' && { progressive }),
          ...(format === 'webp' && { effort: 4 }),
          ...(format === 'avif' && { effort: 4 }),
        };
        const resizedBuffer = await resized[format](formatOptions).toBuffer();

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
        height: optimizedMetadata.height || 0,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Erreur lors de l'optimisation d'image", { error: errorMessage });
    throw new Error(`Impossible d'optimiser l'image: ${errorMessage}`);
  }
}

/**
 * Génère un srcset pour images responsive
 */
export function generateSrcSet(sizes: { [key: string]: Buffer }): string {
  return Object.entries(sizes)
    .map(([size]) => `/api/images/${size}.webp ${size}`)
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

export {
  validateImageDimensions,
  calculateImageSEOScore,
  generateImageSEOAttributes,
} from '@/lib/image-seo';
