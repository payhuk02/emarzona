// Types partagés pour le Marketplace
import type { JSONValue } from './common';

export interface Product {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description?: string | null;
  price: number;
  promotional_price?: number | null;
  currency: string;
  image_url: string | null;
  images?: JSONValue; // Json field
  category: string | null;
  product_type: string | null;
  rating: number | null;
  reviews_count: number | null;
  is_active: boolean;
  is_draft: boolean | null;
  created_at: string;
  updated_at: string;
  tags?: string[];
  licensing_type?: 'standard' | 'plr' | 'copyrighted' | null;
  license_terms?: string | null;
  // Champs pour produits physiques
  free_shipping?: boolean | null;
  shipping_cost?: number | null;
  stock_quantity?: number | null;
  stores?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    created_at: string;
  } | null;
}

export interface FilterState {
  search: string;
  category: string;
  productType: string;
  licensingType?: 'all' | 'standard' | 'plr' | 'copyrighted';
  priceRange: string;
  rating: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  tags: string[];
  verifiedOnly: boolean;
  featuredOnly: boolean;
  inStock: boolean;

  // Filtres spécifiques Digital
  digitalSubType?: string;
  instantDelivery?: boolean;

  // Filtres spécifiques Physical
  stockAvailability?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  shippingType?: 'all' | 'free' | 'paid' | 'pickup';
  physicalCategory?: string;

  // Filtres spécifiques Service
  serviceType?: string;
  locationType?: 'all' | 'online' | 'on_site' | 'customer_location';
  calendarAvailable?: boolean;

  // Filtres spécifiques Course
  difficulty?: 'all' | 'beginner' | 'intermediate' | 'advanced';
  accessType?: 'all' | 'lifetime' | 'subscription';
  courseDuration?: 'all' | '<1h' | '1-5h' | '5-10h' | '10h+';

  // Filtres spécifiques Artist
  artistType?: string;
  editionType?: 'all' | 'original' | 'limited_edition' | 'print' | 'reproduction';
  certificateOfAuthenticity?: boolean;
  artworkAvailability?: 'all' | 'available' | 'limited' | 'sold_out';
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}






