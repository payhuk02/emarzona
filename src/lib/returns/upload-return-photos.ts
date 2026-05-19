/**
 * Upload des photos de demande de retour vers Supabase Storage (bucket attachments).
 */

import { uploadFileToStorage } from '@/services/fileUploadService';
import { logger } from '@/lib/logger';

const MAX_PHOTOS = 5;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadReturnPhotos(
  photos: File[],
  userId: string,
  orderId: string
): Promise<string[]> {
  if (photos.length === 0) return [];
  if (photos.length > MAX_PHOTOS) {
    throw new Error(`Maximum ${MAX_PHOTOS} photos autorisées`);
  }

  const folder = `returns/${userId}/${orderId}`;
  const urls: string[] = [];

  for (const photo of photos) {
    try {
      const result = await uploadFileToStorage(photo, {
        bucket: 'attachments',
        folder,
        maxSize: MAX_SIZE_BYTES,
        compressImages: true,
        compressionOptions: { maxSizeMB: 1, maxWidthOrHeight: 1920 },
      });
      urls.push(result.publicUrl);
    } catch (error) {
      logger.error('Return photo upload failed', { error, orderId, fileName: photo.name });
      throw error instanceof Error ? error : new Error('Échec du téléversement des photos');
    }
  }

  return urls;
}
