/**
 * Validation centralisée des fichiers pour le système de messaging
 * Date: 1 Février 2025
 * 
 * Centralise toute la logique de validation des fichiers (taille, type, sécurité)
 */

import { detectMediaType } from './media-detection';
import { logger } from '@/lib/logger';

/**
 * Configuration par défaut pour la validation des fichiers
 */
export const FILE_VALIDATION_CONFIG = {
  /** Taille maximale par défaut (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  
  /** Types MIME autorisés pour les messages */
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Vidéos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Documents
    'application/pdf',
    'text/plain',
    // Documents Office (optionnel)
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ] as const,
  
  /** Extensions autorisées (sécurité supplémentaire) */
  ALLOWED_EXTENSIONS: [
    // Images
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    // Vidéos
    '.mp4', '.webm', '.mov',
    // Documents
    '.pdf', '.txt',
    // Documents Office
    '.doc', '.docx', '.xls', '.xlsx',
  ] as const,
  
  /** Extensions dangereuses interdites */
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar',
    '.sh', '.ps1', '.app', '.dmg', '.deb', '.rpm', '.msi',
  ] as const,
} as const;

/**
 * Résultat de la validation d'un fichier
 */
export interface FileValidationResult {
  /** Le fichier est valide */
  valid: boolean;
  /** Message d'erreur si invalide */
  error?: string;
  /** Type de média détecté */
  mediaType?: 'image' | 'video' | 'file';
  /** Type MIME détecté/corrigé */
  detectedMimeType?: string;
}

/**
 * Options de validation personnalisées
 */
export interface FileValidationOptions {
  /** Taille maximale en bytes (défaut: 10MB) */
  maxSize?: number;
  /** Types MIME autorisés (défaut: FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES) */
  allowedMimeTypes?: readonly string[];
  /** Extensions autorisées (défaut: FILE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS) */
  allowedExtensions?: readonly string[];
  /** Autoriser les types non listés (défaut: false) */
  allowUnknownTypes?: boolean;
}

/**
 * Valide un fichier selon les règles configurées
 * 
 * @param file - Le fichier à valider
 * @param options - Options de validation personnalisées
 * @returns Résultat de la validation
 * 
 * @example
 * const result = validateFile(file);
 * if (!result.valid) {
 *   logger.error('File validation failed', { error: result.error });
 * }
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxSize = FILE_VALIDATION_CONFIG.MAX_FILE_SIZE,
    allowedMimeTypes = FILE_VALIDATION_CONFIG.ALLOWED_MIME_TYPES,
    allowedExtensions = FILE_VALIDATION_CONFIG.ALLOWED_EXTENSIONS,
    allowUnknownTypes = false,
  } = options;

  // 1. Vérifier que le fichier existe
  if (!file || !file.name) {
    return {
      valid: false,
      error: 'Fichier invalide ou manquant',
    };
  }

  // 2. Vérifier l'extension du fichier
  const fileExtension = getFileExtension(file.name).toLowerCase();
  
  // Vérifier les extensions dangereuses
  if (FILE_VALIDATION_CONFIG.DANGEROUS_EXTENSIONS.includes(fileExtension as string)) {
    return {
      valid: false,
      error: `Extension de fichier interdite: ${fileExtension}. Ce type de fichier peut être dangereux.`,
    };
  }

  // Vérifier les extensions autorisées (si pas allowUnknownTypes)
  if (!allowUnknownTypes && !allowedExtensions.includes(fileExtension as string)) {
    return {
      valid: false,
      error: `Extension de fichier non autorisée: ${fileExtension}. Extensions autorisées: ${allowedExtensions.join(', ')}`,
    };
  }

  // 3. Vérifier la taille du fichier
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB}MB, actuel: ${fileSizeMB}MB`,
    };
  }

  // 4. Vérifier le type MIME
  let  detectedMimeType= file.type;
  
  // Si le type MIME est vide ou incorrect, essayer de le détecter depuis l'extension
  if (!detectedMimeType || detectedMimeType === 'application/octet-stream' || detectedMimeType === '') {
    detectedMimeType = detectMimeTypeFromExtension(fileExtension);
  }

  // Vérifier que le type MIME est autorisé (si pas allowUnknownTypes)
  if (!allowUnknownTypes && !allowedMimeTypes.includes(detectedMimeType as string)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé: ${detectedMimeType || 'inconnu'}. Types autorisés: ${allowedMimeTypes.join(', ')}`,
    };
  }

  // 5. Détecter le type de média
  const mediaType = detectMediaType(file.name, detectedMimeType);

  // 6. Vérifications supplémentaires
  // Fichier trop petit (potentiellement vide ou corrompu)
  if (file.size < 100) {
    return {
      valid: false,
      error: 'Fichier trop petit, potentiellement vide ou corrompu',
    };
  }

  // Nom de fichier trop long
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'Nom de fichier trop long (maximum 255 caractères)',
    };
  }

  // Tout est valide
  return {
    valid: true,
    mediaType,
    detectedMimeType,
  };
}

/**
 * Valide plusieurs fichiers en une fois
 * 
 * @param files - Tableau de fichiers à valider
 * @param options - Options de validation
 * @returns Résultats de validation pour chaque fichier
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions = {}
): FileValidationResult[] {
  return files.map(file => validateFile(file, options));
}

/**
 * Filtre les fichiers valides d'un tableau
 * 
 * @param files - Tableau de fichiers à filtrer
 * @param options - Options de validation
 * @returns Tableau des fichiers valides
 */
export function filterValidFiles(
  files: File[],
  options: FileValidationOptions = {}
): File[] {
  return files.filter(file => validateFile(file, options).valid);
}

/**
 * Obtient l'extension d'un fichier
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.substring(lastDot);
}

/**
 * Détecte le type MIME à partir de l'extension
 */
function detectMimeTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase();
  
  const  mimeTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    // Vidéos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.ogg': 'video/ogg',
    // Documents
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Formate la taille d'un fichier en format lisible
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}







