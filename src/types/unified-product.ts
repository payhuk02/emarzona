/**
 * Types unifiés pour tous les produits e-commerce
 * Supporte: Digital, Physical, Service, Course, Artist + Affiliation
 */

import { Store } from './store';

export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export type ProductStatus = 'active' | 'draft' | 'archived';

/**
 * Interface de base commune à tous les produits
 */
export interface BaseProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  promo_price?: number;
  currency?: string;
  image_url?: string;
  images?: string[];
  store_id: string;
  store?: Store;
  type: ProductType;
  rating?: number;
  review_count?: number;
  purchases_count?: number;
  tags?: string[];
  category?: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;

  // Affiliation
  is_affiliate?: boolean;
  affiliate_percentage?: number;
  affiliate_earnings?: number;
  affiliate_enabled?: boolean;
  product_affiliate_settings?: Array<{
    commission_rate: number;
    affiliate_enabled: boolean;
  }> | null;

  // Statistics Display Settings
  hide_purchase_count?: boolean | null;
  hide_likes_count?: boolean | null;
  hide_recommendations_count?: boolean | null;
  hide_downloads_count?: boolean | null;
  hide_reviews_count?: boolean | null;
  hide_rating?: boolean | null;
}

/**
 * Produit Digital
 */
export interface DigitalProduct extends BaseProduct {
  type: 'digital';
  digital_type?: string; // software, ebook, template, plugin, etc.
  license_type?: string; // single, multi, unlimited, subscription, lifetime
  files?: Array<{
    id: string;
    name: string;
    url: string;
    size?: number;
    format?: string;
  }>;
  formats?: string[];
  file_size?: number;
  instant_delivery?: boolean;
  download_limit?: number;
  total_downloads?: number;
  version?: string;
  licensing_type?: 'plr' | 'copyrighted' | 'standard';
}

/**
 * Produit Physique
 */
export interface PhysicalProduct extends BaseProduct {
  type: 'physical';
  stock?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  shipping_required?: boolean;
  variants?: Array<{
    id: string;
    name: string;
    price?: number;
    stock?: number;
    sku?: string;
  }>;
  sku?: string;
  barcode?: string;
}

/**
 * Service
 */
export interface ServiceProduct extends BaseProduct {
  type: 'service';
  duration?: number;
  duration_unit?: 'minute' | 'hour' | 'day' | 'week';
  booking_required?: boolean;
  calendar_available?: boolean;
  staff_required?: boolean;
  location_type?: 'online' | 'on_site' | 'customer_location';
  service_type?: 'appointment' | 'class' | 'event' | 'consultation' | 'other';
}

/**
 * Cours en ligne
 */
export interface CourseProduct extends BaseProduct {
  type: 'course';
  modules?: Array<{
    id: string;
    title: string;
    duration?: number;
    lessons_count?: number;
  }>;
  video_preview?: string;
  access_type?: 'lifetime' | 'subscription';
  enrollment_count?: number;
  total_duration?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Œuvre d'Artiste
 */
export interface ArtistProduct extends BaseProduct {
  type: 'artist';
  artist_type?: 'writer' | 'musician' | 'visual_artist' | 'designer' | 'multimedia' | 'other';
  artist_name?: string;
  artist_bio?: string;
  artwork_title?: string;
  artwork_year?: number;
  artwork_medium?: string;
  artwork_dimensions?: {
    width?: number | null;
    height?: number | null;
    depth?: number | null;
    unit?: 'cm' | 'in';
  };
  edition_type?: 'original' | 'limited_edition' | 'print' | 'reproduction';
  edition_number?: number | null;
  total_editions?: number | null;
  requires_shipping?: boolean;
  shipping_fragile?: boolean;
  shipping_insurance_required?: boolean;
  shipping_handling_time?: number;
  certificate_of_authenticity?: boolean;
  signature_authenticated?: boolean;
  // Propriétés partagées avec d'autres types de produits
  is_featured?: boolean;
  pricing_model?: string | null;
  payment_options?: {
    payment_type?: 'full' | 'percentage' | 'delivery_secured';
    percentage_rate?: number;
  } | null;
  licensing_type?: 'plr' | 'copyrighted' | 'standard' | null;
  // Propriété spécifique pour les œuvres multimédias
  video_url?: string;
}

/**
 * Type unifié de produit (discriminated union)
 */
export type UnifiedProduct =
  | DigitalProduct
  | PhysicalProduct
  | ServiceProduct
  | CourseProduct
  | ArtistProduct;

/**
 * Props pour UnifiedProductCard
 */
export interface UnifiedProductCardProps {
  product: UnifiedProduct;
  variant?: 'marketplace' | 'store' | 'dashboard' | 'compact';
  showAffiliate?: boolean;
  showActions?: boolean;
  onAction?: (action: 'view' | 'buy' | 'favorite', product: UnifiedProduct) => void;
  className?: string;
}

/**
 * Informations clés à afficher selon le type
 */
export interface ProductKeyInfo {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: boolean;
}






