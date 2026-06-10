import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import {
  ATTACHMENTS_BUCKET,
  extractAttachmentPath,
  parseAttachmentStorageRef,
} from './storage-ref';

const DEFAULT_TTL_SECONDS = 3600;

export async function resolveAttachmentUrl(
  fileUrlOrRef: string,
  expiresIn = DEFAULT_TTL_SECONDS
): Promise<string | null> {
  if (!fileUrlOrRef) return null;

  if (fileUrlOrRef.startsWith('http') && !fileUrlOrRef.includes('/attachments/')) {
    return fileUrlOrRef;
  }

  const path = extractAttachmentPath(fileUrlOrRef);
  if (!path) return fileUrlOrRef.startsWith('http') ? fileUrlOrRef : null;

  const { data, error } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    logger.warn('Failed to sign attachment URL', { error, path });
    return fileUrlOrRef.startsWith('http') ? fileUrlOrRef : null;
  }

  return data.signedUrl;
}

export function isAttachmentStorageRef(value: string): boolean {
  return parseAttachmentStorageRef(value) !== null;
}
