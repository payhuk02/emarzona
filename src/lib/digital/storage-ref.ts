/**
 * Parse/normalize digital file references stored in `digital_product_files.file_url`.
 * Supports Supabase Storage paths, signed/public storage URLs, and external URLs.
 */

export const DEFAULT_DIGITAL_FILES_BUCKET = 'products';

export interface ParsedStorageRef {
  kind: 'storage';
  bucket: string;
  path: string;
}

export interface ParsedExternalRef {
  kind: 'external';
  url: string;
}

export type ParsedFileRef = ParsedStorageRef | ParsedExternalRef;

const STORAGE_OBJECT_PREFIX = '/storage/v1/object/';

/**
 * Canonical storage reference persisted in download tokens: `bucket:path/to/file`
 */
export function toCanonicalStorageRef(bucket: string, path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${bucket}:${normalizedPath}`;
}

export function parseCanonicalStorageRef(value: string): ParsedStorageRef | null {
  const trimmed = value.trim();
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex <= 0) return null;

  const bucket = trimmed.slice(0, colonIndex).trim();
  const path = trimmed.slice(colonIndex + 1).trim();
  if (!bucket || !path) return null;

  return { kind: 'storage', bucket, path };
}

function extractStorageFromSupabaseUrl(url: URL): ParsedStorageRef | null {
  const pathname = decodeURIComponent(url.pathname);
  const idx = pathname.indexOf(STORAGE_OBJECT_PREFIX);
  if (idx === -1) return null;

  const remainder = pathname.slice(idx + STORAGE_OBJECT_PREFIX.length);
  const segments = remainder.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const accessMode = segments[0];
  if (accessMode !== 'public' && accessMode !== 'sign' && accessMode !== 'authenticated') {
    return null;
  }

  const bucket = segments[1];
  const path = segments.slice(2).join('/');
  if (!bucket || !path) return null;

  return { kind: 'storage', bucket, path };
}

/**
 * Normalize any file_url value into canonical `bucket:path` or external https URL.
 */
export function normalizeFileStorageRef(fileUrl: string): string {
  const trimmed = fileUrl.trim();
  if (!trimmed) return trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const storageRef = extractStorageFromSupabaseUrl(url);
      if (storageRef) {
        return toCanonicalStorageRef(storageRef.bucket, storageRef.path);
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  const canonical = parseCanonicalStorageRef(trimmed);
  if (canonical) {
    return toCanonicalStorageRef(canonical.bucket, canonical.path);
  }

  return toCanonicalStorageRef(DEFAULT_DIGITAL_FILES_BUCKET, trimmed);
}

export function parseFileRef(fileUrl: string): ParsedFileRef {
  const normalized = normalizeFileStorageRef(fileUrl);

  const canonical = parseCanonicalStorageRef(normalized);
  if (canonical) return canonical;

  if (/^https?:\/\//i.test(normalized)) {
    return { kind: 'external', url: normalized };
  }

  return {
    kind: 'storage',
    bucket: DEFAULT_DIGITAL_FILES_BUCKET,
    path: normalized.replace(/^\/+/, ''),
  };
}

export function fileNameFromRef(fileUrl: string): string {
  const ref = parseFileRef(fileUrl);
  if (ref.kind === 'external') {
    const segment = ref.url.split('/').pop()?.split('?')[0];
    return segment ? decodeURIComponent(segment) : 'download';
  }
  const segment = ref.path.split('/').pop()?.split('?')[0];
  return segment ? decodeURIComponent(segment) : 'download';
}
