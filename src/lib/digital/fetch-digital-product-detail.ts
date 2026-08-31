import { supabase } from '@/integrations/supabase/client';
import type { ProductFAQ } from '@/types/product-form';

export const STORE_PUBLIC_FIELDS = 'id, name, slug, logo_url';

export const PRODUCT_DIGITAL_FIELDS =
  'id, store_id, slug, name, description, short_description, category, tags, product_type, is_active, price, promotional_price, currency, pricing_model, image_url, images, meta_title, meta_description, og_image, faqs, licensing_type, license_terms, hide_purchase_count, hide_likes_count, hide_recommendations_count, hide_downloads_count, hide_reviews_count, hide_rating, whatsapp_number, whatsapp_enabled, created_at, updated_at';

export const DIGITAL_PRODUCT_ROW_FIELDS =
  'id, product_id, digital_type, license_type, license_duration_days, max_activations, allow_license_transfer, auto_generate_keys, main_file_url, main_file_size_mb, main_file_format, main_file_version, total_files, total_size_mb, download_limit, download_expiry_days, require_registration, watermark_enabled, watermark_text, version, total_downloads, created_at, updated_at';

export const DIGITAL_PRODUCT_FILE_FIELDS =
  'id, digital_product_id, name, file_url, file_size_mb, file_type, category, version, is_main, is_preview, order_index, download_count';

export type DigitalProductDetailStore = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

export type DigitalProductDetailFile = {
  id: string;
  digital_product_id: string;
  name: string;
  file_url: string;
  file_size_mb: number;
  file_type: string;
  category?: string | null;
  version?: string | null;
  is_main?: boolean | null;
  is_preview?: boolean | null;
  order_index?: number | null;
  download_count?: number | null;
};

export type DigitalProductDetailProduct = {
  id: string;
  store_id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  category: string | null;
  tags: string[] | null;
  product_type: string;
  is_active: boolean;
  price: number;
  promotional_price: number | null;
  currency: string;
  pricing_model: string | null;
  image_url: string | null;
  images: string[] | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  faqs: ProductFAQ[] | null;
  licensing_type: string | null;
  license_terms: string | null;
  hide_purchase_count: boolean | null;
  hide_likes_count: boolean | null;
  hide_recommendations_count: boolean | null;
  hide_downloads_count: boolean | null;
  hide_reviews_count: boolean | null;
  hide_rating: boolean | null;
  whatsapp_number: string | null;
  whatsapp_enabled: boolean | null;
  created_at: string;
  updated_at: string;
};

export type DigitalProductDetailData = {
  id: string;
  product_id: string;
  digital_type: string;
  license_type: string;
  license_duration_days: number | null;
  max_activations: number | null;
  allow_license_transfer: boolean | null;
  auto_generate_keys: boolean | null;
  main_file_url: string | null;
  main_file_size_mb: number | null;
  main_file_format: string | null;
  main_file_version: string | null;
  total_files: number | null;
  total_size_mb: number | null;
  download_limit: number | null;
  download_expiry_days: number | null;
  require_registration: boolean | null;
  watermark_enabled: boolean | null;
  watermark_text: string | null;
  version: string | null;
  total_downloads: number | null;
  created_at: string;
  updated_at: string;
  product: DigitalProductDetailProduct;
  files: DigitalProductDetailFile[];
  store: DigitalProductDetailStore | null;
};

/** Public marketplace detail — `productId` is `products.id`. */
export async function fetchDigitalProductDetail(
  productId: string
): Promise<DigitalProductDetailData> {
  const { data: productData, error: productError } = await supabase
    .from('products')
    .select(PRODUCT_DIGITAL_FIELDS)
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  let store: DigitalProductDetailStore | null = null;
  if (productData.store_id) {
    const { data: storeRow } = await supabase
      .from('stores_public')
      .select(STORE_PUBLIC_FIELDS)
      .eq('id', productData.store_id)
      .maybeSingle();
    store = storeRow;
  }

  const { data: digitalData, error: digitalError } = await supabase
    .from('digital_products')
    .select(DIGITAL_PRODUCT_ROW_FIELDS)
    .eq('product_id', productId)
    .maybeSingle();

  if (digitalError) throw digitalError;
  if (!digitalData) {
    throw new Error('Produit digital non trouvé');
  }

  const { data: filesData, error: filesError } = await supabase
    .from('digital_product_files')
    .select(DIGITAL_PRODUCT_FILE_FIELDS)
    .eq('digital_product_id', digitalData.id)
    .order('order_index', { ascending: true });

  if (filesError) throw filesError;

  return {
    ...(digitalData as Omit<DigitalProductDetailData, 'product' | 'files' | 'store'>),
    product: productData as DigitalProductDetailProduct,
    files: (filesData ?? []) as DigitalProductDetailFile[],
    store,
  };
}
