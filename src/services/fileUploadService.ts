/**
 * Service centralisé pour l'upload de fichiers vers Supabase Storage
 * Extrait de useFileUpload.ts pour réduire la taille du hook
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { validateFile } from '@/utils/fileValidation';
import imageCompression from 'browser-image-compression';
import { detectMediaType } from '@/utils/media-detection';

// ─── Types ───────────────────────────────────────────────────

export interface UploadConfig {
  bucket?: string;
  folder: string;
  maxSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (progress: number) => void;
  compressImages?: boolean;
  compressionOptions?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
  };
}

export interface UploadResult {
  path: string;
  publicUrl: string;
  signedUrl?: string | null;
  fileName: string;
  mimeType: string;
  size: number;
}

// ─── Helpers ─────────────────────────────────────────────────

export async function compressImageIfNeeded(
  file: File,
  options: { maxSizeMB?: number; maxWidthOrHeight?: number } = {}
): Promise<File> {
  const mediaType = detectMediaType(file.name, file.type);
  if (mediaType !== 'image') return file;

  const { maxSizeMB = 1, maxWidthOrHeight = 1920 } = options;

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: file.type,
    });

    if (import.meta.env.DEV) {
      const reduction = ((1 - compressed.size / file.size) * 100).toFixed(1);
      logger.info('Image compressed', {
        fileName: file.name,
        originalSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        compressedSize: `${(compressed.size / 1024 / 1024).toFixed(2)}MB`,
        reduction: `${reduction}%`,
      });
    }

    return compressed;
  } catch {
    logger.warn('Image compression failed, using original', { fileName: file.name });
    return file;
  }
}

export function generateUniqueFileName(originalName: string): string {
  const fileExt = originalName.split('.').pop() || '';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}.${fileExt}`;
}

async function ensureAuthenticated() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!user || error) {
    throw new Error('Vous devez être connecté pour uploader des fichiers.');
  }
  return user;
}

async function getSessionToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    throw new Error('Non authentifié. Veuillez vous reconnecter.');
  }
  return session.access_token;
}

// ─── Core upload via XHR ─────────────────────────────────────

async function uploadViaXHR(
  bucket: string,
  filePath: string,
  file: File | Blob,
  contentType: string,
  accessToken: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const uploadUrl = `${supabase.supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(40 + (e.loaded / e.total) * 30);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.path || filePath);
        } catch {
          resolve(filePath);
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || error.error || `Erreur upload: ${xhr.status}`));
        } catch {
          reject(new Error(`Erreur upload: ${xhr.statusText} (${xhr.status})`));
        }
      }
    });

    xhr.addEventListener('error', () => reject(new Error("Erreur réseau lors de l'upload")));
    xhr.addEventListener('abort', () => reject(new Error('Upload annulé')));

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', '3600');
    xhr.send(file);
  });
}

// ─── Verification ────────────────────────────────────────────

async function verifyUploadedFile(
  bucket: string,
  filePath: string,
  expectedContentType: string
): Promise<{ verified: boolean; isJson: boolean }> {
  const pathParts = filePath.split('/');
  const folderPath = pathParts.slice(0, -1).join('/') || '';
  const fileName = pathParts[pathParts.length - 1];

  // Retry list() up to 3 times
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: fileList, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, { limit: 100, search: fileName });

    if (error) {
      logger.warn('Cannot verify file after upload', { error: error.message });
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return { verified: false, isJson: false };
    }

    const found = fileList?.find(f => f.name === fileName);
    if (!found) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return { verified: false, isJson: false };
    }

    const uploadedMime = found.metadata?.mimetype || found.metadata?.contentType;
    if (uploadedMime === 'application/json') {
      // File stored as JSON — RLS issue
      try {
        await supabase.storage.from(bucket).remove([filePath]);
      } catch { /* best effort cleanup */ }
      return { verified: false, isJson: true };
    }

    return { verified: true, isJson: false };
  }

  return { verified: false, isJson: false };
}

// ─── Public API ──────────────────────────────────────────────

export async function uploadSingleFileToStorage(
  file: File,
  config: UploadConfig
): Promise<UploadResult> {
  const {
    bucket = 'attachments',
    folder,
    maxRetries = 3,
    retryDelay = 1000,
    onProgress,
  } = config;

  // Validate
  const validation = validateFile(file, { maxSize: config.maxSize });
  if (!validation.valid) {
    throw new Error(validation.error || 'Fichier invalide');
  }

  // Compress images
  let fileToUpload: File | Blob = file;
  if (config.compressImages !== false) {
    const opts = config.compressionOptions || {};
    fileToUpload = await compressImageIfNeeded(file, {
      maxSizeMB: opts.maxSizeMB || 1,
      maxWidthOrHeight: opts.maxWidthOrHeight || 1920,
    });
    onProgress?.(20);
  }

  const contentType = validation.detectedMimeType || fileToUpload.type || file.type || 'application/octet-stream';
  
  if (fileToUpload.size === 0) {
    throw new Error('File is empty (0 bytes)');
  }

  // Ensure correct MIME on the Blob/File
  if (fileToUpload instanceof File && fileToUpload.type !== contentType) {
    fileToUpload = new File([fileToUpload], fileToUpload.name, {
      type: contentType,
      lastModified: fileToUpload.lastModified,
    });
  }

  // Auth
  await ensureAuthenticated();
  const accessToken = await getSessionToken();

  // Generate path
  const fileName = generateUniqueFileName(file.name);
  const filePath = folder.endsWith('/') ? `${folder}${fileName}` : `${folder}/${fileName}`;

  // Upload with retries
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      onProgress?.(30);

      const uploadedPath = await uploadViaXHR(
        bucket, filePath, fileToUpload, contentType, accessToken, onProgress
      );

      // Wait for propagation
      await new Promise(r => setTimeout(r, 1000));

      // Verify
      const { verified, isJson } = await verifyUploadedFile(bucket, uploadedPath, contentType);

      if (isJson) {
        throw Object.assign(
          new Error('Le fichier a été uploadé comme JSON — vérifiez les politiques RLS du bucket.'),
          { isRLSError: true, skipRetry: true }
        );
      }

      if (!verified) {
        logger.warn('File upload not verified but continuing', { path: uploadedPath });
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(uploadedPath);

      onProgress?.(100);

      return {
        path: uploadedPath,
        publicUrl: urlData.publicUrl,
        signedUrl: null,
        fileName: file.name,
        mimeType: contentType,
        size: fileToUpload.size,
      };
    } catch (error: unknown) {
      const err = error as Error & { isRLSError?: boolean; skipRetry?: boolean };
      if (err.isRLSError || err.skipRetry) throw err;

      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
        continue;
      }
    }
  }

  throw lastError || new Error('Upload failed after retries');
}

/**
 * Standalone upload function (can be used without the hook)
 */
export const uploadFileToStorage = uploadSingleFileToStorage;
