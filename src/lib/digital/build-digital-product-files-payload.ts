import type { DigitalProductDownloadableFile } from '@/types/digital-product-form';

export type DigitalProductFileRpcPayload = {
  name: string;
  file_url: string;
  file_type: string;
  file_size_mb: number;
  order_index: number;
  is_main: boolean;
  is_preview: boolean;
  requires_purchase: boolean;
  version: string;
};

function inferFileType(url: string, explicit?: string): string {
  if (explicit?.trim()) return explicit.trim();
  const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  return ext || 'unknown';
}

function inferFileName(url: string, fallback = 'Fichier principal'): string {
  try {
    const path = new URL(url, 'https://placeholder.local').pathname;
    const base = path.split('/').pop();
    if (base) return decodeURIComponent(base);
  } catch {
    // ignore malformed URLs
  }
  return fallback;
}

/**
 * Builds RPC/file-table rows for digital products.
 * When only main_file_url is set (no downloadable_files), synthesizes the main row
 * so token-based downloads work via digital_product_files.
 */
export function buildDigitalProductFilesPayload(input: {
  main_file_url?: string | null;
  main_file_version?: string | null;
  downloadable_files?: DigitalProductDownloadableFile[] | null;
  mainFileMeta?: { name?: string; size?: number; type?: string } | null;
}): DigitalProductFileRpcPayload[] {
  const downloadable = input.downloadable_files ?? [];

  if (downloadable.length > 0) {
    return downloadable.map((file, index) => ({
      name: file.name,
      file_url: file.url,
      file_type: file.format || inferFileType(file.url, file.format),
      file_size_mb: (file.size ?? 0) / (1024 * 1024),
      order_index: index,
      is_main: file.is_main ?? index === 0,
      is_preview: file.is_preview || false,
      requires_purchase: file.requires_purchase !== false && !file.is_preview,
      version: file.version || '1.0',
    }));
  }

  const mainUrl = input.main_file_url?.trim();
  if (!mainUrl) return [];

  const mainMeta = input.mainFileMeta;
  return [
    {
      name: mainMeta?.name || inferFileName(mainUrl),
      file_url: mainUrl,
      file_type: inferFileType(mainUrl, mainMeta?.type),
      file_size_mb: (mainMeta?.size ?? 0) / (1024 * 1024),
      order_index: 0,
      is_main: true,
      is_preview: false,
      requires_purchase: true,
      version: input.main_file_version || '1.0',
    },
  ];
}
