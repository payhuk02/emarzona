/**
 * Upload unifié des images catalogue → bucket `product-images`.
 * Utilisé par les formulaires produits/services/cours/artiste et le Studio IA.
 */

import { uploadToSupabaseStorage, type UploadResult } from '@/utils/uploadToSupabase';
import { resizeToCatalogProduct } from '@/lib/images/resize-to-catalog';

export const CATALOG_IMAGE_BUCKET = 'product-images';

/** Sous-dossiers dans le bucket (chemins Storage stables). */
export type CatalogImagePath =
  | 'products'
  | 'services'
  | 'courses'
  | 'artist'
  | 'digital'
  | 'shop'
  | 'profile'
  | 'covers'
  | 'studio'
  | 'enhanced';

const PATH_PREFIX: Record<CatalogImagePath, string> = {
  products: 'products',
  services: 'services',
  courses: 'courses',
  artist: 'artist',
  digital: 'digital',
  shop: 'shop',
  profile: 'profile',
  covers: 'covers',
  studio: 'studio',
  enhanced: 'enhanced',
};

function isE2eUploadStubEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_E2E_UPLOAD_STUB === 'true';
}

function buildE2eStubUploadResult(catalogPath: CatalogImagePath): UploadResult {
  const path = `${PATH_PREFIX[catalogPath]}/e2e-stub-${Date.now()}.png`;
  return {
    success: true,
    url: `https://placehold.co/1536x1024/png?text=e2e-${catalogPath}`,
    path,
    error: null,
  };
}

const FILE_PREFIX: Record<CatalogImagePath, string> = {
  products: 'product',
  services: 'service',
  courses: 'course',
  artist: 'artwork',
  digital: 'product',
  shop: 'shop',
  profile: 'profile',
  covers: 'cover',
  studio: 'studio',
  enhanced: 'enhanced',
};

export interface UploadCatalogImageOptions {
  /** Recadrage 1536×1024 avant envoi (défaut: true). */
  normalizeToCatalogFormat?: boolean;
  filePrefix?: string;
  onProgress?: (progress: number) => void;
  maxSizeBytes?: number;
}

/**
 * Prépare puis envoie une image vers `product-images/{path}/…`
 */
export async function uploadCatalogImage(
  file: File,
  catalogPath: CatalogImagePath,
  options: UploadCatalogImageOptions = {}
): Promise<UploadResult> {
  const { normalizeToCatalogFormat = true, filePrefix, onProgress, maxSizeBytes } = options;

  if (isE2eUploadStubEnabled()) {
    options.onProgress?.(100);
    return buildE2eStubUploadResult(catalogPath);
  }

  const prepared = normalizeToCatalogFormat ? await resizeToCatalogProduct(file, file.name) : file;

  const storagePath = PATH_PREFIX[catalogPath];

  return uploadToSupabaseStorage(prepared, {
    bucket: CATALOG_IMAGE_BUCKET,
    path: storagePath,
    filePrefix: filePrefix ?? FILE_PREFIX[catalogPath],
    onProgress,
    maxSizeBytes,
  });
}

/** Plusieurs fichiers, progression globale 0–100. */
export async function uploadCatalogImages(
  files: File[],
  catalogPath: CatalogImagePath,
  options: UploadCatalogImageOptions = {}
): Promise<{ urls: string[]; errors: Error[] }> {
  if (isE2eUploadStubEnabled()) {
    options.onProgress?.(100);
    return {
      urls: files.map(() => buildE2eStubUploadResult(catalogPath).url!),
      errors: [],
    };
  }

  const urls: string[] = [];
  const errors: Error[] = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    const result = await uploadCatalogImage(file, catalogPath, {
      ...options,
      onProgress: p => {
        if (options.onProgress) {
          const global = ((i + p / 100) / total) * 100;
          options.onProgress(global);
        }
      },
    });
    if (result.success && result.url) {
      urls.push(result.url);
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { urls, errors };
}

/** Mappe un dossier Studio / contexte formulaire vers un chemin catalogue. */
export function studioFolderToCatalogPath(folder: string): CatalogImagePath {
  const map: Record<string, CatalogImagePath> = {
    products: 'products',
    product: 'products',
    services: 'services',
    service: 'services',
    courses: 'courses',
    course: 'courses',
    artist: 'artist',
    digital: 'digital',
    shop: 'shop',
    profile: 'profile',
    covers: 'covers',
    cover: 'covers',
    studio: 'studio',
    enhanced: 'enhanced',
  };
  return map[folder.replace(/^\/|\/$/g, '')] ?? 'products';
}
