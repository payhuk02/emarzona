/**
 * Types stricts pour le formulaire de création de produit digital
 * Date: 31 Janvier 2025
 *
 * Remplace les types `any` dans CreateDigitalProductWizard_v2
 */

export interface DigitalProductAffiliateSettings {
  enabled: boolean;
  commission_rate: number;
  commission_type: 'percentage' | 'fixed';
  fixed_commission_amount: number;
  cookie_duration_days: number;
  min_order_amount: number;
  allow_self_referral: boolean;
  require_approval: boolean;
  terms_and_conditions: string;
}

export interface DigitalProductSEO {
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
}

export interface DigitalProductFAQ {
  id?: string;
  question: string;
  answer: string;
  order?: number;
}

export interface DigitalProductDownloadableFile {
  id?: string;
  name: string;
  url: string;
  size?: number;
  format?: string;
  category?: string;
  version?: string;
  is_main?: boolean;
}

/**
 * Type strict pour les données du formulaire de produit digital
 */
export interface DigitalProductFormData {
  // Basic info
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: string;
  digital_type: string;
  image_url: string;
  images: string[];
  price: number;
  promotional_price: number | null;
  currency: string;
  pricing_model?: 'one-time' | 'subscription' | 'free' | 'pay-what-you-want';
  features?: string[];
  create_free_preview?: boolean;
  preview_content_description?: string;

  // Files
  main_file_url: string;
  main_file_version: string;
  downloadable_files: DigitalProductDownloadableFile[];

  // License Config
  license_type: 'single' | 'multi' | 'unlimited' | 'subscription' | 'lifetime';
  license_duration_days: number | null;
  max_activations: number;
  allow_license_transfer: boolean;
  auto_generate_keys: boolean;

  // Download Settings
  download_limit: number;
  download_expiry_days: number;
  require_registration: boolean;
  watermark_enabled: boolean;
  watermark_text: string;

  // Version
  version: string;

  // Affiliate
  affiliate: DigitalProductAffiliateSettings;

  // SEO
  seo: DigitalProductSEO;

  // FAQs
  faqs: DigitalProductFAQ[];

  // Licensing (PLR / Copyright)
  licensing_type: 'plr' | 'copyrighted' | 'standard';
  license_terms: string;

  // Metadata
  product_type: 'digital';
  is_active: boolean;
  store_id?: string;

  // Statistics Display Settings
  hide_purchase_count?: boolean;
  hide_likes_count?: boolean;
  hide_recommendations_count?: boolean;
  hide_downloads_count?: boolean;
  hide_reviews_count?: boolean;
  hide_rating?: boolean;
}

/**
 * Type pour les mises à jour partielles du formulaire
 */
export type DigitalProductFormDataUpdate = Partial<DigitalProductFormData> & {
  affiliate?: Partial<DigitalProductAffiliateSettings>;
  seo?: Partial<DigitalProductSEO>;
  faqs?: DigitalProductFAQ[];
  downloadable_files?: DigitalProductDownloadableFile[];
};






