// Types partagés pour le Marketplace
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
  images?: any; // Json field
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
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}
