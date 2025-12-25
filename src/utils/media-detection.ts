/**
 * Utilitaires pour la détection et la gestion des types de médias
 */

export type MediaType = 'image' | 'video' | 'file';

/**
 * Extensions de fichiers reconnues comme images
 */
export const IMAGE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  '.ico',
  '.heic',
  '.heif',
] as const;

/**
 * Extensions de fichiers reconnues comme vidéos
 */
export const VIDEO_EXTENSIONS = [
  '.mp4',
  '.webm',
  '.ogg',
  '.mov',
  '.avi',
  '.mkv',
  '.flv',
  '.wmv',
] as const;

/**
 * Types MIME reconnus comme images
 */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
  'image/x-icon',
  'image/heic',
  'image/heif',
] as const;

/**
 * Types MIME reconnus comme vidéos
 */
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/ogg',
] as const;

/**
 * Détecte le type de média à partir du nom de fichier et du type MIME
 * 
 * @param fileName - Nom du fichier (avec extension)
 * @param fileType - Type MIME du fichier
 * @returns Le type de média détecté ('image', 'video', ou 'file')
 * 
 * @example
 * detectMediaType('photo.jpg', 'image/jpeg') // 'image'
 * detectMediaType('video.mp4', 'video/mp4') // 'video'
 * detectMediaType('document.pdf', 'application/pdf') // 'file'
 */
export function detectMediaType(fileName: string, fileType: string): MediaType {
  const fileNameLower = (fileName || '').toLowerCase();
  const fileTypeLower = (fileType || '').toLowerCase();

  // Détection par extension (prioritaire, plus fiable)
  const isImageByExtension = IMAGE_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));
  const isVideoByExtension = VIDEO_EXTENSIONS.some(ext => fileNameLower.endsWith(ext));

  // Détection par type MIME (fallback)
  const isImageByMime = fileTypeLower.startsWith('image/') || 
    IMAGE_MIME_TYPES.some(mime => fileTypeLower === mime);
  const isVideoByMime = fileTypeLower.startsWith('video/') || 
    VIDEO_MIME_TYPES.some(mime => fileTypeLower === mime);

  // Priorité : extension > MIME
  // Si l'extension indique un type, l'utiliser en priorité
  if (isImageByExtension) {
    return 'image';
  }
  
  if (isVideoByExtension) {
    return 'video';
  }
  
  // Sinon, utiliser le MIME type comme fallback
  if (isImageByMime) {
    return 'image';
  }
  
  if (isVideoByMime) {
    return 'video';
  }

  return 'file';
}

/**
 * Vérifie si un fichier est une image
 */
export function isImage(fileName: string, fileType: string): boolean {
  return detectMediaType(fileName, fileType) === 'image';
}

/**
 * Vérifie si un fichier est une vidéo
 */
export function isVideo(fileName: string, fileType: string): boolean {
  return detectMediaType(fileName, fileType) === 'video';
}

/**
 * Vérifie si un fichier est un fichier générique (pas image ni vidéo)
 */
export function isFile(fileName: string, fileType: string): boolean {
  return detectMediaType(fileName, fileType) === 'file';
}
