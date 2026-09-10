export { SmartImage, default as SmartImageDefault } from './SmartImage';
export type { SmartImageProps } from './SmartImage';
export { ImageEnhancer } from './ImageEnhancer';
export { ImageEnhancerStudio } from './ImageEnhancerStudio';
export { ImageStudioField } from './ImageStudioField';
export type { ImageStudioFieldProps } from './ImageStudioField';
export { ImageStudioFormField } from './ImageStudioFormField';
export type { ImageStudioFormFieldProps } from './ImageStudioFormField';
export { detectImageContext, detectImageContextDetailed } from '@/lib/images/detectContext';
export { useImageOptimizer } from '@/hooks/useImageOptimizer';
export {
  buildTransformedUrl,
  buildSrcSet,
  buildProductImageUrl,
  buildProductSrcSet,
  getPreferredDeliveryFormat,
  getProductImageDimensions,
} from '@/lib/images/supabaseTransform';
export type {
  TransformOptions,
  ImageFormat,
  ProductImageContext,
} from '@/lib/images/supabaseTransform';
export { compressImage, blobToFile } from '@/lib/images/compress';
export { resizeToCatalogProduct } from '@/lib/images/resize-to-catalog';
export {
  uploadCatalogImage,
  uploadCatalogImages,
  CATALOG_IMAGE_BUCKET,
} from '@/lib/images/product-image-upload';
