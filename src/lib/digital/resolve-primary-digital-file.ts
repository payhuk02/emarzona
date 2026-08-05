import type { DigitalProductDownloadableFile } from '@/types/digital-product-form';

/**
 * Returns the primary main file from wizard state.
 * Prefers explicit `is_main` rows over positional fallbacks.
 */
export function resolvePrimaryDigitalFile(
  downloadableFiles?: DigitalProductDownloadableFile[] | null
): DigitalProductDownloadableFile | undefined {
  if (!downloadableFiles?.length) return undefined;
  return downloadableFiles.find(file => file.is_main) ?? downloadableFiles[0];
}
