/**
 * Œuvres vendeur — produits type "artist" de la boutique active.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SELLER_ARTIST_FIELDS = `
  id,
  name,
  slug,
  price,
  currency,
  image_url,
  images,
  is_active,
  is_draft,
  created_at,
  updated_at,
  artist_products (
    id,
    artwork_title,
    artist_name,
    artwork_edition_type,
    edition_number,
    total_editions,
    artwork_year,
    artwork_medium,
    certificate_of_authenticity
  )
`;

export interface SellerArtistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image_url: string | null;
  images: string[] | null;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
  artist_products: Array<{
    id: string;
    artwork_title: string | null;
    artist_name: string | null;
    artwork_edition_type: string | null;
    edition_number: number | null;
    total_editions: number | null;
    artwork_year: number | null;
    artwork_medium: string | null;
    certificate_of_authenticity: boolean | null;
  }> | null;
}

export function useSellerArtistProducts(storeId?: string) {
  return useQuery({
    queryKey: ['seller-artist-products', storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(SELLER_ARTIST_FIELDS)
        .eq('store_id', storeId!)
        .eq('product_type', 'artist')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as SellerArtistProduct[];
    },
    staleTime: 60_000,
  });
}
