/**
 * Artist Product Types
 * Date: 28 Janvier 2025
 * Types pour les produits artistes (écrivains, musiciens, artistes visuels, etc.)
 */

export type ArtistType = 'writer' | 'musician' | 'visual_artist' | 'designer' | 'multimedia' | 'other';
export type EditionType = 'original' | 'limited_edition' | 'print' | 'reproduction';
export type BookFormat = 'paperback' | 'hardcover' | 'ebook';
export type AlbumFormat = 'cd' | 'vinyl' | 'digital' | 'cassette';
export type DesignLicenseType = 'exclusive' | 'non_exclusive' | 'royalty_free';
export type MediaType = 'video' | 'interactive' | 'installation' | 'nft';

export interface ArtistSocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export interface ArtworkDimensions {
  width: number | null;
  height: number | null;
  depth: number | null;
  unit: 'cm' | 'in';
}

// Spécificités par type d'artiste
export interface WriterProductData {
  book_isbn?: string;
  book_pages?: number | null;
  book_language?: string;
  book_format?: BookFormat;
  book_genre?: string;
  book_publisher?: string;
  book_publication_date?: string | null;
}

export interface MusicianProductData {
  album_format?: AlbumFormat;
  album_tracks?: Array<{
    title: string;
    duration: number; // secondes
    artist?: string;
  }>;
  album_genre?: string;
  album_label?: string;
  album_release_date?: string | null;
  album_duration?: number; // secondes totales
}

export interface VisualArtistProductData {
  artwork_style?: string; // 'realism', 'abstract', 'impressionism', etc.
  artwork_subject?: string; // 'portrait', 'landscape', 'still_life', etc.
  artwork_framed?: boolean;
  artwork_certificate_of_authenticity?: boolean;
}

export interface DesignerProductData {
  design_category?: string; // 'logo', 'template', 'illustration', etc.
  design_format?: string[]; // ['PSD', 'AI', 'PNG', 'SVG']
  design_license_type?: DesignLicenseType;
  design_commercial_use?: boolean;
}

export interface MultimediaProductData {
  media_type?: MediaType;
  media_duration?: number | null; // secondes
  media_resolution?: string;
  media_format?: string[];
}

export interface ArtistProductFormData {
  // Informations de base (héritées de PhysicalProductFormData)
  name: string;
  description: string;
  short_description?: string;
  price: number;
  compare_at_price: number | null;
  cost_per_item: number | null;
  images: string[];
  category_id: string | null;
  tags: string[];
  slug?: string;
  
  // Type d'artiste
  artist_type: ArtistType;
  
  // Informations artiste
  artist_name: string;
  artist_bio: string;
  artist_website: string;
  artist_photo_url?: string; // Photo de l'artiste
  artist_social_links: ArtistSocialLinks;
  
  // Informations œuvre
  artwork_title: string;
  artwork_year: number | null;
  artwork_medium: string;
  artwork_dimensions: ArtworkDimensions;
  artwork_link_url?: string; // Lien vers l'œuvre si non physique
  edition_type: EditionType;
  edition_number: number | null;
  total_editions: number | null;
  
  // Spécificités par type
  writer_specific?: WriterProductData;
  musician_specific?: MusicianProductData;
  visual_artist_specific?: VisualArtistProductData;
  designer_specific?: DesignerProductData;
  multimedia_specific?: MultimediaProductData;
  
  // Livraison
  requires_shipping: boolean;
  shipping_handling_time: number;
  shipping_fragile: boolean;
  shipping_insurance_required: boolean;
  shipping_insurance_amount: number | null;
  
  // Authentification
  certificate_of_authenticity: boolean;
  certificate_file_url: string;
  signature_authenticated: boolean;
  signature_location: string;
  
  // SEO & FAQs
  seo?: {
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_title?: string;
    og_description?: string;
    og_image?: string;
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  
  // Affiliation
  affiliate?: {
    enabled: boolean;
    commission_rate: number;
    commission_type: 'percentage' | 'fixed';
    fixed_commission_amount: number;
    cookie_duration_days: number;
    min_order_amount: number;
    allow_self_referral: boolean;
    require_approval: boolean;
    terms_and_conditions: string;
  };
  
  // Payment Options
  payment?: {
    payment_type: 'full' | 'percentage' | 'delivery_secured';
    percentage_rate: number;
  };
  
  // Meta
  is_active: boolean;
}

export interface ArtistProduct extends ArtistProductFormData {
  id: string;
  product_id: string;
  store_id: string;
  created_at: string;
  updated_at: string;
}

}
