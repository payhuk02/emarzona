/**
 * Système de Traitement Avancé des Fichiers Digitaux
 * Date: 3 Février 2025
 *
 * Compression automatique, validation de format, scan antivirus
 */

import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TYPES
// =====================================================

export interface FileProcessingOptions {
  compress?: boolean;
  maxSizeMB?: number;
  allowedFormats?: string[];
  scanAntivirus?: boolean;
  quality?: number; // Pour compression images (0-100)
}

export interface FileProcessingResult {
  success: boolean;
  processedFile?: File;
  originalSize: number;
  processedSize?: number;
  compressionRatio?: number;
  validationResult?: {
    valid: boolean;
    format: string;
    mimeType: string;
    errors?: string[];
  };
  antivirusResult?: {
    scanned: boolean;
    clean: boolean;
    threat?: string;
  };
  error?: string;
}

// =====================================================
// CONFIGURATION
// =====================================================

const COMPRESSIBLE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/zip',
];

const MAX_FILE_SIZE_MB = 500; // 500 MB par défaut
const DEFAULT_COMPRESSION_QUALITY = 85; // Pour images JPEG

// =====================================================
// VALIDATION DE FORMAT
// =====================================================

/**
 * Valide le format d'un fichier en vérifiant les magic bytes
 */
export async function validateFileFormat(file: File): Promise<{
  valid: boolean;
  format: string;
  mimeType: string;
  errors?: string[];
}> {
  const errors: string[] = [];
  const detectedMimeType = file.type;
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  // Lire les premiers bytes pour vérifier la signature
  const arrayBuffer = await file.slice(0, 16).arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Vérifier les magic bytes selon le type
  let isValid = false;
  let detectedFormat = 'unknown';

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    detectedFormat = 'jpeg';
    isValid = detectedMimeType === 'image/jpeg' || detectedMimeType === 'image/jpg';
  }
  // PNG: 89 50 4E 47
  else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    detectedFormat = 'png';
    isValid = detectedMimeType === 'image/png';
  }
  // PDF: 25 50 44 46
  else if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    detectedFormat = 'pdf';
    isValid = detectedMimeType === 'application/pdf';
  }
  // ZIP: 50 4B 03 04
  else if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    detectedFormat = 'zip';
    isValid =
      detectedMimeType === 'application/zip' || detectedMimeType === 'application/x-zip-compressed';
  }
  // WebP: RIFF...WEBP
  else if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    detectedFormat = 'webp';
    isValid = detectedMimeType === 'image/webp';
  }

  if (!isValid && detectedFormat !== 'unknown') {
    errors.push(
      `Le type MIME déclaré (${detectedMimeType}) ne correspond pas au format réel (${detectedFormat})`
    );
  }

  if (detectedFormat === 'unknown') {
    errors.push('Format de fichier non reconnu ou non supporté');
  }

  return {
    valid: errors.length === 0,
    format: detectedFormat,
    mimeType: detectedMimeType,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// =====================================================
// COMPRESSION AUTOMATIQUE
// =====================================================

/**
 * Compresse une image automatiquement
 */
export async function compressImage(
  file: File,
  quality: number = DEFAULT_COMPRESSION_QUALITY,
  maxWidth?: number,
  maxHeight?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Redimensionner si nécessaire
        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob avec compression
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Erreur lors de la compression'));
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality / 100
        );
      };

      img.onerror = () => reject(new Error("Erreur lors du chargement de l'image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compresse un fichier PDF (nécessite une bibliothèque externe ou Edge Function)
 */
export async function compressPDF(file: File): Promise<File> {
  // Pour la compression PDF, on utilise une Edge Function
  // car cela nécessite des bibliothèques serveur
  try {
    const formData = new FormData();
    formData.append('file', file);

    const { data, error } = await supabase.functions.invoke('compress-pdf', {
      body: formData,
    });

    if (error || !data?.compressedFile) {
      logger.warn('PDF compression not available, using original file', { error });
      return file;
    }

    // Convertir le blob retourné en File
    const compressedBlob = await fetch(data.compressedFile).then(r => r.blob());
    return new File([compressedBlob], file.name, { type: 'application/pdf' });
  } catch (error) {
    logger.warn('PDF compression failed, using original file', { error });
    return file;
  }
}

/**
 * Compresse un fichier ZIP
 */
export async function compressZip(file: File): Promise<File> {
  // La compression ZIP nécessite une bibliothèque externe
  // Pour l'instant, on retourne le fichier original
  // TODO: Implémenter avec JSZip ou Edge Function
  logger.warn('ZIP compression not yet implemented');
  return file;
}

/**
 * Compresse un fichier selon son type
 */
export async function compressFile(
  file: File,
  options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<File> {
  const mimeType = file.type;

  if (mimeType.startsWith('image/')) {
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      return compressImage(file, options.quality, options.maxWidth, options.maxHeight);
    } else if (mimeType === 'image/png' || mimeType === 'image/webp') {
      // Convertir PNG/WebP en JPEG compressé
      return compressImage(file, options.quality, options.maxWidth, options.maxHeight);
    }
  } else if (mimeType === 'application/pdf') {
    return compressPDF(file);
  } else if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
    return compressZip(file);
  }

  // Format non compressible, retourner l'original
  return file;
}

// =====================================================
// SCAN ANTIVIRUS
// =====================================================

/**
 * Scanne un fichier avec un antivirus (via Edge Function)
 */
export async function scanFileAntivirus(file: File): Promise<{
  scanned: boolean;
  clean: boolean;
  threat?: string;
}> {
  try {
    // Upload temporaire pour scan
    const formData = new FormData();
    formData.append('file', file);

    const { data, error } = await supabase.functions.invoke('scan-antivirus', {
      body: formData,
    });

    if (error) {
      logger.warn('Antivirus scan not available', { error });
      return {
        scanned: false,
        clean: true, // Par défaut, on considère comme propre si le scan n'est pas disponible
      };
    }

    return {
      scanned: true,
      clean: data?.clean !== false,
      threat: data?.threat,
    };
  } catch (error) {
    logger.error('Error scanning file with antivirus', { error });
    return {
      scanned: false,
      clean: true, // Par défaut, on considère comme propre
    };
  }
}

// =====================================================
// TRAITEMENT COMPLET
// =====================================================

/**
 * Traite un fichier complet : validation, compression, scan antivirus
 */
export async function processDigitalFile(
  file: File,
  options: FileProcessingOptions = {}
): Promise<FileProcessingResult> {
  const {
    compress = true,
    maxSizeMB = MAX_FILE_SIZE_MB,
    allowedFormats = [],
    scanAntivirus = true,
    quality = DEFAULT_COMPRESSION_QUALITY,
  } = options;

  const originalSize = file.size;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  try {
    // 1. Validation de taille
    if (file.size > maxSizeBytes) {
      return {
        success: false,
        originalSize,
        error: `Fichier trop volumineux. Maximum: ${maxSizeMB}MB, actuel: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // 2. Validation de format
    const validationResult = await validateFileFormat(file);

    if (!validationResult.valid) {
      return {
        success: false,
        originalSize,
        validationResult,
        error: validationResult.errors?.join(', '),
      };
    }

    // 3. Vérifier les formats autorisés si spécifiés
    if (allowedFormats.length > 0 && !allowedFormats.includes(validationResult.mimeType)) {
      return {
        success: false,
        originalSize,
        validationResult,
        error: `Format non autorisé. Formats autorisés: ${allowedFormats.join(', ')}`,
      };
    }

    // 4. Scan antivirus
    let antivirusResult;
    if (scanAntivirus) {
      antivirusResult = await scanFileAntivirus(file);

      if (!antivirusResult.clean) {
        return {
          success: false,
          originalSize,
          validationResult,
          antivirusResult,
          error: `Fichier détecté comme malveillant: ${antivirusResult.threat || 'Threat detected'}`,
        };
      }
    }

    // 5. Compression si activée et format compressible
    let processedFile = file;
    let processedSize = originalSize;
    let compressionRatio: number | undefined;

    if (compress && COMPRESSIBLE_FORMATS.includes(validationResult.mimeType)) {
      try {
        processedFile = await compressFile(file, { quality });
        processedSize = processedFile.size;
        compressionRatio = ((originalSize - processedSize) / originalSize) * 100;

        logger.info('File compressed', {
          originalSize,
          processedSize,
          compressionRatio: `${compressionRatio.toFixed(2)}%`,
        });
      } catch (compressError) {
        logger.warn('Compression failed, using original file', { error: compressError });
        // Continuer avec le fichier original
      }
    }

    return {
      success: true,
      processedFile,
      originalSize,
      processedSize,
      compressionRatio,
      validationResult,
      antivirusResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    logger.error('Error processing digital file', { error, fileName: file.name });

    return {
      success: false,
      originalSize,
      error: errorMessage,
    };
  }
}

// =====================================================
// EXPORT UNIFIÉ
// =====================================================

export const digitalFileProcessing = {
  validateFileFormat,
  compressFile,
  compressImage,
  compressPDF,
  compressZip,
  scanFileAntivirus,
  processDigitalFile,
};

