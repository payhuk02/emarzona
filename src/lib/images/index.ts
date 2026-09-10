/**
 * Point d'entrée unifié — images catalogue / delivery / compression.
 */

export {
  buildTransformedUrl,
  buildSrcSet,
  buildProductImageUrl,
  buildProductSrcSet,
  getPreferredDeliveryFormat,
  getProductImageDimensions,
  isImageTransformationsEnabled,
  toObjectPublicUrl,
  type TransformOptions,
  type ImageFormat,
  type ProductImageContext,
} from '@/lib/images/supabaseTransform';

export { compressImage, blobToFile, type CompressOptions } from '@/lib/images/compress';

export { resizeToCatalogProduct } from '@/lib/images/resize-to-catalog';

export {
  uploadCatalogImage,
  uploadCatalogImages,
  studioFolderToCatalogPath,
  CATALOG_IMAGE_BUCKET,
  type CatalogImagePath,
  type UploadCatalogImageOptions,
} from '@/lib/images/product-image-upload';

export { detectImageContext, detectImageContextDetailed } from '@/lib/images/detectContext';
