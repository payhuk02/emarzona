/**
 * Types stricts pour ProductForm
 * Date: 31 Janvier 2025
 * 
 * Remplace les types `any` dans ProductForm.tsx
 */

export interface ProductSpecification {
  name: string;
  value: string;
  order?: number;
}

export interface DownloadableFile {
  id?: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  order?: number;
}

export interface CustomField {
  id?: string;
  name: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'date';
  order?: number;
}

export interface ProductFAQ {
  id?: string;
  question: string;
  answer: string;
  order?: number;
}

export interface ConversionPixel {
  id?: string;
  platform: 'facebook' | 'google' | 'tiktok' | 'pinterest';
  pixel_id: string;
  event_type: string;
}

export interface RetargetingPixel {
  id?: string;
  platform: 'facebook' | 'google' | 'tiktok' | 'pinterest';
  pixel_id: string;
  audience_id?: string;
}

export interface ProductVariant {
  id?: string;
  name: string;
  value: string;
  price_adjustment?: number;
  stock?: number;
  sku?: string;
  image_url?: string;
  order?: number;
}

export interface ProductFormData {
  // Informations de base
  name: string;
  slug: string;
  category: string;
  product_type: string;
  pricing_model: string;
  price: number;
  promotional_price: number | null;
  currency: string;
  
  // Description et contenu
  description: string;
  short_description: string;
  features: string[];
  specifications: ProductSpecification[];
  
  // Images et médias
  image_url: string;
  images: string[];
  video_url: string;
  gallery_images: string[];
  
  // Fichiers et téléchargements
  downloadable_files: DownloadableFile[];
  file_access_type: string;
  download_limit: number | null;
  download_expiry_days: number | null;
  
  // Champs personnalisés
  custom_fields: CustomField[];
  
  // FAQ
  faqs: ProductFAQ[];
  
  // SEO et métadonnées
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_image: string;
  og_title: string;
  og_description: string;
  
  // Analytics et tracking
  analytics_enabled: boolean;
  track_views: boolean;
  track_clicks: boolean;
  track_purchases: boolean;
  track_time_spent: boolean;
  google_analytics_id: string;
  facebook_pixel_id: string;
  google_tag_manager_id: string;
  tiktok_pixel_id: string;
  pinterest_pixel_id: string;
  advanced_tracking: boolean;
  custom_events: string[];
  
  // Pixels et tracking
  pixels_enabled: boolean;
  conversion_pixels: ConversionPixel[];
  retargeting_pixels: RetargetingPixel[];
  
  // Variantes et attributs
  variants: ProductVariant[];
  color_variants: boolean;
  size_variants: boolean;
  pattern_variants: boolean;
  finish_variants: boolean;
  dimension_variants: boolean;
  weight_variants: boolean;
  centralized_stock: boolean;
  low_stock_alerts: boolean;
  preorder_allowed: boolean;
  hide_when_out_of_stock: boolean;
  different_prices_per_variant: boolean;
  price_surcharge: boolean;
  quantity_discounts: boolean;
  
  // Promotions
  promotions_enabled: boolean;
  discount_percentage: boolean;
  discount_fixed: boolean;
  buy_one_get_one: boolean;
  family_pack: boolean;
  
  // Dates et métadonnées
  created_at?: string;
  updated_at?: string;
  version?: number;
}

/**
 * Type pour les mises à jour partielles du formulaire
 */
export type ProductFormDataUpdate = Partial<ProductFormData> & {
  [key: string]: unknown; // Pour permettre les mises à jour dynamiques
};

