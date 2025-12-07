/**
 * Utilitaires pour les opérations sur les fichiers
 * Fournit des fonctions réutilisables pour gérer les fichiers
 */

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified?: number;
}

export type FileSizeUnit = 'B' | 'KB' | 'MB' | 'GB' | 'TB';

export interface FormattedFileSize {
  value: number;
  unit: FileSizeUnit;
  formatted: string;
}

/**
 * Formate la taille d'un fichier en octets vers une unité lisible
 */
export function formatFileSize(
  bytes: number,
  decimals: number = 2
): FormattedFileSize {
  if (bytes === 0) {
    return { value: 0, unit: 'B', formatted: '0 B' };
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes: FileSizeUnit[] = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  const unit = sizes[i];

  return {
    value,
    unit,
    formatted: `${value} ${unit}`,
  };
}

/**
 * Convertit une taille formatée en octets
 */
export function parseFileSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
  if (!match) {
    throw new Error(`Invalid file size format: ${size}`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase() as FileSizeUnit;

  const multipliers: Record<FileSizeUnit, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  return value * multipliers[unit];
}

/**
 * Obtient l'extension d'un fichier
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Obtient le nom du fichier sans extension
 */
export function getFileNameWithoutExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

/**
 * Vérifie si un fichier est d'un type spécifique
 */
export function isFileType(file: File | string, types: string[]): boolean {
  const fileType = typeof file === 'string' ? file : file.type || getFileExtension(file.name);
  return types.some((type) => {
    if (type.includes('*')) {
      const pattern = type.replace('*', '.*');
      return new RegExp(pattern, 'i').test(fileType);
    }
    return fileType.toLowerCase().includes(type.toLowerCase());
  });
}

/**
 * Vérifie si un fichier est une image
 */
export function isImageFile(file: File | string): boolean {
  return isFileType(file, ['image/*', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);
}

/**
 * Vérifie si un fichier est une vidéo
 */
export function isVideoFile(file: File | string): boolean {
  return isFileType(file, ['video/*', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']);
}

/**
 * Vérifie si un fichier est un audio
 */
export function isAudioFile(file: File | string): boolean {
  return isFileType(file, ['audio/*', 'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a']);
}

/**
 * Vérifie si un fichier est un document
 */
export function isDocumentFile(file: File | string): boolean {
  return isFileType(file, [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'txt',
  ]);
}

/**
 * Télécharge un fichier depuis une URL ou un Blob
 */
export async function downloadFile(
  source: string | Blob,
  filename: string
): Promise<void> {
  let url: string;
  let shouldRevoke = false;

  if (typeof source === 'string') {
    url = source;
  } else {
    url = URL.createObjectURL(source);
    shouldRevoke = true;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  if (shouldRevoke) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Lit un fichier comme texte
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Lit un fichier comme Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Lit un fichier comme ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Crée un Blob à partir d'une chaîne
 */
export function createBlobFromString(
  content: string,
  mimeType: string = 'text/plain'
): Blob {
  return new Blob([content], { type: mimeType });
}

/**
 * Crée un fichier à partir d'un Blob
 */
export function createFileFromBlob(
  blob: Blob,
  filename: string,
  lastModified: number = Date.now()
): File {
  return new File([blob], filename, {
    type: blob.type,
    lastModified,
  });
}

/**
 * Valide la taille d'un fichier
 */
export function validateFileSize(
  file: File,
  maxSize: number
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const maxSizeFormatted = formatFileSize(maxSize);
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSizeFormatted.formatted}`,
    };
  }
  return { valid: true };
}

/**
 * Valide le type d'un fichier
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!isFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types autorisés: ${allowedTypes.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Obtient les informations d'un fichier
 */
export function getFileInfo(file: File): FileInfo {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}

/**
 * Génère un nom de fichier unique
 */
export function generateUniqueFileName(
  originalName: string,
  prefix?: string
): string {
  const extension = getFileExtension(originalName);
  const nameWithoutExt = getFileNameWithoutExtension(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const prefixPart = prefix ? `${prefix}-` : '';
  const extPart = extension ? `.${extension}` : '';

  return `${prefixPart}${nameWithoutExt}-${timestamp}-${random}${extPart}`;
}

