/**
 * Canonical refs for private `attachments` bucket objects.
 */

export const ATTACHMENTS_BUCKET = 'attachments';

export function toAttachmentStorageRef(path: string): string {
  const clean = path.replace(/^attachments\//, '').replace(/^\/+/, '');
  return `${ATTACHMENTS_BUCKET}:${clean}`;
}

export function parseAttachmentStorageRef(ref: string): { bucket: string; path: string } | null {
  if (!ref?.includes(':')) return null;
  const [bucket, ...rest] = ref.split(':');
  const path = rest.join(':');
  if (bucket !== ATTACHMENTS_BUCKET || !path) return null;
  return { bucket, path };
}

export function extractAttachmentPath(fileUrlOrRef: string): string | null {
  const parsed = parseAttachmentStorageRef(fileUrlOrRef);
  if (parsed) return parsed.path;

  const publicMatch = fileUrlOrRef.match(/\/storage\/v1\/object\/public\/attachments\/(.+)$/);
  if (publicMatch) return decodeURIComponent(publicMatch[1]);

  const signMatch = fileUrlOrRef.match(/\/storage\/v1\/object\/sign\/attachments\/(.+?)(\?|$)/);
  if (signMatch) return decodeURIComponent(signMatch[1]);

  if (!fileUrlOrRef.startsWith('http') && !fileUrlOrRef.includes('://')) {
    return fileUrlOrRef.replace(/^attachments\//, '').replace(/^\/+/, '');
  }

  return null;
}
