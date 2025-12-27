/**
 * 📐 IMAGE FORMATS CONFIGURATION
 * Standard image dimensions for Emarzona platform
 *
 * @version 1.0.0
 * @author Emarzona Team
 */

// ============================================================================
// IMAGE DIMENSIONS
// ============================================================================

export const IMAGE_FORMATS = {
  // Product Images (Main format 3:2)
  product: {
    width: 1536,
    height: 1024,
    aspectRatio: '3:2',
    description: 'Format principal pour les images de produits',
  },

  // Thumbnail (3:2)
  thumbnail: {
    width: 768,
    height: 512,
    aspectRatio: '3:2',
    description: 'Miniature pour les listes et aperçus',
  },

  // Large Product Image (3:2)
  productLarge: {
    width: 2304,
    height: 1536,
    aspectRatio: '3:2',
    description: 'Image haute résolution pour le zoom',
  },

  // Gallery Images (3:2)
  gallery: {
    width: 1536,
    height: 1024,
    aspectRatio: '3:2',
    description: 'Images de galerie produit',
  },

  // Template Preview (3:2)
  templatePreview: {
    width: 1536,
    height: 1024,
    aspectRatio: '3:2',
    description: 'Aperçu des templates',
  },

  // Social Media Share (16:9)
  ogImage: {
    width: 1200,
    height: 630,
    aspectRatio: '1.91:1',
    description: 'Image pour partage réseaux sociaux (Open Graph)',
  },

  // Square (for avatars, icons)
  square: {
    width: 500,
    height: 500,
    aspectRatio: '1:1',
    description: 'Format carré pour avatars et icônes',
  },
} as const;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Validate if image dimensions match the product format (1536x1024)
 */
export function isValidProductImageSize(dimensions: ImageDimensions): boolean {
  return (
    dimensions.width === IMAGE_FORMATS.product.width &&
    dimensions.height === IMAGE_FORMATS.product.height
  );
}

/**
 * Validate if image has correct aspect ratio (16:9)
 */
export function hasCorrectAspectRatio(dimensions: ImageDimensions): boolean {
  const aspectRatio = dimensions.width / dimensions.height;
  const targetRatio = IMAGE_FORMATS.product.width / IMAGE_FORMATS.product.height;
  const tolerance = 0.01; // 1% tolerance

  return Math.abs(aspectRatio - targetRatio) < tolerance;
}

/**
 * Get recommended dimensions for a given format
 */
export function getRecommendedDimensions(format: keyof typeof IMAGE_FORMATS) {
  return IMAGE_FORMATS[format];
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
export function calculateDimensions(
  currentWidth: number,
  currentHeight: number,
  targetFormat: keyof typeof IMAGE_FORMATS
): ImageDimensions {
  const target = IMAGE_FORMATS[targetFormat];
  const currentRatio = currentWidth / currentHeight;
  const targetRatio = target.width / target.height;

  if (currentRatio > targetRatio) {
    // Image is wider - fit to width
    return {
      width: target.width,
      height: Math.round(target.width / currentRatio),
    };
  } else {
    // Image is taller - fit to height
    return {
      width: Math.round(target.height * currentRatio),
      height: target.height,
    };
  }
}

// ============================================================================
// FILE SIZE LIMITS
// ============================================================================

export const IMAGE_FILE_LIMITS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFileSizeMB: 5,
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  recommendedFormat: 'image/webp',
} as const;

// ============================================================================
// UPLOAD GUIDELINES
// ============================================================================

export const IMAGE_UPLOAD_GUIDELINES = {
  product: {
    dimensions: '1536x1024 pixels',
    aspectRatio: '3:2',
    format: 'JPEG, PNG, ou WebP',
    maxSize: '5MB',
    recommendations: [
      'Utilisez des images haute qualité',
      'Fond blanc ou transparent recommandé',
      "Produit centré dans l'image",
      'Éclairage uniforme',
      'Plusieurs angles si possible',
    ],
  },
  thumbnail: {
    dimensions: '640x360 pixels',
    aspectRatio: '16:9',
    format: 'JPEG ou WebP',
    maxSize: '1MB',
    recommendations: ['Image claire et nette', 'Produit bien visible', 'Contraste élevé'],
  },
} as const;

// ============================================================================
// EXPORT
// ============================================================================

export default IMAGE_FORMATS;






