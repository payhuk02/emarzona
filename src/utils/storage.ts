/**
 * Utilitaires pour la gestion des URLs de stockage Supabase
 */

// ✅ PHASE 2: Import logger pour remplacer console.*
import { logger } from '@/lib/logger';

/**
 * Corrige et normalise une URL de fichier Supabase Storage
 *
 * @param fileUrl - URL originale du fichier
 * @param storagePath - Chemin de stockage relatif (optionnel)
 * @returns URL corrigée et normalisée
 *
 * @example
 * getCorrectedFileUrl(
 *   'https://xxx.supabase.co/storage/v1/object/public/attachments/vendor-message-attachments/file.png',
 *   'vendor-message-attachments/file.png'
 * )
 */
export function getCorrectedFileUrl(fileUrl: string, storagePath?: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    // ✅ PHASE 2: Remplacer console.error par logger
    logger.error('VITE_SUPABASE_URL not defined');
    return fileUrl;
  }

  // Nettoyer l'URL de base (supprimer le slash final s'il existe)
  const baseUrl = supabaseUrl.replace(/\/+$/, '');

  // Si l'URL est déjà valide et contient le bon format, la décoder et la reconstruire
  if (fileUrl && fileUrl.includes('/storage/v1/object/public/attachments/')) {
    // Extraire le chemin depuis l'URL
    const match = fileUrl.match(/\/storage\/v1\/object\/public\/attachments\/(.+)$/);
    if (match) {
      const extractedPath = decodeURIComponent(match[1]);
      // Reconstruire avec encodage correct
      const encodedPath = extractedPath
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
      const correctedUrl = `${baseUrl}/storage/v1/object/public/attachments/${encodedPath}`;
      return correctedUrl;
    }
  }

  // Utiliser storage_path si disponible
  if (storagePath) {
    const cleanPath = storagePath
      .replace(/^attachments\//, '')
      .replace(/^\/attachments\//, '')
      .replace(/^storage\/v1\/object\/public\/attachments\//, '')
      .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/attachments\//, '');

    const encodedPath = cleanPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    // S'assurer qu'il n'y a pas de double slash
    const correctedUrl = `${baseUrl}/storage/v1/object/public/attachments/${encodedPath}`.replace(
      /([^:]\/)\/+/g,
      '$1'
    );
    return correctedUrl;
  }

  // Si fileUrl est un chemin relatif, l'utiliser directement
  if (fileUrl && !fileUrl.startsWith('http')) {
    const cleanPath = fileUrl.replace(/^attachments\//, '').replace(/^\/attachments\//, '');

    const encodedPath = cleanPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    // S'assurer qu'il n'y a pas de double slash (sauf après le protocole)
    const correctedUrl = `${baseUrl}/storage/v1/object/public/attachments/${encodedPath}`.replace(
      /([^:]\/)\/+/g,
      '$1'
    );
    return correctedUrl;
  }

  // Fallback : retourner l'URL originale
  return fileUrl;
}

/**
 * Extrait le chemin de stockage depuis une URL Supabase
 *
 * @param fileUrl - URL complète du fichier
 * @returns Chemin relatif dans le bucket, ou null si l'URL n'est pas valide
 */
export function extractStoragePath(fileUrl: string): string | null {
  if (!fileUrl) return null;

  // Format: https://xxx.supabase.co/storage/v1/object/public/attachments/path/to/file.png
  const match = fileUrl.match(/\/storage\/v1\/object\/public\/attachments\/(.+)$/);
  if (match) {
    return decodeURIComponent(match[1]);
  }

  // Format: https://xxx.supabase.co/storage/v1/object/sign/attachments/path/to/file.png?token=...
  const signMatch = fileUrl.match(/\/storage\/v1\/object\/sign\/attachments\/(.+?)(\?|$)/);
  if (signMatch) {
    return decodeURIComponent(signMatch[1]);
  }

  return null;
}

/**
 * Vérifie si une URL est une URL Supabase Storage valide
 */
export function isValidSupabaseStorageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;

  return (
    url.includes('/storage/v1/object/public/attachments/') ||
    url.includes('/storage/v1/object/sign/attachments/')
  );
}
