/**
 * 📸 IMAGE UPLOAD HELPER COMPONENT
 * Helper component for uploading images with dimension validation
 * 
 * Standard: 1280x720 pixels (16:9)
 */

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { IMAGE_FORMATS, IMAGE_FILE_LIMITS } from '@/config/image-formats';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

// ============================================================================
// IMAGE REQUIREMENTS DISPLAY
// ============================================================================

interface ImageRequirementsProps {
  format?: keyof typeof IMAGE_FORMATS;
  showAllFormats?: boolean;
}

export function ImageRequirements({ 
  format = 'product',
  showAllFormats = false 
}: ImageRequirementsProps) {
  const formatInfo = IMAGE_FORMATS[format];

  if (showAllFormats) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Formats d'images acceptés</h3>
        <div className="grid gap-3">
          {Object.entries(IMAGE_FORMATS).map(([key, info]) => (
            <div key={key} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium capitalize">{key}</span>
                <Badge variant="outline">{info.aspectRatio}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {info.description}
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {info.width} x {info.height} px
              </code>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="space-y-2">
        <div className="flex items-center gap-2">
          <strong>Format requis:</strong>
          <Badge>{formatInfo.width} x {formatInfo.height} px</Badge>
          <Badge variant="outline">{formatInfo.aspectRatio}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>{formatInfo.description}</p>
          <p className="mt-1">
            Formats acceptés: {IMAGE_FILE_LIMITS.allowedExtensions.join(', ')} 
            • Taille max: {IMAGE_FILE_LIMITS.maxFileSizeMB}MB
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// IMAGE VALIDATION RESULT
// ============================================================================

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  format?: string;
}

interface ImageValidationDisplayProps {
  result: ImageValidationResult;
}

export function ImageValidationDisplay({ result }: ImageValidationDisplayProps) {
  if (result.isValid) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <strong className="text-green-900">Image valide ✓</strong>
          {result.dimensions && (
            <p className="text-sm text-green-700 mt-1">
              {result.dimensions.width} x {result.dimensions.height} px
              {result.fileSize && ` • ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`}
            </p>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      {result.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erreurs:</strong>
            <ul className="list-disc list-inside mt-1">
              {result.errors.map((error, i) => (
                <li key={i} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {result.warnings.length > 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Avertissements:</strong>
            <ul className="list-disc list-inside mt-1">
              {result.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-muted-foreground">{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// ============================================================================
// IMAGE VALIDATION FUNCTION
// ============================================================================

export async function validateImage(
  file: File,
  targetFormat: keyof typeof IMAGE_FORMATS = 'product'
): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const targetDimensions = IMAGE_FORMATS[targetFormat];

  // Check file type
  if (!IMAGE_FILE_LIMITS.allowedFormats.includes(file.type)) {
    errors.push(
      `Format non supporté. Utilisez: ${IMAGE_FILE_LIMITS.allowedExtensions.join(', ')}`
    );
  }

  // Check file size
  if (file.size > IMAGE_FILE_LIMITS.maxFileSize) {
    errors.push(
      `Fichier trop lourd (${(file.size / 1024 / 1024).toFixed(2)}MB). Max: ${IMAGE_FILE_LIMITS.maxFileSizeMB}MB`
    );
  }

  // Load image to check dimensions
  try {
    const dimensions = await getImageDimensions(file);

    // Check exact dimensions
    if (
      dimensions.width !== targetDimensions.width ||
      dimensions.height !== targetDimensions.height
    ) {
      errors.push(
        `Dimensions incorrectes (${dimensions.width}x${dimensions.height}). ` +
        `Requis: ${targetDimensions.width}x${targetDimensions.height} pixels`
      );
    }

    // Check aspect ratio
    const imageRatio = dimensions.width / dimensions.height;
    const targetRatio = targetDimensions.width / targetDimensions.height;
    
    if (Math.abs(imageRatio - targetRatio) > 0.01) {
      warnings.push(
        `Ratio d'aspect légèrement différent. Attendu: ${targetDimensions.aspectRatio}`
      );
    }

    // Check if image is too small
    if (dimensions.width < targetDimensions.width || dimensions.height < targetDimensions.height) {
      errors.push(
        `Image trop petite. Minimum requis: ${targetDimensions.width}x${targetDimensions.height} pixels`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      dimensions,
      fileSize: file.size,
      format: file.type,
    };
  } catch (error) {
    errors.push('Impossible de lire les dimensions de l\'image');
    return {
      isValid: false,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// ============================================================================
// QUICK SPECS DISPLAY
// ============================================================================

export function ImageSpecsQuick() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline">1280 x 720 px</Badge>
      <span>•</span>
      <Badge variant="outline">16:9</Badge>
      <span>•</span>
      <span>Max 5MB</span>
      <span>•</span>
      <span>JPEG, PNG, WebP</span>
    </div>
  );
}

export default {
  ImageRequirements,
  ImageValidationDisplay,
  ImageSpecsQuick,
  validateImage,
};

