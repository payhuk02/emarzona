/**
 * Physical Product Types
 * Date: 27 octobre 2025
 */

export interface PhysicalProductVariant {
  id?: string;
  option1_value: string;
  option2_value?: string;
  option3_value?: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  image_url?: string;
}

export interface PhysicalProductOption {
  name: string;
  values: string[];
}

export interface PhysicalProductDimensions {
  length: number | null;
  width: number | null;
  height: number | null;
  unit: 'cm' | 'in';
}

export interface PhysicalProductAffiliateSettings {
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

export interface PhysicalProductPaymentOptions {
  payment_type: 'full' | 'percentage' | 'delivery_secured';
  percentage_rate: number;
  min_percentage?: number;
}

export interface PhysicalProductFormData {
  // Basic Info
  name: string;
  slug?: string;
  description: string;
  short_description?: string;
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  images: string[];
  category_id: string | null;
  tags: string[];
  
  // Variants
  has_variants: boolean;
  variants: PhysicalProductVariant[];
  options: PhysicalProductOption[];
  
  // Inventory
  track_inventory: boolean;
  continue_selling_when_out_of_stock: boolean;
  inventory_policy: 'deny' | 'continue';
  quantity: number;
  sku: string;
  barcode: string;
  
  // Shipping
  requires_shipping: boolean;
  weight: number | null;
  weight_unit: 'kg' | 'lb' | 'g' | 'oz';
  dimensions: PhysicalProductDimensions;
  shipping_class: string | null;
  free_shipping: boolean;
  
  // Affiliate (optional)
  affiliate?: PhysicalProductAffiliateSettings;
  
  // Payment Options (optional)
  payment?: PhysicalProductPaymentOptions;
  
  // SEO & FAQs (optional)
  seo?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
  };
  faqs?: Array<{
    id?: string;
    question: string;
    answer: string;
    order?: number;
  }>;
  
  // Additional fields
  customs_value?: number | null;
  country_of_origin?: string;
  size_chart_id?: string | null;
  
  // Statistics Display Settings
  hide_purchase_count?: boolean;
  hide_likes_count?: boolean;
  hide_recommendations_count?: boolean;
  hide_downloads_count?: boolean;
  hide_reviews_count?: boolean;
  hide_rating?: boolean;
  
  // Meta
  is_active: boolean;
  store_id?: string;
}

/**
 * Type pour les mises à jour partielles du formulaire
 */
export type PhysicalProductFormDataUpdate = Partial<PhysicalProductFormData> & {
  affiliate?: Partial<PhysicalProductAffiliateSettings>;
  payment?: Partial<PhysicalProductPaymentOptions>;
  variants?: PhysicalProductVariant[];
};







